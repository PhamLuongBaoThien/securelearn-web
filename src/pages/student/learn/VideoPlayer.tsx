// [TRÌNH PHÁT VIDEO BẢO MẬT & HEARTBEAT - BƯỚC 2 ĐẾN 2.8 & BƯỚC 3]
// Component phát video bài học bảo mật tích hợp HLS (HTTP Live Streaming) và chống gian lận/quay lén màn hình.
// Vai trò các bước:
// - BƯỚC 2: Khởi tạo, xin Playback Session và nạp Hls.js đính kèm JWT.
// - BƯỚC 2.1: Chống tua nhanh (Anti-seek), hiển thị Watermark động, chặn tổ hợp phím tắt F12/Inspect/Chuột phải.
// - BƯỚC 2.5: Lưu tiến độ tức thời (flushProgress) khi pause, kết thúc, chuyển tab.
// - BƯỚC 2.6: Heartbeat Engine, giãn cách gửi heartbeat 10s và giới hạn delta xem thực.
// - BƯỚC 2.7: Luồng tự động gia hạn và khôi phục video (Proactive & Reactive Renew, Hls.js Error recovery).
// - BƯỚC 2.8: Các cơ chế tối ưu UX & Lọc Request HLS (Autorization bypass cho S3, Resume Playback, Playback Rate Sync).
// - BƯỚC 3: Heartbeat & Access Control phía progress-service (gửi payload định kỳ).

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type SyntheticEvent } from 'react';
import Hls from 'hls.js';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import { Info, Loader2, Shield, VideoOff } from 'lucide-react';
import { toast } from 'sonner';
import { getAccessToken, getApiBaseUrl } from '@/services/apiClient';
import { useCreatePlaybackSession } from '@/hooks/useCourseLearning';
import { useProgressHeartbeat } from '@/hooks/useLearningProgress';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ILesson } from '@/services/courseApi';
import {
  formatWatermarkText,
  isBlockedProtectionKey,
  shouldIgnoreProtectionShortcut,
  type WatermarkIdentity,
  watermarkPositions,
  WATERMARK_ROTATION_MS,
} from '@/lib/contentProtection';


