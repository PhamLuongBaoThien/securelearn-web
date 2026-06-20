import { useEffect, useRef, useState } from 'react';
import { CircleHelp, Flame } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { LearnerActivitySummary } from '@/services/progressApi';

type StreakGoalWidgetVariant = 'hero' | 'card' | 'compact' | 'plain';

type StreakGoalWidgetProps = {
  activity?: LearnerActivitySummary;
  isLoading?: boolean;
  variant?: StreakGoalWidgetVariant;
  showHelp?: boolean;
  showStatusText?: boolean;
  showCelebration?: boolean;
  className?: string;
};

const DEFAULT_DAILY_GOAL_SECONDS = 300;

const DAILY_GOAL_RING_SIZE = 44;
const DAILY_GOAL_RING_STROKE = 3.5;
const HERO_RING_SIZE = 52;
const HERO_RING_STROKE = 3;
const COMPACT_RING_SIZE = 32;
const COMPACT_RING_STROKE = 3;

function getRingMetrics(variant: StreakGoalWidgetVariant) {
  const size = variant === 'hero' ? HERO_RING_SIZE : variant === 'compact' ? COMPACT_RING_SIZE : DAILY_GOAL_RING_SIZE;
  const stroke = variant === 'hero' ? HERO_RING_STROKE : variant === 'compact' ? COMPACT_RING_STROKE : DAILY_GOAL_RING_STROKE;
  const radius = (size - stroke) / 2;
  return {
    size,
    stroke,
    radius,
    circumference: 2 * Math.PI * radius,
    iconSize: variant === 'hero' ? 'h-6 w-6' : variant === 'compact' ? 'h-4 w-4' : 'h-5 w-5',
  };
}

