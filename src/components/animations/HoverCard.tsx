import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface HoverCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function HoverCard({ children, className = '', onClick }: HoverCardProps) {
  return (
    <motion.div
      className={className}
      whileHover={{ y: -8, transition: { duration: 0.2, ease: "easeOut" } }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
