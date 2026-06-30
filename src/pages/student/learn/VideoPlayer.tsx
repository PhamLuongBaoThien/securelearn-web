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
import axios from 'axios';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import { AlertTriangle, Info, Loader2, Play, Shield, VideoOff } from 'lucide-react';
import { toast } from 'sonner';
import { ensureFreshAccessToken, getAccessToken, getApiBaseUrl } from '@/services/apiClient';
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
import { acquireLearningSession, releaseLearningSession, type LearningSessionConflict, type LearningSessionGrant } from '@/services/progressApi';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
const isProtectedSegmentRequest = (url: string) => {
  try {
    const parsed = new URL(url, window.location.origin);
    return /^\/api\/media\/videos\/[^/]+\/segment$/.test(parsed.pathname);
  } catch {
    return /\/api\/media\/videos\/[^/]+\/segment(?:[?#]|$)/.test(url);
  }
};
const absoluteApiUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) return path;
  const base = getApiBaseUrl() || window.location.origin;
  return new URL(path, base).toString();
};

const sortQualityLabels = (qualities: string[]) =>
  [...new Set(qualities.filter((quality) => /^\d+p$/i.test(quality)))]
    .sort((left, right) => Number.parseInt(left, 10) - Number.parseInt(right, 10));

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

type LearningSessionState = LearningSessionGrant & {
  acquiredAt: number;
};

const LEARNING_CLIENT_INSTANCE_KEY = 'securelearn.learning.client-instance';
const getLearningClientInstanceId = () => {
  const existing = window.sessionStorage.getItem(LEARNING_CLIENT_INSTANCE_KEY);
  if (existing) return existing;
  const value = crypto.randomUUID();
  window.sessionStorage.setItem(LEARNING_CLIENT_INSTANCE_KEY, value);
  return value;
};

const getLearningError = (error: unknown) => {
  if (!axios.isAxiosError(error)) return { code: '', message: error instanceof Error ? error.message : 'Đã xảy ra lỗi.' };
  const body = error.response?.data as { code?: string; message?: string; data?: LearningSessionConflict } | undefined;
  return { code: body?.code || '', message: body?.message || error.message, data: body?.data };
};

interface VideoPlayerProps {
  courseId: string;
  lesson: ILesson;
  watermarkIdentity?: WatermarkIdentity;
  onTimeChange?: (seconds: number) => void;
  initialPositionSeconds?: number;
  resumePositionReady?: boolean;
  pauseSignal?: number;
  onOpenNotes?: (timestampSeconds: number) => void;
}

