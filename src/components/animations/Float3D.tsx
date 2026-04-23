import { motion } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';
import { useMemo } from 'react';

interface Float3DProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
  rotateX?: number;
  rotateY?: number;
  duration?: number;
}

export function Float3D({
  children,
  className = '',
  delay = 0,
  distance = 8,
  rotateX = 8,
  rotateY = -6,
  duration = 6,
}: Float3DProps) {
  const floatStyle = useMemo(
    () =>
      ({
        '--float-distance': `${distance}px`,
        '--float-rotate-x': `${rotateX}deg`,
        '--float-rotate-y': `${rotateY}deg`,
        '--float-duration': `${duration}s`,
        '--float-delay': `${delay}s`,
        animation: 'float3d var(--float-duration) cubic-bezier(0.45, 0.05, 0.55, 0.95) var(--float-delay) infinite',
        transformStyle: 'preserve-3d',
        willChange: 'transform',
        backfaceVisibility: 'hidden',
      }) as CSSProperties,
    [delay, distance, duration, rotateX, rotateY]
  );

  return (
    <motion.div
      className={`transform-gpu ${className}`.trim()}
      initial={{ opacity: 0, y: 24, rotateX, rotateY }}
      animate={{
        opacity: 1,
        y: 0,
        rotateX,
        rotateY,
      }}
      transition={{
        opacity: { duration: 0.6, delay, ease: 'easeOut' },
        y: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] },
        rotateX: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] },
        rotateY: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] },
      }}
      style={floatStyle}
    >
      {children}
    </motion.div>
  );
}
