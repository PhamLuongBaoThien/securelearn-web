import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export const SlideUp = ({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number, className?: string }) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }} // smooth spring-like ease
    >
      {children}
    </motion.div>
  );
};