function DailyGoalRing({
  todayActiveSeconds,
  dailyGoalSeconds,
  completed,
  streak,
  variant,
}: {
  todayActiveSeconds: number;
  dailyGoalSeconds: number;
  completed: boolean;
  streak: number;
  variant: StreakGoalWidgetVariant;
}) {
  const { size, stroke, radius, circumference, iconSize } = getRingMetrics(variant);
  const percent = Math.min(100, (todayActiveSeconds / Math.max(1, dailyGoalSeconds)) * 100);
  const offset = circumference - (percent / 100) * circumference;
  const minutesDone = Math.floor(todayActiveSeconds / 60);
  const totalMinutes = Math.floor(dailyGoalSeconds / 60);

  const colorClass = completed
    ? 'text-emerald-500 dark:text-emerald-400'
    : streak > 0
      ? 'text-amber-500 dark:text-amber-400'
      : 'text-zinc-400 dark:text-zinc-500';

  const trackColorClass = variant === 'hero'
    ? 'text-white/10'
    : variant === 'compact'
      ? 'text-zinc-200 dark:text-zinc-700'
      : 'text-zinc-200 dark:text-zinc-800';

  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative flex cursor-default items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={stroke}
                className={trackColorClass}
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className={`transition-all duration-700 ${colorClass}`}
              />
            </svg>
            <Flame className={`absolute ${iconSize} ${colorClass}`} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-52 rounded-xl">
          <p className="text-xs font-semibold">Nhiệm vụ hằng ngày</p>
          <p className="mt-1 text-xs">
            {completed
              ? `Hoàn thành! Đã học ${minutesDone} / ${totalMinutes} phút hôm nay.`
              : `Đã học ${minutesDone} / ${totalMinutes} phút hôm nay.`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function CelebrationParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full"
          style={{
            left: `${50 + (Math.random() - 0.5) * 60}%`,
            top: `${50 + (Math.random() - 0.5) * 60}%`,
            backgroundColor: ['#fbbf24', '#f59e0b', '#fb923c', '#34d399', '#22d3ee', '#a78bfa'][i % 6],
            animation: `streak-particle ${0.6 + Math.random() * 0.4}s ease-out forwards`,
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes streak-particle {
          0% { opacity: 1; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.2) translate(${Math.random() > 0.5 ? '' : '-'}${8 + Math.random() * 12}px, -${10 + Math.random() * 16}px); }
          100% { opacity: 0; transform: scale(0.5) translate(${Math.random() > 0.5 ? '' : '-'}${16 + Math.random() * 20}px, -${20 + Math.random() * 24}px); }
        }
      `}</style>
    </div>
  );
}

export function StreakGoalWidget({
  activity,
  isLoading = false,
  variant = 'hero',
  showHelp = variant !== 'compact',
  showStatusText = variant !== 'compact',
  showCelebration = variant === 'hero',
  className = '',
}: StreakGoalWidgetProps) {
  const streak = activity?.currentStreakDays ?? 0;
  const streakAtRisk = activity?.streakAtRisk ?? false;
  const todayGoalCompleted = activity?.todayGoalCompleted ?? false;
  const todayActiveSeconds = activity?.todayActiveSeconds ?? 0;
  const dailyGoalSeconds = activity?.dailyGoalSeconds ?? DEFAULT_DAILY_GOAL_SECONDS;
  const todayRemainingSeconds = activity?.todayRemainingSeconds ?? 0;
  const isStreakActive = streak > 0;
  const prevGoalCompletedRef = useRef(todayGoalCompleted);
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    if (!showCelebration) {
      prevGoalCompletedRef.current = todayGoalCompleted;
      return;
    }

    if (todayGoalCompleted && !prevGoalCompletedRef.current) {
      setCelebrating(true);
      const timer = setTimeout(() => setCelebrating(false), 1500);
      prevGoalCompletedRef.current = todayGoalCompleted;
      return () => clearTimeout(timer);
    }

    prevGoalCompletedRef.current = todayGoalCompleted;
  }, [showCelebration, todayGoalCompleted]);

  const wrapperClass = variant === 'compact'
    ? `relative inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-2.5 py-1.5 dark:bg-zinc-800 ${className}`
    : variant === 'plain'
      ? `relative ${className}`
      : `relative rounded-2xl border px-5 py-4 backdrop-blur-md transition-all duration-500 ${
          streakAtRisk
            ? 'border-red-500/40 bg-red-500/5 shadow-[0_0_20px_rgba(239,68,68,0.15)] animate-[streak-risk-pulse_2s_ease-in-out_infinite]'
            : todayGoalCompleted
              ? 'border-emerald-400/30 bg-emerald-500/5 shadow-[0_0_20px_rgba(52,211,153,0.15)]'
              : variant === 'hero'
                ? 'border-white/10 bg-white/5'
                : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950'
        } ${className}`;

  return (
    <div className={wrapperClass}>
      {celebrating && <CelebrationParticles />}
      {variant !== 'compact' && (
        <style>{`
          @keyframes streak-risk-pulse {
            0%, 100% { border-color: rgba(239, 68, 68, 0.4); box-shadow: 0 0 20px rgba(239, 68, 68, 0.15); }
            50% { border-color: rgba(239, 68, 68, 0.7); box-shadow: 0 0 28px rgba(239, 68, 68, 0.25); }
          }
        `}</style>
      )}
      <div className={variant === 'compact' ? 'relative flex items-center gap-1.5' : 'relative flex items-center gap-4'}>
        <DailyGoalRing
          todayActiveSeconds={todayActiveSeconds}
          dailyGoalSeconds={dailyGoalSeconds}
          completed={todayGoalCompleted}
          streak={streak}
          variant={variant}
        />
        <div>
          <p className={variant === 'compact'
            ? 'text-xs font-bold text-zinc-700 dark:text-zinc-200'
            : variant === 'hero'
              ? 'text-3xl font-bold leading-none tracking-tight text-white'
              : 'text-3xl font-bold text-zinc-950 dark:text-white'}
          >
            {isLoading ? '-' : streak}
          </p>
          {variant !== 'compact' && <p className="mt-1 text-xs font-medium text-zinc-400">ngày streak</p>}
          {showStatusText && streakAtRisk && (
            <p className={variant === 'hero' ? 'mt-1 text-xs font-medium text-red-400' : 'mt-0.5 text-xs font-medium text-amber-600 dark:text-amber-400'}>
              {variant === 'hero'
                ? `Học thêm ${Math.ceil(todayRemainingSeconds / 60)} phút để giữ lửa`
                : `Còn ${Math.ceil(todayRemainingSeconds / 60)} phút nữa`}
            </p>
          )}
          {showStatusText && todayGoalCompleted && isStreakActive && variant === 'hero' && (
            <p className="mt-1 text-xs font-medium text-emerald-400">Nhiệm vụ hôm nay hoàn thành!</p>
          )}
        </div>
        {showHelp && (
          <TooltipProvider delayDuration={120}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-zinc-400 transition-colors hover:text-white"
                >
                  <CircleHelp className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-60 rounded-xl">
                <p className="text-xs font-semibold">Chuỗi ngày học liên tục</p>
                <p className="mt-1 text-xs">
                  Học tối thiểu {Math.floor(dailyGoalSeconds / 60)} phút mỗi ngày để duy trì streak.
                  {streakAtRisk ? ' Chuỗi streak đang có nguy cơ mất!' : ''}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}
