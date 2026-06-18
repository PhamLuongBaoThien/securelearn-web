import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type SyntheticEvent } from 'react';
import Hls from 'hls.js';
import { Loader2, Shield, VideoOff } from 'lucide-react';
import { toast } from 'sonner';
import { getAccessToken, getApiBaseUrl } from '@/services/apiClient';
import { useCreatePlaybackSession } from '@/hooks/useCourseLearning';
import { useProgressHeartbeat } from '@/hooks/useLearningProgress';
import { Button } from '@/components/ui/button';
import type { ILesson } from '@/services/courseApi';
import {
  formatWatermarkText,
  isBlockedProtectionKey,
  shouldIgnoreProtectionShortcut,
  type WatermarkIdentity,
  watermarkPositions,
  WATERMARK_ROTATION_MS,
} from '@/lib/contentProtection';

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
  accessSource?: 'PURCHASE' | 'SUBSCRIPTION';
  watermarkIdentity?: WatermarkIdentity;
  onTimeChange?: (seconds: number) => void;
  initialPositionSeconds?: number;
  pauseSignal?: number;
}

export function VideoPlayer({
  courseId,
  lesson,
  accessSource: _accessSource,
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

  useEffect(() => {
    const video = videoRef.current;
    const videoAssetId = lesson.videoAssetId;
    if (!video || !videoAssetId) return;

    let hls: Hls | null = null;
    let canceled = false;

    const setupPlayback = async () => {
      // Mỗi lần mở video, FE phải xin playback session mới.
      // Backend không trả thẳng manifest hoặc key ngay từ đầu mà chỉ trả one-time playbackUrl.
      const session = await createPlayback(videoAssetId);
      if (canceled) return;
      const manifestUrl = absoluteApiUrl(session.playbackUrl);

      if (Hls.isSupported()) {
        hls = new Hls({
          xhrSetup: (xhr, url) => {
            if (url.includes('/api/')) {
              const token = getAccessToken();
              if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
              xhr.withCredentials = true;
            }
          },
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
      hls?.destroy();
      video.removeAttribute('src');
    };
  }, [createPlayback, lesson.videoAssetId, lesson._id]);

  useEffect(() => {
    if (!pauseSignal) return;
    videoRef.current?.pause();
  }, [pauseSignal]);

  useEffect(() => {
    hasAppliedInitialPositionRef.current = false;
    lastPositionRef.current = Math.max(0, Math.floor(initialPositionSeconds || 0));
  }, [initialPositionSeconds, lesson._id]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !lesson._id) return;

    const sendHeartbeat = (deltaSeconds = 0, segmentStartSeconds = video.currentTime) => {
      sendProgressHeartbeat({
        courseId,
        lessonId: lesson._id!,
        lessonType: 'VIDEO',
        sessionId,
        positionSeconds: Math.floor(video.currentTime),
        watchedSecondsDelta: deltaSeconds,
        segmentStartSeconds: Math.floor(segmentStartSeconds),
        playbackRate: video.playbackRate,
        tabVisible: document.visibilityState === 'visible',
      });
    };

    const flushProgress = () => {
      const currentTime = Math.floor(video.currentTime);
      const watchedSeconds = Math.floor(video.currentTime - lastPositionRef.current);
      if (currentTime <= 0) return;
      const deltaSeconds = watchedSeconds > 0 && watchedSeconds <= 20 ? Math.min(15, watchedSeconds) : 0;
      sendHeartbeat(deltaSeconds, deltaSeconds > 0 ? lastPositionRef.current : video.currentTime);
      lastPositionRef.current = video.currentTime;
    };

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
            if (hasAppliedInitialPositionRef.current || initialPositionSeconds <= 0) return;
            const video = event.currentTarget;
            if (Number.isFinite(video.duration) && initialPositionSeconds < video.duration - 2) {
              video.currentTime = initialPositionSeconds;
              lastPositionRef.current = initialPositionSeconds;
            }
            hasAppliedInitialPositionRef.current = true;
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onSeeking={(event) => {
            seekOriginRef.current = lastPositionRef.current || event.currentTarget.currentTime;
            setIsSeeking(true);
          }}
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

        <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 backdrop-blur-sm">
          <Shield className="h-3 w-3 text-emerald-400" />
          <span className="text-xs font-medium text-white">Nội dung được bảo vệ</span>
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
