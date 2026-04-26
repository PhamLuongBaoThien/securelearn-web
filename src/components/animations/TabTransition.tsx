import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface AnimatedTabContentProps {
  activeKey: string;
  className?: string;
  children: ReactNode;
}

export function AnimatedTabContent({ activeKey, className = '', children }: AnimatedTabContentProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeKey}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