// [BƯỚC 2.8: LỌC YÊU CẦU FILE SEGMENT CHO HLS (AUTHORIZATION BYPASS)]
// Kiểm tra xem request có phải là tải phân đoạn video trực tiếp từ S3/MinIO không
const isHlsStorageRequest = (url: string) =>
  /\.(ts|m4s|mp4)(?:[?#]|$)/i.test(url) ||
  url.includes('/securelearn-media/') ||
  url.includes('X-Amz-Signature=') ||
  url.includes('X-Amz-Credential=');

// Hàm này kiểm tra xem URL có phải là URL của file segment video không

const shouldAttachAuthToHlsRequest = (url: string) => {
  if (isHlsStorageRequest(url)) return false;
  // Manifest dùng one-time token; endpoint lấy AES key bắt buộc JWT của user.
  if (/\/api\/media\/videos\/[^/]+\/playback(?:[?#]|$)/.test(url)) return false;
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.pathname.startsWith('/api/');
  } catch {
    return url.startsWith('/api/');
  }
};
const absoluteApiUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) return path;
  const base = getApiBaseUrl() || window.location.origin;
  return new URL(path, base).toString();
};

const HEARTBEAT_MS = 10_000;
const MAX_HEARTBEAT_DELTA_SECONDS = 10; // Khoảng cách tối đa giữa 2 lần heartbeat
const MAX_VALID_WATCH_GAP_SECONDS = 15; // Khoảng cách thời gian tối đa được tính là "xem" (không tính là bỏ qua)
const SEEK_WARNING_THRESHOLD_SECONDS = 10;
// [BƯỚC 2.8: TẠM ẨN CẢNH BÁO TUA NHANH 24H BẰNG LOCALSTORAGE]
const SEEK_WARNING_SUPPRESS_KEY = 'securelearn.progress.seek-warning.until';
const SEEK_WARNING_SUPPRESS_MS = 24 * 60 * 60 * 1000;
const SEEK_WARNING_COOLDOWN_MS = 8_000;
const FALLBACK_SEGMENT_EXPIRES_IN_SECONDS = 3600;
const MANIFEST_RENEW_BUFFER_MS = 60_000;
// Kiểm tra xem cảnh báo tua nhanh có đang được tạm ẩn trong vòng 24h không
const isSeekWarningSuppressed = () => {
  const raw = window.localStorage.getItem(SEEK_WARNING_SUPPRESS_KEY);
  if (!raw) return false;
  const until = Number(raw);
  if (!Number.isFinite(until)) {
    window.localStorage.removeItem(SEEK_WARNING_SUPPRESS_KEY);
    return false;
  }
  if (until <= Date.now()) {
    window.localStorage.removeItem(SEEK_WARNING_SUPPRESS_KEY);
    return false;
  }
  return true;
};

interface VideoPlayerProps {
  courseId: string;
  lesson: ILesson;
  watermarkIdentity?: WatermarkIdentity;
  onTimeChange?: (seconds: number) => void;
  initialPositionSeconds?: number;
  pauseSignal?: number;
  onOpenNotes?: (timestampSeconds: number) => void;
}

export function VideoPlayer({
  courseId,
  lesson,
  watermarkIdentity,
  onTimeChange,
  initialPositionSeconds = 0,
  pauseSignal = 0,
  onOpenNotes,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const onOpenNotesRef = useRef(onOpenNotes);
  const onTimeChangeRef = useRef(onTimeChange);
  const lastReportedPlaybackSecondRef = useRef(-1);
  const sessionId = useMemo(() => crypto.randomUUID(), []);
  const lastPositionRef = useRef(0);
  const seekOriginRef = useRef(0);
  const lastSeekWarningAtRef = useRef(0);
  const hasAppliedInitialPositionRef = useRef(false);
  const pendingPlaybackResumeRef = useRef<number | null>(null);
  const resumePlaybackAfterRenewRef = useRef(false);
  const manifestExpiresAtRef = useRef(0);
  const proactiveRenewTimerRef = useRef<number | null>(null);
  const playbackRecoveringRef = useRef(false);
  const [playbackReloadKey, setPlaybackReloadKey] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const playbackSession = useCreatePlaybackSession();
  const createPlayback = playbackSession.mutateAsync;
  const progressHeartbeat = useProgressHeartbeat(courseId);
  const sendProgressHeartbeat = progressHeartbeat.mutate;
  const progressHeartbeatPending = progressHeartbeat.isPending;
  const [watermarkIndex, setWatermarkIndex] = useState(0);
  const [watermarkTime, setWatermarkTime] = useState(() => new Date());
  const watermarkText = formatWatermarkText(
    { ...watermarkIdentity, sessionId },
    watermarkTime,
  );

  useEffect(() => {
    onOpenNotesRef.current = onOpenNotes;
    onTimeChangeRef.current = onTimeChange;
  }, [onOpenNotes, onTimeChange]);

  const reportPlaybackTime = useCallback((seconds: number, force = false) => {
    if (!Number.isFinite(seconds)) return;
    const playbackSecond = Math.max(0, Math.floor(seconds));
    if (!force && playbackSecond === lastReportedPlaybackSecondRef.current) return;
    lastReportedPlaybackSecondRef.current = playbackSecond;
    onTimeChangeRef.current?.(seconds);
  }, []);

  const showSeekWarning = useCallback(() => {
    const now = Date.now();
    if (isSeekWarningSuppressed()) return;
    if (now - lastSeekWarningAtRef.current < SEEK_WARNING_COOLDOWN_MS) return;
    lastSeekWarningAtRef.current = now;

    toast.custom((toastId) => (
      <div className="w-[360px] rounded-lg border border-amber-200 bg-white p-4 shadow-lg dark:border-amber-900/60 dark:bg-zinc-950">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Đoạn tua nhanh sẽ không được tính vào tiến độ học.
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Bạn vẫn có thể tiếp tục xem video, nhưng hệ thống chỉ ghi nhận các đoạn được phát thực tế.
        </p>
        <label className="mt-3 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300"
            onChange={(event) => {
              if (event.currentTarget.checked) {
                window.localStorage.setItem(
                  SEEK_WARNING_SUPPRESS_KEY,
                  String(Date.now() + SEEK_WARNING_SUPPRESS_MS),
                );
              } else {
                window.localStorage.removeItem(SEEK_WARNING_SUPPRESS_KEY);
              }
            }}
          />
          Không hiện lại trong 1 ngày
        </label>
        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => toast.dismiss(toastId)}
          >
            Đã hiểu
          </Button>
        </div>
      </div>
    ), {
      duration: 12000,
    });
  }, []);

  // Recover playback session hook này dùng để khôi phục session khi segment hết hạn
  const recoverPlaybackSession = useCallback((resumeAfterRenew = false) => {
    const video = videoRef.current;
    if (!video || playbackRecoveringRef.current) return;
    playbackRecoveringRef.current = true;
    if (resumeAfterRenew) resumePlaybackAfterRenewRef.current = true;
    pendingPlaybackResumeRef.current = Number.isFinite(video.currentTime) ? video.currentTime : lastPositionRef.current;
    hasAppliedInitialPositionRef.current = false;
    setPlaybackReloadKey((current) => current + 1);
    window.setTimeout(() => {
      playbackRecoveringRef.current = false;
    }, 1500);
  }, []);

  // Clear proactive renew timer hook này dùng để xóa timer khi segment hết hạn (segment là các đoạn video được cắt ra để phát, xóa timer để tránh segment hết hạn mà không khôi phục session)
  const clearProactiveRenewTimer = useCallback(() => {
    if (proactiveRenewTimerRef.current) {
      window.clearTimeout(proactiveRenewTimerRef.current);
      proactiveRenewTimerRef.current = null;
    }
  }, []);

  // [BƯỚC 2.7: LUỒNG A - GIA HẠN MANIFEST CHỦ ĐỘNG (PROACTIVE RENEW)]
  // Hàm scheduleProactiveRenew dùng để lên lịch hẹn giờ (setTimeout) làm mới session xem video.
  // Nhận expiresInSeconds từ Backend (thường là 3600s = 1 giờ). Hệ thống sẽ tự động trừ đi 60s
  // và hẹn giờ gọi recoverPlaybackSession() trước khi token/presigned URL của phân đoạn HLS (.ts) hết hạn.
  const scheduleProactiveRenew = useCallback((expiresInSeconds?: number) => {
    clearProactiveRenewTimer();
    const ttlSeconds = Number.isFinite(expiresInSeconds) && expiresInSeconds! > 0
      ? expiresInSeconds!
      : FALLBACK_SEGMENT_EXPIRES_IN_SECONDS;
    const delayMs = Math.max(10_000, ttlSeconds * 1000 - MANIFEST_RENEW_BUFFER_MS);
    proactiveRenewTimerRef.current = window.setTimeout(() => {
      const video = videoRef.current;
      // Chỉ tự động gia hạn nếu học viên đang mở tab và video không bị tạm dừng hoặc đã kết thúc
      if (!video || video.paused || video.ended || document.visibilityState !== 'visible') return;
      recoverPlaybackSession();
    }, delayMs);
  }, [clearProactiveRenewTimer, recoverPlaybackSession]);

  // [BƯỚC 2.7: LUỒNG B - GIA HẠN PHẢN ỨNG (REACTIVE RENEW) & FOCUS/VISIBILITY CHECK]
  // Hàm này kiểm tra xem link manifest hiện tại đã hết hạn (hoặc chuẩn bị hết hạn trong 60s tới) chưa.
  // Nếu có, hệ thống lập tức gọi khôi phục session để nạp lại nguồn phát mới.
  const renewPlaybackIfExpiringSoon = useCallback((resumeAfterRenew = false) => {
    if (!lesson.videoAssetId) return false;
    if (!manifestExpiresAtRef.current) return false;
    if (Date.now() >= manifestExpiresAtRef.current - MANIFEST_RENEW_BUFFER_MS) {
      recoverPlaybackSession(resumeAfterRenew);
      return true;
    }
    return false;
  }, [lesson.videoAssetId, recoverPlaybackSession]);

  // Video player hook này dùng để xử lý video và các tương tác với video
  useEffect(() => {
    const video = videoRef.current;
    const videoAssetId = lesson.videoAssetId;
    if (!video || !videoAssetId) return;

    let hls: Hls | null = null; // Hls là thư viện xử lý video HLS
    let canceled = false; // Flag để đánh dấu khi video bị hủy

    const setupPlayback = async () => {
      // Mỗi lần mở video, FE phải xin playback session mới.
      // Backend không trả thẳng manifest (.m3u8) hoặc key ( #EXT-X-KEY METHOD=AES-128...) ngay lập tức mà chỉ trả one-time playbackUrl (dùng 1 lần là hết hạn).
      // Khi manifest/segment cần làm mới, gọi lại endpoint có JWT và kiểm tra entitlement.
      const session = await createPlayback(videoAssetId);
      if (canceled) return;
      const segmentExpiresIn = session.segmentExpiresIn ?? FALLBACK_SEGMENT_EXPIRES_IN_SECONDS;
      manifestExpiresAtRef.current = Date.now() + segmentExpiresIn * 1000;
      scheduleProactiveRenew(segmentExpiresIn);
      const manifestUrl = absoluteApiUrl(session.playbackUrl);

      // [BẢO MẬT STREAMING - BƯỚC 2]
      // Nếu trình duyệt hỗ trợ Hls.js, tiến hành load source manifest HLS được bảo vệ (.m3u8).
      if (Hls.isSupported()) {
        hls = new Hls({
          // [BƯỚC 2.8: ĐÍNH KÈM JWT QUA XHRSETUP CHO CÁC API HOÀN THIỆN ĐỊNH DANH]
          // xhrSetup được chạy trước mỗi request tải Playlist HLS hoặc Key giải mã.
          // Tự động đính kèm header Authorization chứa Bearer JWT token của user để xác thực quyền truy cập.
          // Không gửi JWT khi request các phân đoạn video (.ts) trực tiếp từ MinIO storage (kiểm tra qua shouldAttachAuthToHlsRequest).

          // xhrSetup là một callback function được gọi trước mỗi request tải Playlist HLS hoặc Key giải mã.
          xhrSetup: (xhr, url) => {
            // Nếu không cần đính kèm JWT (là file .ts hoặc URL đã được rewrite), bỏ qua
            if (!shouldAttachAuthToHlsRequest(url)) return;
            // Lấy JWT từ bộ nhớ RAM (In-Memory) thông qua apiClient
            const token = getAccessToken();
            // Nếu có token, đính kèm vào header Authorization
            if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.withCredentials = true;
          },
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          // Hls.js tự retry các timeout/lỗi tải segment không fatal. Chỉ tạo playback session mới
          // khi token/quyền đã hết hiệu lực hoặc lỗi network đã trở thành fatal.
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            const networkStatus = Number(
              data.response?.code
              ?? data.networkDetails?.status
              ?? data.networkDetails?.statusCode,
            );
            const playbackAccessExpired = [401, 403, 410].includes(networkStatus);
            if (playbackAccessExpired || data.fatal) recoverPlaybackSession();
            return;
          }
          // Lỗi media fatal có thể phục hồi tại chỗ, không cần phá HLS session hiện tại.
          if (data.fatal && data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls?.recoverMediaError();
            return;
          }
          if (data.fatal) recoverPlaybackSession();
        });
        hls.loadSource(manifestUrl); // manifestUrl là URL của file playlist HLS (.m3u8) được bảo vệ. .load Source() là phương thức của Hls.js để load source HLS.
        hls.attachMedia(video); // .attachMedia() là phương thức của Hls.js để attach media player.
        return;
      }

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = manifestUrl;
      }
    };

    setupPlayback().catch(() => {
      if (!canceled) video.removeAttribute('src');
    });

    return () => {
      canceled = true;
      clearProactiveRenewTimer();
      hls?.destroy();
      video.removeAttribute('src');
    };
  }, [clearProactiveRenewTimer, createPlayback, lesson.videoAssetId, lesson._id, playbackReloadKey, recoverPlaybackSession, scheduleProactiveRenew]);

  useEffect(() => {
    if (!pauseSignal) return;
    videoRef.current?.pause();
  }, [pauseSignal]);

  useEffect(() => {
    // [BƯỚC 2.7: LUỒNG B - LẮNG NGHE FOCUS/VISIBILITY CHANGE ĐỂ TỰ ĐỘNG RENEW]
    // Nếu học viên quay lại học sau một thời gian dài rời đi, hệ thống kiểm tra và tự động gia hạn session nếu hết hạn.
    const handlePlaybackResume = () => {
      if (document.visibilityState === 'visible') {
        renewPlaybackIfExpiringSoon();
      }
    };
    document.addEventListener('visibilitychange', handlePlaybackResume);
    window.addEventListener('focus', handlePlaybackResume);
    return () => {
      document.removeEventListener('visibilitychange', handlePlaybackResume);
      window.removeEventListener('focus', handlePlaybackResume);
    };
  }, [renewPlaybackIfExpiringSoon]);

  // [BƯỚC 2.8: PHỤC HỒI TIẾN ĐỘ BẮT ĐẦU (INITIAL POSITION SETUP)]
  // Khởi chạy lúc nạp bài học mới: Cài đặt vị trí phát ban đầu (`initialPositionSeconds`)
  // lấy từ DB tiến độ của progress-service và đồng bộ biến lastPosition để theo dõi thời gian thực xem.
  useEffect(() => {
    hasAppliedInitialPositionRef.current = false;
    lastPositionRef.current = Math.max(0, Math.floor(initialPositionSeconds || 0));
  }, [initialPositionSeconds, lesson._id]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !lesson._id) return;

    // [TIẾN ĐỘ & HEARTBEAT - BƯỚC 3]
    // Hàm gửi heartbeat lên progress-service để ghi nhận tiến trình học tập
    const sendHeartbeat = (deltaSeconds = 0, segmentStartSeconds = video.currentTime) => {
      sendProgressHeartbeat({
        courseId,
        lessonId: lesson._id!,
        lessonType: 'VIDEO',
        sessionId,
        positionSeconds: Math.floor(video.currentTime),
        watchedSecondsDelta: deltaSeconds, // Số giây thực xem
        segmentStartSeconds: Math.floor(segmentStartSeconds),
        playbackRate: video.playbackRate,
        tabVisible: document.visibilityState === 'visible',
      });
    };

    // [BƯỚC 2.5: ĐỒNG BỘ TIẾN ĐỘ TỨC THỜI (FLUSH PROGRESS)]
    // Đồng bộ nhanh tiến độ khi học viên pause video, chuyển tab hoặc kết thúc video
    const flushProgress = () => {
      const currentTime = Math.floor(video.currentTime);
      const watchedSeconds = Math.floor(video.currentTime - lastPositionRef.current);
      if (currentTime <= 0) return;
      const deltaSeconds = watchedSeconds > 0 && watchedSeconds <= MAX_VALID_WATCH_GAP_SECONDS
        ? Math.min(MAX_HEARTBEAT_DELTA_SECONDS, watchedSeconds)
        : 0;
      sendHeartbeat(deltaSeconds, deltaSeconds > 0 ? lastPositionRef.current : video.currentTime);
      lastPositionRef.current = video.currentTime;
    };

    // [BƯỚC 2.6: HEARTBEAT ENGINE & GIẢI TẦN SUẤT / CHỐNG SPAM HEARTBEAT]
    // Thiết lập vòng lặp interval gửi heartbeat định kỳ mỗi 10 giây.
    // Kiểm tra chéo: nếu tab ẩn hoặc đang tua (isSeeking) hoặc đang pause thì KHÔNG gửi heartbeat.
    // watchedSecondsDelta chỉ được ghi nhận tối đa là 10 giây (bảo vệ chống hack gửi thời gian ảo).
    const interval = window.setInterval(() => {
      if (
        !isPlaying ||
        isSeeking ||
        document.visibilityState !== 'visible' ||
        video.paused ||
        video.ended ||
        progressHeartbeatPending
      ) return;

      const watchedSeconds = Math.floor(video.currentTime - lastPositionRef.current);
      if (watchedSeconds < 1 || watchedSeconds > MAX_VALID_WATCH_GAP_SECONDS) {
        lastPositionRef.current = video.currentTime;
        return;
      }

      sendHeartbeat(Math.min(MAX_HEARTBEAT_DELTA_SECONDS, watchedSeconds), lastPositionRef.current);
      lastPositionRef.current = video.currentTime;
    }, HEARTBEAT_MS);

    const handlePlay = () => {
      lastPositionRef.current = video.currentTime;
      sendHeartbeat(0);
    };
    const handlePause = () => flushProgress();
    const handleEnded = () => flushProgress();
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') flushProgress();
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.clearInterval(interval);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [
    courseId,
    isPlaying,
    isSeeking,
    lesson._id,
    progressHeartbeatPending,
    sendProgressHeartbeat,
    sessionId,
  ]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setWatermarkIndex((current) => (current + 1) % watermarkPositions.length);
      setWatermarkTime(new Date());
    }, WATERMARK_ROTATION_MS);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const player = new Plyr(video, {
      iconUrl: '/plyr.svg',
      blankVideo: 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAAhtZGF0', // chuỗi có ý nghĩa để tránh lỗi 404 khi không có video nào được load
      controls: [
        'play-large',
        'play',
        'progress',
        'current-time',
        'duration',
        'mute',
        'volume',
        'settings',
        'fullscreen',
      ],
      settings: ['speed'],
      speed: {
        selected: 1,
        options: [0.5, 0.75, 1, 1.25, 1.5, 2],
      },
      fullscreen: {
        enabled: true,
        fallback: true,
        iosNative: false,
        container: '.secure-video-player-shell',
      },
      keyboard: {
        focused: true,
        global: false,
      },
      tooltips: {
        controls: true,
        seek: true,
      },
      hideControls: true,
      clickToPlay: true,
      disableContextMenu: true,
      i18n: {
        play: 'Phát',
        pause: 'Tạm dừng',
        mute: 'Tắt âm thanh',
        unmute: 'Bật âm thanh',
        settings: 'Cài đặt',
        speed: 'Tốc độ',
        normal: 'Bình thường',
        enterFullscreen: 'Toàn màn hình',
        exitFullscreen: 'Thoát toàn màn hình',
      },
    });

    const controls = player.elements.controls;
    const fullscreenButton = player.elements.buttons.fullscreen;
    const notesButton = document.createElement('button');
    notesButton.type = 'button';
    notesButton.className = 'plyr__control plyr__controls__item';
    notesButton.setAttribute('aria-label', 'Mở ghi chú tại thời điểm hiện tại');
    notesButton.innerHTML = `
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M13.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.5L13.5 2Z" />
        <polyline points="13 2 13 9 20 9" />
        <path d="M9 15h6" />
        <path d="M12 12v6" />
      </svg>
      <span class="plyr__tooltip" role="tooltip">Ghi chú</span>
    `;

    const openNotes = () => {
      const timestampSeconds = video.currentTime;
      player.pause();
      let hasNavigated = false;
      const navigateToNotes = () => {
        if (hasNavigated) return;
        hasNavigated = true;
        window.requestAnimationFrame(() => onOpenNotesRef.current?.(timestampSeconds));
      };

      if (player.fullscreen.active) {
        player.once('exitfullscreen', navigateToNotes);
        player.fullscreen.exit();
        window.setTimeout(navigateToNotes, 400);
      } else {
        navigateToNotes();
      }
    };

    notesButton.addEventListener('click', openNotes);
    if (controls) controls.insertBefore(notesButton, fullscreenButton || null);

    return () => {
      notesButton.removeEventListener('click', openNotes);
      notesButton.remove();
      player.destroy();
    };
  }, []);

  useEffect(() => {
    // [BƯỚC 2.1: BẢO VỆ PHÍA CLIENT - CHẶN PHÍM TẮT F12/INSPECT/PRINT]
    const handleKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreProtectionShortcut()) return;
      if (isBlockedProtectionKey(event)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  const handleContextMenu = useCallback((event: MouseEvent) => event.preventDefault(), []); // [BƯỚC 2.1: CHẶN CHUỘT PHẢI]
  const blockProtectedEvent = useCallback((event: SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  if (!lesson.videoAssetId) {
    return (
      <div className="flex aspect-video items-center justify-center bg-black text-zinc-300">
        <div className="text-center">
          <VideoOff className="mx-auto h-8 w-8" />
          <p className="mt-2 text-sm">Bài học chưa có video.</p>
        </div>
      </div>
    );
  }

  if (playbackSession.error || playbackSession.data?.asset.status === 'FAILED') {
    return (
      <div className="flex aspect-video items-center justify-center bg-black px-6 text-center text-sm text-zinc-300">
        Video chưa sẵn sàng hoặc bạn không còn quyền truy cập.
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div
        className="secure-video-player-shell relative aspect-video w-full select-none overflow-hidden bg-black"
        onContextMenu={handleContextMenu}
        onCopy={blockProtectedEvent}
        onCut={blockProtectedEvent}
        onDragStart={blockProtectedEvent}
      >
        <video
          ref={videoRef}
          controls
          playsInline
          preload="metadata"
          className="h-full w-full"
          onLoadedMetadata={(event) => {
            const video = event.currentTarget;
            // [BƯỚC 2.7: LUỒNG D - PHỤC HỒI TRẠNG THÁI PHÁT (STATE RESUMPTION & UX PRESERVATION)]
            // [BƯỚC 2.8: KHÔI PHỤC VỊ TRÍ HỌC CŨ TỪ INITIAL POSITION SECONDS]
            // Ưu tiên sử dụng pendingPlaybackResumeRef (nếu vừa gia hạn session giữa chừng),
            // sau đó mới dùng initialPositionSeconds (nếu bắt đầu mở bài học lần đầu).
            const resumePosition = pendingPlaybackResumeRef.current ?? initialPositionSeconds;
            const shouldResumePlayback = resumePlaybackAfterRenewRef.current;
            if (!hasAppliedInitialPositionRef.current && resumePosition > 0) {
              // Tránh seek sát nút cuối video làm kết thúc bài học ngay lập tức
              if (Number.isFinite(video.duration) && resumePosition < video.duration - 2) {
                video.currentTime = resumePosition;
                lastPositionRef.current = resumePosition;
              }
              pendingPlaybackResumeRef.current = null;
              hasAppliedInitialPositionRef.current = true;
            }
            // Tự động phát tiếp nếu trước đó video đang phát dở
            if (shouldResumePlayback) {
              resumePlaybackAfterRenewRef.current = false;
              void video.play().catch(() => undefined);
            }
          }}
          onPlay={(event) => {
            if (renewPlaybackIfExpiringSoon(true)) {
              event.currentTarget.pause();
              return;
            }
            setIsPlaying(true);
          }}
          onPause={(event) => {
            setIsPlaying(false);
            reportPlaybackTime(event.currentTarget.currentTime, true);
          }}
          onEnded={(event) => {
            setIsPlaying(false);
            reportPlaybackTime(event.currentTarget.currentTime, true);
          }}
          // [CHỐNG GIAN LẬN TUA VIDEO - BƯỚC 2.1]
          // onSeeking ghi nhận điểm bắt đầu tua video (seekOrigin)
          onSeeking={(event) => {
            seekOriginRef.current = lastPositionRef.current || event.currentTarget.currentTime;
            setIsSeeking(true);
          }}
          // onSeeked đo lường quãng đường tua. Nếu học viên tua nhanh hơn 10 giây (seekDistance > 10)
          // thì sẽ kích hoạt warning cảnh báo.
          // Đồng thời gán cứng lastPositionRef.current về vị trí mới để reset block tích lũy thời gian thực học.
          onSeeked={(event) => {
            const nextPosition = event.currentTarget.currentTime;
            const seekDistance = nextPosition - seekOriginRef.current;
            if (seekDistance > SEEK_WARNING_THRESHOLD_SECONDS) {
              showSeekWarning();
            }
            lastPositionRef.current = nextPosition;
            reportPlaybackTime(nextPosition, true);
            setIsSeeking(false);
          }}
          onTimeUpdate={(event) => reportPlaybackTime(event.currentTarget.currentTime)}
        />

        {/* [BẢO MẬT QUAY LÉN - BƯỚC 2]
            Watermark động hiển thị Email, User ID, Session ID và thời gian hiện tại
            di chuyển xoay vòng 4 góc để tránh việc bị học viên ghi hình trái phép. */}
        {watermarkText && (
          <span className={`pointer-events-none absolute z-20 text-xs font-mono text-white/20 ${watermarkPositions[watermarkIndex]}`}>
            {watermarkText}
          </span>
        )}

        {(playbackSession.isIdle || playbackSession.isPending) && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black text-white">
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>
        )}
        <div className="absolute left-3 top-3 z-10">
          <TooltipProvider delayDuration={120}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex h-7 w-7 items-center justify-center text-zinc-400 transition-colors hover:bg-black/80 hover:text-white">
                  <Info className="h-4 w-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs rounded-xl bg-black/90 border-zinc-800 text-xs text-white">
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <p className="font-semibold text-white">Nội dung được bảo vệ</p>
                </div>
                <p className="mt-1 text-zinc-400 leading-normal">
                  Video bài học này được bảo vệ bản quyền bởi SecureLearn. Vui lòng không sao chép, ghi hình hoặc chia sẻ trái phép.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="border-b border-zinc-200 bg-white px-5 py-3.5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="line-clamp-1 text-base font-semibold text-zinc-900 dark:text-white">{lesson.title}</h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          Video · {Math.max(1, Math.round((lesson.duration || 0) / 60))} phút
        </p>
      </div>
    </div>
  );
}







