import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type SyntheticEvent } from 'react';
import Hls from 'hls.js';
import { Info, Loader2, Shield, VideoOff } from 'lucide-react';
import { toast } from 'sonner';
import { getAccessToken, getApiBaseUrl } from '@/services/apiClient';
import { renewPlaybackSession } from '@/services/mediaApi';
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


const isHlsStorageRequest = (url: string) =>
  /\.(ts|m4s|mp4)(?:[?#]|$)/i.test(url) ||
  url.includes('/securelearn-media/') ||
  url.includes('X-Amz-Signature=') ||
  url.includes('X-Amz-Credential=');

const shouldAttachAuthToHlsRequest = (url: string) => {
  if (isHlsStorageRequest(url)) return false;
  if (/\/api\/media\/videos\/[^/]+\/(playback|key)(?:[?#]|$)/.test(url)) return false;
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

const HEARTBEAT_MS = 15_000;
const SEEK_WARNING_THRESHOLD_SECONDS = 10;
const SEEK_WARNING_SUPPRESS_KEY = 'securelearn.progress.seek-warning.until';
const SEEK_WARNING_SUPPRESS_MS = 24 * 60 * 60 * 1000;
const SEEK_WARNING_COOLDOWN_MS = 8_000;
const FALLBACK_SEGMENT_EXPIRES_IN_SECONDS = 3600;
const MANIFEST_RENEW_BUFFER_MS = 60_000;

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
}

export function VideoPlayer({
  courseId,
  lesson,
  watermarkIdentity,
  onTimeChange,
  initialPositionSeconds = 0,
  pauseSignal = 0,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sessionId = useMemo(() => crypto.randomUUID(), []);
  const lastPositionRef = useRef(0);
  const seekOriginRef = useRef(0);
  const lastSeekWarningAtRef = useRef(0);
  const hasAppliedInitialPositionRef = useRef(false);
  const pendingPlaybackResumeRef = useRef<number | null>(null);
  const resumePlaybackAfterRenewRef = useRef(false);
  const mediaSessionTokenRef = useRef<string | null>(null);
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

  const clearProactiveRenewTimer = useCallback(() => {
    if (proactiveRenewTimerRef.current) {
      window.clearTimeout(proactiveRenewTimerRef.current);
      proactiveRenewTimerRef.current = null;
    }
  }, []);

  const scheduleProactiveRenew = useCallback((expiresInSeconds?: number) => {
    clearProactiveRenewTimer();
    const ttlSeconds = Number.isFinite(expiresInSeconds) && expiresInSeconds! > 0
      ? expiresInSeconds!
      : FALLBACK_SEGMENT_EXPIRES_IN_SECONDS;
    const delayMs = Math.max(10_000, ttlSeconds * 1000 - MANIFEST_RENEW_BUFFER_MS);
    proactiveRenewTimerRef.current = window.setTimeout(() => {
      const video = videoRef.current;
      if (!video || video.paused || video.ended || document.visibilityState !== 'visible') return;
      recoverPlaybackSession();
    }, delayMs);
  }, [clearProactiveRenewTimer, recoverPlaybackSession]);

  const renewPlaybackIfExpiringSoon = useCallback((resumeAfterRenew = false) => {
    if (!lesson.videoAssetId) return false;
    if (!manifestExpiresAtRef.current) return false;
    if (Date.now() >= manifestExpiresAtRef.current - MANIFEST_RENEW_BUFFER_MS) {
      recoverPlaybackSession(resumeAfterRenew);
      return true;
    }
    return false;
  }, [lesson.videoAssetId, recoverPlaybackSession]);

  useEffect(() => {
    const video = videoRef.current;
    const videoAssetId = lesson.videoAssetId;
    if (!video || !videoAssetId) return;

    let hls: Hls | null = null;
    let canceled = false;

    const setupPlayback = async () => {
      // Mỗi lần mở video, FE phải xin playback session mới.
      // Backend không trả thẳng manifest hoặc key ngay từ đầu mà chỉ trả one-time playbackUrl.
      const existingMediaSessionToken = mediaSessionTokenRef.current;
      const session = existingMediaSessionToken
        ? await renewPlaybackSession(videoAssetId, existingMediaSessionToken).then((response) => {
            if (response.status === 'ERR' || !response.data) {
              mediaSessionTokenRef.current = null;
              return createPlayback(videoAssetId);
            }
            return response.data;
          })
        : await createPlayback(videoAssetId);
      if (canceled) return;
      if (session.mediaSessionToken) mediaSessionTokenRef.current = session.mediaSessionToken;
      const segmentExpiresIn = session.segmentExpiresIn ?? FALLBACK_SEGMENT_EXPIRES_IN_SECONDS;
      manifestExpiresAtRef.current = Date.now() + segmentExpiresIn * 1000;
      scheduleProactiveRenew(segmentExpiresIn);
      const manifestUrl = absoluteApiUrl(session.playbackUrl);

      // [BẢO MẬT STREAMING - BƯỚC 2]
      // Nếu trình duyệt hỗ trợ Hls.js, tiến hành load source manifest HLS được bảo vệ (.m3u8).
      if (Hls.isSupported()) {
        hls = new Hls({
          // xhrSetup được chạy trước mỗi request tải Playlist HLS hoặc Key giải mã.
          // Tự động đính kèm header Authorization chứa Bearer JWT token của user để xác thực quyền truy cập.
          // Không gửi JWT khi request các phân đoạn video (.ts) trực tiếp từ MinIO storage.
          xhrSetup: (xhr, url) => {
            if (!shouldAttachAuthToHlsRequest(url)) return;
            const token = getAccessToken();
            if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.withCredentials = true;
          },
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          // Xử lý lỗi khi URL presigned của các segment hết hạn hoặc gặp lỗi mạng.
          // Tự động khôi phục playback session bằng cách xin token mới từ Backend mà không gây reload trang.
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            recoverPlaybackSession();
            return;
          }
          if (data.fatal && data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls?.recoverMediaError();
            return;
          }
          if (data.fatal) recoverPlaybackSession();
        });
        hls.loadSource(manifestUrl);
        hls.attachMedia(video);
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

    // Đồng bộ nhanh tiến độ khi học viên pause video, chuyển tab hoặc kết thúc video
    const flushProgress = () => {
      const currentTime = Math.floor(video.currentTime);
      const watchedSeconds = Math.floor(video.currentTime - lastPositionRef.current);
      if (currentTime <= 0) return;
      const deltaSeconds = watchedSeconds > 0 && watchedSeconds <= 20 ? Math.min(15, watchedSeconds) : 0;
      sendHeartbeat(deltaSeconds, deltaSeconds > 0 ? lastPositionRef.current : video.currentTime);
      lastPositionRef.current = video.currentTime;
    };

    // [BẢO MẬT TIẾN ĐỘ - BƯỚC 3]
    // Thiết lập vòng lặp interval gửi heartbeat định kỳ mỗi 15 giây.
    // Kiểm tra chéo: nếu tab ẩn hoặc đang tua (isSeeking) hoặc đang pause thì KHÔNG gửi heartbeat.
    // watchedSecondsDelta chỉ được ghi nhận tối đa là 15 giây (bảo vệ chống hack gửi thời gian ảo).
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
      if (watchedSeconds < 1 || watchedSeconds > 20) {
        lastPositionRef.current = video.currentTime;
        return;
      }

      sendHeartbeat(Math.min(15, watchedSeconds), lastPositionRef.current);
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

  const handleContextMenu = useCallback((event: MouseEvent) => event.preventDefault(), []);
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
        className="relative aspect-video w-full select-none bg-black"
        onContextMenu={handleContextMenu}
        onCopy={blockProtectedEvent}
        onCut={blockProtectedEvent}
        onDragStart={blockProtectedEvent}
      >
        <video
          ref={videoRef}
          controls
          playsInline
          className="absolute inset-0 h-full w-full"
          onLoadedMetadata={(event) => {
            const video = event.currentTarget;
            const resumePosition = pendingPlaybackResumeRef.current ?? initialPositionSeconds;
            const shouldResumePlayback = resumePlaybackAfterRenewRef.current;
            if (!hasAppliedInitialPositionRef.current && resumePosition > 0) {
              if (Number.isFinite(video.duration) && resumePosition < video.duration - 2) {
                video.currentTime = resumePosition;
                lastPositionRef.current = resumePosition;
              }
              pendingPlaybackResumeRef.current = null;
              hasAppliedInitialPositionRef.current = true;
            }
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
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
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
            setIsSeeking(false);
          }}
          onTimeUpdate={(event) => onTimeChange?.(event.currentTarget.currentTime)}
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
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black text-white">
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







