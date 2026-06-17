import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Loader2, Shield, VideoOff } from 'lucide-react';
import { getAccessToken, getApiBaseUrl } from '@/services/apiClient';
import { useCreatePlaybackSession, useSubscriptionHeartbeat } from '@/hooks/useCourseLearning';
import type { ILesson } from '@/services/courseApi';

const HEARTBEAT_MS = 15_000;

const absoluteApiUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) return path;
  const base = getApiBaseUrl() || window.location.origin;
  return new URL(path, base).toString();
};

interface VideoPlayerProps {
  courseId: string;
  lesson: ILesson;
  accessSource?: 'PURCHASE' | 'SUBSCRIPTION';
  watermarkText?: string;
  onTimeChange?: (seconds: number) => void;
  pauseSignal?: number;
}

export function VideoPlayer({
  courseId,
  lesson,
  accessSource,
  watermarkText,
  onTimeChange,
  pauseSignal = 0,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sessionId = useMemo(() => crypto.randomUUID(), []);
  const lastPositionRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const playbackSession = useCreatePlaybackSession();
  const createPlayback = playbackSession.mutateAsync;
  const heartbeat = useSubscriptionHeartbeat();
  const sendHeartbeat = heartbeat.mutate;
  const heartbeatPending = heartbeat.isPending;
  const isSubscription = accessSource === 'SUBSCRIPTION';

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
    const video = videoRef.current;
    if (!video || !isSubscription || !lesson._id) return;

    const startSession = () => {
      // Heartbeat chỉ dùng cho flow thuê bao để tính usage.
      // Mua đứt vẫn xem video theo playback session nhưng không gửi usage về payment-service.
      lastPositionRef.current = video.currentTime;
      sendHeartbeat({
        courseId,
        lessonId: lesson._id!,
        sessionId,
        segmentIndex: Math.max(0, Math.floor(video.currentTime / 15)),
        qualifiedSeconds: 1,
      });
    };

    const interval = window.setInterval(() => {
      if (
        !isPlaying ||
        isSeeking ||
        document.visibilityState !== 'visible' ||
        video.paused ||
        video.ended ||
        heartbeatPending
      ) return;

      const watchedSeconds = Math.floor(video.currentTime - lastPositionRef.current);
      if (watchedSeconds < 1 || watchedSeconds > 17) {
        lastPositionRef.current = video.currentTime;
        return;
      }
      const segmentIndex = Math.max(0, Math.floor(Math.max(0, video.currentTime - 1) / 15));
      sendHeartbeat({
        courseId,
        lessonId: lesson._id!,
        sessionId,
        segmentIndex,
        qualifiedSeconds: Math.min(15, watchedSeconds),
      });
      lastPositionRef.current = video.currentTime;
    }, HEARTBEAT_MS);

    video.addEventListener('play', startSession);
    return () => {
      window.clearInterval(interval);
      video.removeEventListener('play', startSession);
    };
  }, [
    courseId,
    heartbeatPending,
    isPlaying,
    isSeeking,
    isSubscription,
    lesson._id,
    sendHeartbeat,
    sessionId,
  ]);

  const handleContextMenu = useCallback((event: React.MouseEvent) => event.preventDefault(), []);

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
      <div className="relative aspect-video w-full select-none bg-black" onContextMenu={handleContextMenu}>
        <video
          ref={videoRef}
          controls
          playsInline
          className="absolute inset-0 h-full w-full"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onSeeking={() => setIsSeeking(true)}
          onSeeked={(event) => {
            lastPositionRef.current = event.currentTarget.currentTime;
            setIsSeeking(false);
          }}
          onTimeUpdate={(event) => onTimeChange?.(event.currentTarget.currentTime)}
        />

        {watermarkText && (
          <span className="pointer-events-none absolute bottom-12 right-4 z-20 text-xs font-mono text-white/20">
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
