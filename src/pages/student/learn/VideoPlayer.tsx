import { useEffect, useRef, useState, useCallback } from 'react';
import { Shield } from 'lucide-react';

// ─── Constants ───────────────────────────────
const VIMEO_URL =
  'https://player.vimeo.com/video/76979871?h=8272103f6e&autoplay=0&title=0&byline=0&portrait=0';
const HEARTBEAT_MS = 15_000;

// ─── Watermark hook ───────────────────────────
function useWatermark(active: boolean) {
  const [pos, setPos] = useState({ top: '20%', left: '30%' });
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setPos({ top: `${10 + Math.random() * 70}%`, left: `${5 + Math.random() * 75}%` });
    }, 4000);
    return () => clearInterval(id);
  }, [active]);
  return pos;
}

// ─── Heartbeat hook ───────────────────────────
function useHeartbeat(lessonId: string, active: boolean) {
  const tick = useRef(0);
  useEffect(() => {
    if (!active) return;
    tick.current = 0;
    const id = setInterval(() => {
      tick.current++;
      console.log(`♥ [Heartbeat] Lesson ${lessonId} — tick #${tick.current} @ ${new Date().toISOString()}`);
    }, HEARTBEAT_MS);
    return () => clearInterval(id);
  }, [lessonId, active]);
}

// ─── Props ────────────────────────────────────
interface VideoPlayerProps {
  lessonId: string;
  lessonTitle: string;
  lessonMeta?: string;
  watermarkText?: string;
}

// ─── Component ────────────────────────────────
export function VideoPlayer({
  lessonId,
  lessonTitle,
  lessonMeta = 'Video · 25:10',
  watermarkText = 'Minh Tuấn · minhtuan@email.com',
}: VideoPlayerProps) {
  const [loaded, setLoaded] = useState(false);
  const watermarkPos = useWatermark(loaded);
  useHeartbeat(lessonId, loaded);

  const handleContextMenu = useCallback((e: React.MouseEvent) => e.preventDefault(), []);

  return (
    <div className="flex flex-col">
      {/* Video */}
      <div
        className="relative w-full bg-black select-none"
        style={{ aspectRatio: '16/9' }}
        onContextMenu={handleContextMenu}
      >
        <iframe
          key={lessonId}
          src={VIMEO_URL}
          className="absolute inset-0 w-full h-full"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          onLoad={() => setLoaded(true)}
        />

        {/* Watermark */}
        {loaded && (
          <div
            className="absolute pointer-events-none z-20 transition-all duration-[2000ms] ease-in-out"
            style={{ top: watermarkPos.top, left: watermarkPos.left }}
          >
            <span className="text-white text-xs font-mono whitespace-nowrap select-none"
              style={{ opacity: 0.16, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
              {watermarkText}
            </span>
          </div>
        )}

        {/* DRM badge */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm">
          <Shield className="w-3 h-3 text-emerald-400" />
          <span className="text-white text-xs font-medium">DRM Protected</span>
        </div>
      </div>

      {/* Lesson info */}
      <div className="px-5 py-3.5 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-white line-clamp-1">
          {lessonTitle}
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{lessonMeta}</p>
      </div>
    </div>
  );
}