export function VideoPlayer({
  courseId,
  lesson,
  watermarkIdentity,
  onTimeChange,
  initialPositionSeconds = 0,
  resumePositionReady = true,
  pauseSignal = 0,
  onOpenNotes,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const plyrRef = useRef<Plyr | null>(null);
  const plyrUiCleanupRef = useRef<(() => void) | null>(null);
  const selectedQualityRef = useRef<'auto' | string>('auto');
  const qualityLevelMapRef = useRef<Map<string, number>>(new Map());
  const qualitySwitchIdRef = useRef(0);
  const pendingQualitySwitchRef = useRef<{
    id: number;
    levelIndex: number;
    position: number;
    resumeAfterSwitch: boolean;
    frameRequested: boolean;
    timeoutId: number;
  } | null>(null);
  const onOpenNotesRef = useRef(onOpenNotes);
  const onTimeChangeRef = useRef(onTimeChange);
  const lastReportedPlaybackSecondRef = useRef(-1);
  const clientInstanceId = useMemo(getLearningClientInstanceId, []);
  const videoAssetId = typeof lesson.videoAssetId === 'string'
    ? lesson.videoAssetId
    : String(lesson.videoAssetId || '');
  const [learningSession, setLearningSession] = useState<LearningSessionState | null>(null);
  const [learningConflict, setLearningConflict] = useState<LearningSessionConflict | null>(null);
  const [isStartingLearning, setIsStartingLearning] = useState(false);
  const [learningRevoked, setLearningRevoked] = useState(false);
  const sessionId = learningSession?.learningSessionId || clientInstanceId;
  const lastPositionRef = useRef(0);
  const seekOriginRef = useRef(0);
  const lastSeekWarningAtRef = useRef(0);
  const hasAppliedInitialPositionRef = useRef(false);
  const initialPositionRef = useRef(Math.max(0, Math.floor(initialPositionSeconds || 0)));
  const pendingPlaybackResumeRef = useRef<number | null>(null);
  const resumePlaybackAfterRenewRef = useRef(false);
  const manifestExpiresAtRef = useRef(0);
  const proactiveRenewTimerRef = useRef<number | null>(null);
  const playbackRecoveringRef = useRef(false);
  const [playbackReloadKey, setPlaybackReloadKey] = useState(0);

  const [qualityLabels, setQualityLabels] = useState<string[]>([]);
  const [qualityLevelsReady, setQualityLevelsReady] = useState(!Hls.isSupported());
  const [isPlaybackReady, setIsPlaybackReady] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<'auto' | string>('auto');

  const [isQualitySwitching, setIsQualitySwitching] = useState(false);
  const playbackSession = useCreatePlaybackSession();
  const createPlayback = playbackSession.mutateAsync;
  const learningSessionRef = useRef<LearningSessionState | null>(null);
  const leaseLastActiveAtRef = useRef(0);
  const startLearningPendingRef = useRef(false);
  const isSeekingRef = useRef(false);

  const preservePlaybackPosition = useCallback(() => {
    const video = videoRef.current;
    const currentPosition = video && Number.isFinite(video.currentTime)
      ? video.currentTime
      : lastPositionRef.current;
    pendingPlaybackResumeRef.current = Math.max(0, currentPosition || 0);
    hasAppliedInitialPositionRef.current = false;
  }, []);

  const resetPlaybackUi = useCallback(() => {
    setIsPlaybackReady(false);
    setQualityLevelsReady(!Hls.isSupported());
    setQualityLabels([]);
    qualityLevelMapRef.current.clear();
  }, []);

  const clearVideoSource = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.removeAttribute('src');
    video.load();
  }, []);

  const destroyActiveHls = useCallback(() => {
    const activeHls = hlsRef.current;
    hlsRef.current = null;
    activeHls?.stopLoad();
    activeHls?.destroy();
  }, []);

  const markLearningRevoked = useCallback((expected?: LearningSessionState) => {
    if (expected && learningSessionRef.current !== expected) return false;
    preservePlaybackPosition();
    learningSessionRef.current = null;
    videoRef.current?.pause();
    clearVideoSource();
    destroyActiveHls();
    leaseLastActiveAtRef.current = 0;
    resetPlaybackUi();
    setLearningSession(null);
    setLearningRevoked(true);
    return true;
  }, [clearVideoSource, destroyActiveHls, preservePlaybackPosition, resetPlaybackUi]);

  const markLearningExpired = useCallback((expected?: LearningSessionState) => {
    if (expected && learningSessionRef.current !== expected) return false;
    preservePlaybackPosition();
    learningSessionRef.current = null;
    videoRef.current?.pause();
    clearVideoSource();
    destroyActiveHls();
    leaseLastActiveAtRef.current = 0;
    resetPlaybackUi();
    setLearningSession(null);
    setLearningRevoked(false);
    return true;
  }, [clearVideoSource, destroyActiveHls, preservePlaybackPosition, resetPlaybackUi]);

  const isCurrentLearningSession = useCallback((candidate: LearningSessionState) =>
    learningSessionRef.current === candidate, []);

  const startLearning = useCallback(async (force = false, expectedActiveSessionId = '', playAfterAcquire = true) => {
    if (!videoAssetId || startLearningPendingRef.current) return;
    const current = learningSessionRef.current;
    if (!force && current && (current.bypass || Date.now() - leaseLastActiveAtRef.current < current.leaseExpiresIn * 1000)) return;
    startLearningPendingRef.current = true;
    setIsStartingLearning(true);
    try {
      // HLS dùng XHR riêng nên không đi qua interceptor Axios. Làm mới access
      // token trước khi acquire để manifest/key/segment mới không khởi đầu bằng 401.
      await ensureFreshAccessToken('user');
      const response = await acquireLearningSession({
        courseId,
        lessonId: lesson._id || '',
        videoAssetId,
        clientInstanceId,
        force,
        expectedActiveSessionId: force ? expectedActiveSessionId : undefined,
      });
      if (!response.data) throw new Error(response.message || 'Không thể bắt đầu phiên học.');
      const next = { ...response.data, acquiredAt: Date.now() };
      learningSessionRef.current = next;
      leaseLastActiveAtRef.current = Date.now();
      resetPlaybackUi();
      setLearningSession(next);
      setLearningConflict(null);
      setLearningRevoked(false);
      resumePlaybackAfterRenewRef.current = playAfterAcquire;
    } catch (error) {
      const parsed = getLearningError(error);
      if (parsed.code === 'LEARNING_SESSION_CONFLICT' && parsed.data) {
        setLearningConflict(parsed.data);
      } else {
        toast.error(parsed.message || 'Không thể bắt đầu phiên học.');
      }
    } finally {
      startLearningPendingRef.current = false;
      setIsStartingLearning(false);
    }
  }, [clientInstanceId, courseId, lesson._id, resetPlaybackUi, videoAssetId]);
  const progressHeartbeat = useProgressHeartbeat(courseId);
  const sendProgressHeartbeat = progressHeartbeat.mutate;

  const [watermarkIndex, setWatermarkIndex] = useState(0);
  const [watermarkTime, setWatermarkTime] = useState(() => new Date());
  const watermarkText = formatWatermarkText(
    { ...watermarkIdentity, sessionId },
    watermarkTime,
  );
  const plyrQualityOptionsKey = useMemo(
    () => qualityLabels.map((quality) => Number.parseInt(quality, 10)).filter(Number.isFinite).join(','),
    [qualityLabels],
  );

  useEffect(() => {
    learningSessionRef.current = learningSession;
  }, [learningSession]);

  // Chuẩn bị manifest/segment ngay khi mở lesson để player có metadata và frame thật.
  // Acquire không force nên không thu hồi video đang phát ở thiết bị khác.
  useEffect(() => {
    void startLearning(false, '', false);
  }, [startLearning]);

  useEffect(() => () => {
    const active = learningSessionRef.current;
    if (active?.learningSessionId && active.learningSessionToken && !active.bypass) {
      void releaseLearningSession(active.learningSessionId, active.learningSessionToken).catch(() => undefined);
    }
  }, []);
  useEffect(() => {
    onOpenNotesRef.current = onOpenNotes;
    onTimeChangeRef.current = onTimeChange;
  }, [onOpenNotes, onTimeChange]);

  useEffect(() => {
    selectedQualityRef.current = selectedQuality;
  }, [selectedQuality]);

  useEffect(() => {
    setSelectedQuality('auto');
    setQualityLabels([]);
    setQualityLevelsReady(!Hls.isSupported());
    qualityLevelMapRef.current = new Map();
  }, [lesson._id, videoAssetId]);

  useEffect(() => {
    const fallbackQualities = sortQualityLabels(playbackSession.data?.asset.availableQualities ?? []);
    if (!fallbackQualities.length) return;
    setQualityLabels((current) => current.length > 0 ? current : fallbackQualities);
    setQualityLevelsReady(true);
  }, [playbackSession.data?.asset.availableQualities]);


  const reportPlaybackTime = useCallback((seconds: number, force = false) => {
    if (!Number.isFinite(seconds)) return;
    const playbackSecond = Math.max(0, Math.floor(seconds));
    if (!force && playbackSecond === lastReportedPlaybackSecondRef.current) return;
    lastReportedPlaybackSecondRef.current = playbackSecond;
    onTimeChangeRef.current?.(seconds);
  }, []);

  const updateQualityLevels = useCallback((levels: Hls['levels']) => {
    const nextLevelMap = new Map<string, number>();
    levels.forEach((level, index) => {
      const height = Number(level.height) || 0;
      if (!height) return;
      const label = String(height) + 'p';
      const previousIndex = nextLevelMap.get(label);
      if (previousIndex === undefined) {
        nextLevelMap.set(label, index);
        return;
      }
      const previousBitrate = Number(levels[previousIndex]?.bitrate ?? 0);
      const currentBitrate = Number(level.bitrate ?? 0);
      if (currentBitrate >= previousBitrate) nextLevelMap.set(label, index);
    });
    qualityLevelMapRef.current = nextLevelMap;
    setQualityLabels(sortQualityLabels([...nextLevelMap.keys()]));
  }, []);

  const finishQualitySwitch = useCallback((switchId: number) => {
    const pending = pendingQualitySwitchRef.current;
    if (!pending || pending.id !== switchId) return;
    window.clearTimeout(pending.timeoutId);
    pendingQualitySwitchRef.current = null;
    setIsQualitySwitching(false);

    const video = videoRef.current;
    if (pending.resumeAfterSwitch && video?.paused) {
      void video.play().catch(() => undefined);
    }
  }, []);

  const applyQualitySelection = useCallback((quality: 'auto' | string) => {
    setSelectedQuality(quality);
    const hls = hlsRef.current;
    if (!hls) return;
    if (quality === 'auto') {
      const pending = pendingQualitySwitchRef.current;
      if (pending) finishQualitySwitch(pending.id);
      hls.loadLevel = -1;
      hls.nextLevel = -1;
      return;
    }

    const levelIndex = qualityLevelMapRef.current.get(quality);
    const video = videoRef.current;
    if (levelIndex === undefined || !video) return;

    const previousPending = pendingQualitySwitchRef.current;
    const resumeAfterSwitch = previousPending?.resumeAfterSwitch ?? !video.paused;
    if (previousPending) window.clearTimeout(previousPending.timeoutId);

    const switchId = ++qualitySwitchIdRef.current;
    const position = Number.isFinite(video.currentTime) ? video.currentTime : 0;
    video.pause();
    setIsQualitySwitching(true);
    pendingQualitySwitchRef.current = {
      id: switchId,
      levelIndex,
      position,
      resumeAfterSwitch,
      frameRequested: false,
      timeoutId: window.setTimeout(() => finishQualitySwitch(switchId), 10_000),
    };
    hls.currentLevel = levelIndex;
  }, [finishQualitySwitch]);

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
    setIsPlaybackReady(false);
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
    if (!videoAssetId) return false;
    if (!manifestExpiresAtRef.current) return false;
    if (Date.now() >= manifestExpiresAtRef.current - MANIFEST_RENEW_BUFFER_MS) {
      recoverPlaybackSession(resumeAfterRenew);
      return true;
    }
    return false;
  }, [videoAssetId, recoverPlaybackSession]);

  // Đồng bộ mốc resume trước khi effect HLS chạy để tải đúng fragment ngay từ đầu.
  useEffect(() => {
    hasAppliedInitialPositionRef.current = false;
    lastPositionRef.current = initialPositionRef.current;
  }, [lesson._id]);

  useEffect(() => {
    if (!resumePositionReady || hasAppliedInitialPositionRef.current) return;
    initialPositionRef.current = Math.max(0, Math.floor(initialPositionSeconds || 0));
    lastPositionRef.current = initialPositionRef.current;
  }, [initialPositionSeconds, resumePositionReady]);
  // Video player hook này dùng để xử lý video và các tương tác với video
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoAssetId || !resumePositionReady || !learningSession) return;

    // Mỗi learning session phải khởi tạo một thế hệ player sạch. Đợi cả metadata
    // và danh sách quality của manifest mới dựng Plyr để tránh destroy MediaSource
    // giữa chừng khi quality vừa được cập nhật sau lúc chuyển thiết bị.
    resetPlaybackUi();
    let hls: Hls | null = null; // Hls là thư viện xử lý video HLS
    hlsRef.current = null;
    let canceled = false; // Flag để đánh dấu khi video bị hủy

    const setupPlayback = async () => {
      // Mỗi lần mở video, FE phải xin playback session mới.
      // Backend không trả thẳng manifest (.m3u8) hoặc key ( #EXT-X-KEY METHOD=AES-128...) ngay lập tức mà chỉ trả one-time playbackUrl (dùng 1 lần là hết hạn).
      // Khi manifest/segment cần làm mới, gọi lại endpoint có JWT và kiểm tra entitlement.
      const session = await createPlayback({
        videoAssetId,
        learningSession: learningSession.bypass ? undefined : {
          id: learningSession.learningSessionId!,
          token: learningSession.learningSessionToken!,
        },
        clientInstanceId,
      });
      if (canceled) return;
      const segmentExpiresIn = session.segmentExpiresIn ?? FALLBACK_SEGMENT_EXPIRES_IN_SECONDS;
      manifestExpiresAtRef.current = Date.now() + segmentExpiresIn * 1000;
      scheduleProactiveRenew(segmentExpiresIn);
      const manifestUrl = absoluteApiUrl(session.playbackUrl);
      const resumePosition = pendingPlaybackResumeRef.current ?? initialPositionRef.current;
      const hlsStartPosition = Number.isFinite(resumePosition) && resumePosition > 0
        ? resumePosition
        : -1;

      // [BẢO MẬT STREAMING - BƯỚC 2]
      // Nếu trình duyệt hỗ trợ Hls.js, tiến hành load source manifest HLS được bảo vệ (.m3u8).
      if (Hls.isSupported()) {
        hls = new Hls({
          // Tải ngay fragment chứa mốc đang học thay vì tải từ giây 0 rồi mới seek.
          startPosition: hlsStartPosition,
          maxBufferLength: 18,
          maxMaxBufferLength: 30,
          backBufferLength: 30,
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
            // Segment API trả redirect sang MinIO. Custom header/credential trên XHR sẽ bị
            // mang theo qua redirect và làm preflight của object storage thất bại.
            if (!isProtectedSegmentRequest(url)) {
              xhr.setRequestHeader('X-Learning-Client-Instance-Id', clientInstanceId);
              xhr.withCredentials = true;
            }
          },
        });
        hlsRef.current = hls;
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (!hls) return;
          updateQualityLevels(hls.levels);
          setQualityLevelsReady(true);
          if (selectedQualityRef.current !== 'auto') {
            const selectedLevel = qualityLevelMapRef.current.get(selectedQualityRef.current);
            if (selectedLevel !== undefined) {
              hls.loadLevel = selectedLevel;
              hls.nextLevel = selectedLevel;
            } else {
              setSelectedQuality('auto');
            }
          }
        });
        hls.on(Hls.Events.LEVELS_UPDATED, (_event, data) => {
          updateQualityLevels(data.levels);
        });

        hls.on(Hls.Events.FRAG_BUFFERED, (_event, data) => {
          const pending = pendingQualitySwitchRef.current;
          if (!pending || pending.frameRequested || data.frag.level !== pending.levelIndex) return;

          const fragmentEnd = data.frag.start + data.frag.duration;
          if (pending.position < data.frag.start - 0.25 || pending.position > fragmentEnd + 0.25) return;

          pending.frameRequested = true;
          const refreshPosition = Number.isFinite(video.duration)
            ? Math.min(pending.position + 0.01, Math.max(0, video.duration - 0.01))
            : pending.position + 0.01;
          video.currentTime = refreshPosition;

          if (typeof video.requestVideoFrameCallback === 'function') {
            video.requestVideoFrameCallback(() => finishQualitySwitch(pending.id));
          } else {
            video.addEventListener('seeked', () => finishQualitySwitch(pending.id), { once: true });
          }
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          // Hls.js của một thế hệ player cũ có thể báo lỗi sau khi phiên mới đã
          // được acquire. Không để callback cũ phá player/lease vừa tạo.
          if (!isCurrentLearningSession(learningSession)) return;
          // Hls.js tự retry các timeout/lỗi tải segment không fatal. Chỉ tạo playback session mới
          // khi token/quyền đã hết hiệu lực hoặc lỗi network đã trở thành fatal.
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            const networkStatus = Number(
              data.response?.code
              ?? data.networkDetails?.status
              ?? data.networkDetails?.statusCode,
            );
            const leaseExpired = !learningSession.bypass
              && Date.now() - leaseLastActiveAtRef.current >= learningSession.leaseExpiresIn * 1000;
            if (networkStatus === 409) {
              if (leaseExpired) {
                const shouldResumePlayback = !video.paused || resumePlaybackAfterRenewRef.current;
                if (markLearningExpired(learningSession)) {
                  void startLearning(false, '', shouldResumePlayback);
                }
              } else {
                markLearningRevoked(learningSession);
              }
              return;
            }
            if ([401, 403].includes(networkStatus) && leaseExpired) {
              const shouldResumePlayback = !video.paused || resumePlaybackAfterRenewRef.current;
              if (markLearningExpired(learningSession)) {
                void startLearning(false, '', shouldResumePlayback);
              }
              return;
            }
            if (data.fatal) recoverPlaybackSession();
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

    setupPlayback().catch((error) => {
      if (canceled || !isCurrentLearningSession(learningSession)) return;
      const parsed = getLearningError(error);
      if (parsed.code === 'LEARNING_SESSION_REPLACED') {
        markLearningRevoked(learningSession);
        return;
      }
      if (parsed.code === 'LEARNING_SESSION_EXPIRED') {
        const shouldResumePlayback = resumePlaybackAfterRenewRef.current;
        if (markLearningExpired(learningSession)) {
          void startLearning(false, '', shouldResumePlayback);
        }
        return;
      }
      toast.error(parsed.message || 'Không thể tải phiên phát video.');
      learningSessionRef.current = null;
      setLearningSession(null);
      clearVideoSource();
    });

    return () => {
      canceled = true;
      clearProactiveRenewTimer();
      const pendingQualitySwitch = pendingQualitySwitchRef.current;
      if (pendingQualitySwitch) window.clearTimeout(pendingQualitySwitch.timeoutId);
      pendingQualitySwitchRef.current = null;
      setIsQualitySwitching(false);
      if (hlsRef.current === hls) hlsRef.current = null;
      clearVideoSource();
      hls?.stopLoad();
      hls?.destroy();
    };
  }, [clearVideoSource, clearProactiveRenewTimer, clientInstanceId, createPlayback, finishQualitySwitch, isCurrentLearningSession, learningSession, videoAssetId, lesson._id, markLearningExpired, markLearningRevoked, playbackReloadKey, recoverPlaybackSession, resetPlaybackUi, resumePositionReady, scheduleProactiveRenew, startLearning, updateQualityLevels]);

  useEffect(() => {
    if (!pauseSignal) return;
    videoRef.current?.pause();
  }, [pauseSignal]);

  useEffect(() => {
    // [BƯỚC 2.7: LUỒNG B - LẮNG NGHE FOCUS/VISIBILITY CHANGE ĐỂ TỰ ĐỘNG RENEW]
    // Nếu học viên quay lại học sau một thời gian dài rời đi, hệ thống kiểm tra và tự động gia hạn session nếu hết hạn.
    const handlePlaybackResume = () => {
      if (document.visibilityState !== 'visible') return;
      // Tab nền có thể throttle timer refresh. Làm mới token ngay khi người dùng
      // quay lại để lần bấm Play kế tiếp không khởi đầu bằng segment 401.
      void ensureFreshAccessToken('user')
        .then(() => renewPlaybackIfExpiringSoon())
        .catch(() => undefined);
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
    const video = videoRef.current;
    if (!video || !lesson._id || !learningSession || learningSession.bypass) return;
    let disposed = false;
    let heartbeatPending = false;
    let queuedHeartbeat: { deltaSeconds: number; segmentStartSeconds: number } | null = null;

    // [TIẾN ĐỘ & HEARTBEAT - BƯỚC 3]
    // Hàm gửi heartbeat lên progress-service để ghi nhận tiến trình học tập
    const sendHeartbeat = (deltaSeconds = 0, segmentStartSeconds = video.currentTime) => {
      if (disposed || !isCurrentLearningSession(learningSession)) return;
      if (heartbeatPending) {
        queuedHeartbeat = { deltaSeconds, segmentStartSeconds };
        return;
      }
      heartbeatPending = true;
      sendProgressHeartbeat({
        courseId,
        lessonId: lesson._id!,
        lessonType: 'VIDEO',
        sessionId,
        learningSessionToken: learningSession.learningSessionToken,
        positionSeconds: Math.floor(video.currentTime),
        watchedSecondsDelta: deltaSeconds,
        segmentStartSeconds: Math.floor(segmentStartSeconds),
        playbackRate: video.playbackRate,
        tabVisible: document.visibilityState === 'visible',
      }, {
        onSuccess: () => {
          if (isCurrentLearningSession(learningSession)) {
            leaseLastActiveAtRef.current = Date.now();
          }
        },
        onError: (error) => {
          if (!isCurrentLearningSession(learningSession)) return;
          const code = getLearningError(error).code;
          if (code === 'LEARNING_SESSION_REPLACED') {
            markLearningRevoked(learningSession);
            return;
          }
          if (code === 'LEARNING_SESSION_EXPIRED') {
            const shouldResumePlayback = !video.paused || isSeekingRef.current;
            // Heartbeat này chứng minh người dùng vẫn đang tương tác với player.
            // Xin lease mới ngay và dựng lại HLS tại timestamp đã lưu thay vì để video trắng.
            if (markLearningExpired(learningSession)) {
              void startLearning(false, '', shouldResumePlayback);
            }
          }
        },
        onSettled: () => {
          heartbeatPending = false;
          if (disposed) {
            queuedHeartbeat = null;
            return;
          }
          const queued = queuedHeartbeat;
          queuedHeartbeat = null;
          if (queued && isCurrentLearningSession(learningSession)) {
            sendHeartbeat(queued.deltaSeconds, queued.segmentStartSeconds);
          }
        },
      });
    };

    // [BƯỚC 2.5: ĐỒNG BỘ TIẾN ĐỘ TỨC THỜI (FLUSH PROGRESS)]
    // Đồng bộ nhanh tiến độ khi học viên pause video, chuyển tab hoặc kết thúc video
    const flushProgress = () => {
      const currentTime = Math.floor(video.currentTime);
      const watchedSeconds = Math.floor(video.currentTime - lastPositionRef.current);
      if (currentTime <= 0) {
        // Tua về đầu vẫn là hoạt động hợp lệ; delta=0 chỉ gia hạn lease, không cộng tiến độ.
        sendHeartbeat(0, 0);
        lastPositionRef.current = video.currentTime;
        return;
      }
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
        isSeekingRef.current ||
        document.visibilityState !== 'visible' ||
        video.paused ||
        video.ended ||
        heartbeatPending
      ) return;

      const watchedSeconds = Math.floor(video.currentTime - lastPositionRef.current);
      if (watchedSeconds < 1 || watchedSeconds > MAX_VALID_WATCH_GAP_SECONDS) {
        // Player vẫn active nhưng có thể đang buffer sau khi seek. Gia hạn lease với
        // delta=0 để không cộng tiến độ trong thời gian video chưa thực sự chạy.
        sendHeartbeat(0, video.currentTime);
        lastPositionRef.current = video.currentTime;
        return;
      }

      sendHeartbeat(Math.min(MAX_HEARTBEAT_DELTA_SECONDS, watchedSeconds), lastPositionRef.current);
      lastPositionRef.current = video.currentTime;
    }, HEARTBEAT_MS);

    const handlePlay = () => {
      const leaseStale = !learningSession.bypass
        && Date.now() - leaseLastActiveAtRef.current >= learningSession.leaseExpiresIn * 1000;
      lastPositionRef.current = video.currentTime;
      if (leaseStale) return;
      sendHeartbeat(0);
    };
    const handlePause = () => {
      const leaseStale = Date.now() - leaseLastActiveAtRef.current >= learningSession.leaseExpiresIn * 1000;
      // onPlay chủ động pause nguồn cũ trước khi reacquire. Không gửi thêm một
      // heartbeat chắc chắn hết hạn vì response muộn có thể đua với phiên mới.
      if (leaseStale) return;
      flushProgress();
    };
    const handleSeeked = () => sendHeartbeat(0, video.currentTime);
    // Không release tại ended: HLS/Plyr còn có thể phát sinh event cuối. TTL sẽ dọn lease.
    const handleEnded = () => flushProgress();
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') flushProgress();
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('ended', handleEnded);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      disposed = true;
      queuedHeartbeat = null;
      window.clearInterval(interval);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('ended', handleEnded);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [
    courseId,
    learningSession,
    markLearningExpired,
    markLearningRevoked,
    lesson._id,
    sendProgressHeartbeat,
    sessionId,
    startLearning,
    isCurrentLearningSession,
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

    const qualityOptions = plyrQualityOptionsKey
      ? plyrQualityOptionsKey.split(',').map(Number).filter(Number.isFinite)
      : [];
    if (!qualityLevelsReady || !isPlaybackReady || plyrRef.current) return;

    const selectedQualityValue = selectedQualityRef.current === 'auto'
      ? 0
      : Number.parseInt(selectedQualityRef.current, 10);
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
      settings: qualityOptions.length > 0 ? ['quality', 'speed'] : ['speed'],
      quality: {
        default: Number.isFinite(selectedQualityValue) ? selectedQualityValue : 0,
        options: qualityOptions.length > 0 ? [0, ...qualityOptions] : [],
        forced: qualityOptions.length > 0,
        onChange: (quality: number) => {
          applyQualitySelection(quality === 0 ? 'auto' : String(quality) + 'p');
        },
      },
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
        quality: 'Chất lượng',
        qualityLabel: { 0: 'Auto' },
        speed: 'Tốc độ',
        normal: 'Bình thường',
        enterFullscreen: 'Toàn màn hình',
        exitFullscreen: 'Thoát toàn màn hình',
      },
    });
    plyrRef.current = player;

    const controls = player.elements.controls;
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
    if (controls) {
      const directSettingsButton = Array.from(controls.children).find(
        (element) => element instanceof HTMLElement && element.matches('[data-plyr="settings"]'),
      );
      const directFullscreenButton = Array.from(controls.children).find(
        (element) => element instanceof HTMLElement && element.matches('[data-plyr="fullscreen"]'),
      );
      controls.insertBefore(notesButton, directSettingsButton || directFullscreenButton || null);
    }

    plyrUiCleanupRef.current = () => {
      notesButton.removeEventListener('click', openNotes);
      notesButton.remove();
    };
  }, [applyQualitySelection, isPlaybackReady, plyrQualityOptionsKey, qualityLevelsReady]);

  useEffect(() => () => {
    plyrUiCleanupRef.current?.();
    plyrUiCleanupRef.current = null;
    const player = plyrRef.current;
    plyrRef.current = null;
    player?.destroy();
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

  if (!videoAssetId) {
    return (
      <div className="flex aspect-video items-center justify-center bg-black text-zinc-300">
        <div className="text-center">
          <VideoOff className="mx-auto h-8 w-8" />
          <p className="mt-2 text-sm">Bài học chưa có video.</p>
        </div>
      </div>
    );
  }

  if (playbackSession.data?.asset.status === 'FAILED') {
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
          controls={isPlaybackReady}
          playsInline
          preload="metadata"
          className="h-full w-full"
          onLoadedMetadata={(event) => {
            const video = event.currentTarget;
            if (!learningSessionRef.current || video.currentSrc.startsWith('data:')) return;
            setIsPlaybackReady(true);
            // [BƯỚC 2.7: LUỒNG D - PHỤC HỒI TRẠNG THÁI PHÁT (STATE RESUMPTION & UX PRESERVATION)]
            // [BƯỚC 2.8: KHÔI PHỤC VỊ TRÍ HỌC CŨ TỪ INITIAL POSITION SECONDS]
            // Ưu tiên sử dụng pendingPlaybackResumeRef (nếu vừa gia hạn session giữa chừng),
            // sau đó mới dùng initialPositionSeconds (nếu bắt đầu mở bài học lần đầu).
            const resumePosition = pendingPlaybackResumeRef.current ?? initialPositionRef.current;
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
            // Phiên phát thường đã được chuẩn bị ngầm khi mở lesson. Nhánh này là
            // fallback nếu warm-up chưa hoàn tất, đã hết hạn hoặc vừa gặp xung đột.
            if (!learningSession) {
              event.currentTarget.pause();
              if (!learningConflict) void startLearning();
              return;
            }
            const leaseExpired = learningSession && !learningSession.bypass
              && Date.now() - leaseLastActiveAtRef.current >= learningSession.leaseExpiresIn * 1000;
            if (leaseExpired) {
              const video = event.currentTarget;
              video.pause();
              // Vô hiệu hóa ref đồng bộ trước khi request cũ kịp trả về. Sau đó
              // acquire lease mới và dựng HLS lại tại đúng vị trí đang dừng.
              if (markLearningExpired(learningSession)) {
                void startLearning(false, '', true);
              }
              return;
            }
            if (renewPlaybackIfExpiringSoon(true)) {
              event.currentTarget.pause();
              return;
            }

          }}
          onPause={(event) => {

            reportPlaybackTime(event.currentTarget.currentTime, true);
          }}
          onEnded={(event) => {

            reportPlaybackTime(event.currentTarget.currentTime, true);
          }}
          // [CHỐNG GIAN LẬN TUA VIDEO - BƯỚC 2.1]
          // onSeeking ghi nhận điểm bắt đầu tua video (seekOrigin)
          onSeeking={(event) => {
            seekOriginRef.current = lastPositionRef.current || event.currentTarget.currentTime;
            isSeekingRef.current = true;
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
            isSeekingRef.current = false;
          }}
          onTimeUpdate={(event) => reportPlaybackTime(event.currentTarget.currentTime)}
        />


        {isQualitySwitching && (
          <div
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/15"
            aria-live="polite"
          >
            <Loader2 className="h-7 w-7 animate-spin text-white" aria-label="Đang đổi chất lượng video" />
          </div>
        )}

        {/* [BẢO MẬT QUAY LÉN - BƯỚC 2]
            Watermark động hiển thị Email, User ID, Session ID và thời gian hiện tại
            di chuyển xoay vòng 4 góc để tránh việc bị học viên ghi hình trái phép. */}
        {watermarkText && (
          <span className={`pointer-events-none absolute z-20 text-xs font-mono text-white/20 ${watermarkPositions[watermarkIndex]}`}>
            {watermarkText}
          </span>
        )}

        {!learningSession && !learningRevoked && !learningConflict && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <button
              type="button"
              aria-label={isStartingLearning ? 'Đang chuẩn bị video' : 'Phát video'}
              className="pointer-events-auto flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-white/90 text-zinc-950 shadow-xl transition-colors duration-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-wait disabled:opacity-80"
              onClick={() => void startLearning()}
              disabled={isStartingLearning}
            >
              {isStartingLearning
                ? <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />
                : <Play className="ml-1 h-7 w-7 fill-current" aria-hidden="true" />}
            </button>
          </div>
        )}
        {!learningSession && learningRevoked && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-gradient-to-b from-zinc-950/80 to-black px-5 text-white">
            <div className="max-w-md text-center">
              <AlertTriangle className="mx-auto h-9 w-9 text-amber-400" />
              <h3 className="mt-3 text-lg font-semibold">Video đã được chuyển sang nơi khác</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                Video đã dừng vì tài khoản của bạn đang học trên một thiết bị hoặc tab khác. Tài khoản trên thiết bị này vẫn được đăng nhập.
              </p>
              <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
                <Button type="button" onClick={() => void startLearning()} disabled={isStartingLearning}>
                  {isStartingLearning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Tiếp tục tại đây
                </Button>
                <Button type="button" variant="outline" onClick={() => window.history.back()} className="border-zinc-600 bg-transparent text-white hover:bg-white/10 hover:text-white">
                  Quay lại khóa học
                </Button>
              </div>
            </div>
          </div>
        )}
        {learningSession && !isPlaybackReady && (
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-black/80 px-5 text-white" aria-live="polite" aria-label="Đang khôi phục video">
            <div className="flex max-w-sm flex-col items-center text-center">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-400 motion-reduce:animate-none" aria-hidden="true" />
              <p className="mt-3 text-sm font-medium">Đang khôi phục video…</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                Video sẽ tiếp tục từ vị trí gần nhất ngay khi luồng phát sẵn sàng.
              </p>
            </div>
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


      <Dialog open={Boolean(learningConflict)} onOpenChange={(open) => { if (!open && !isStartingLearning) setLearningConflict(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Tài khoản đang phát video ở nơi khác
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-2 leading-relaxed">
              <span className="block">
                {learningConflict?.sameAuthSession
                  ? 'Một tab khác trên thiết bị này đang phát video.'
                  : `Video đang được phát trên ${learningConflict?.deviceName || 'một thiết bị khác'}.`}
              </span>
              <span className="block">Nếu tiếp tục tại đây, video ở nơi kia sẽ dừng nhưng thiết bị đó không bị đăng xuất.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setLearningConflict(null)} disabled={isStartingLearning}>Hủy</Button>
            <Button type="button" onClick={() => learningConflict && void startLearning(true, learningConflict.activeSessionId)} disabled={isStartingLearning}>
              {isStartingLearning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tiếp tục trên thiết bị này
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="border-b border-zinc-200 bg-white px-5 py-3.5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="line-clamp-1 text-base font-semibold text-zinc-900 dark:text-white">{lesson.title}</h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          Video · {Math.max(1, Math.round((lesson.duration || 0) / 60))} phút
        </p>
      </div>
    </div>
  );
}







