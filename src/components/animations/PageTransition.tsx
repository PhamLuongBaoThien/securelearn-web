// ========================
// PageTransition: Hiệu ứng chuyển trang kiểu "cửa đóng lại → hiện logo → mở ra"
// Sử dụng useBlocker để chặn định tuyến, giúp chuyển trang mượt mà kể cả khi bấm Back/Forward của Browser
// ========================
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useBlocker } from 'react-router-dom';
import { useBrandLogoSrc } from '@/components/branding/useBrandLogoSrc';
import { PageTransitionContext } from './pageTransitionContext';

// ── Timing (ms) ──────────────────────────────────────────
const CLOSE_DURATION = 0.5;   // thời gian 2 cửa đóng lại
const LOGO_HOLD = 0.6;        // thời gian giữ logo ở giữa
const OPEN_DURATION = 0.5;    // thời gian 2 cửa mở ra

// ── Provider + Overlay ───────────────────────────────────
export const PageTransitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const logoSrc = useBrandLogoSrc();
  const navigate = useNavigate();
  const [phase, setPhaseState] = useState<'closing' | 'holding' | 'opening' | 'idle'>('idle');
  
  // Dùng ref để blocker callback luôn lấy được trạng thái mới nhất ngay lập tức
  const phaseRef = useRef<'closing' | 'holding' | 'opening' | 'idle'>('idle');
  const setPhase = (nextPhase: 'closing' | 'holding' | 'opening' | 'idle') => {
    phaseRef.current = nextPhase;
    setPhaseState(nextPhase);
  };

  // Sử dụng useBlocker để chặn định tuyến khi chuyển đổi qua lại giữa Student ↔ Instructor
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    const currentPath = currentLocation.pathname;
    const nextPath = nextLocation.pathname;

    const isCurrentInst = currentPath.startsWith('/instructor');
    const isNextInst = nextPath.startsWith('/instructor');

    // Chỉ chặn khi chuyển đổi qua lại giữa giao diện Instructor và Student/Public
    const isSwitching = (isCurrentInst && !isNextInst) || (!isCurrentInst && isNextInst);

    if (isSwitching) {
      if (phaseRef.current === 'holding') {
        return false; // Cho phép chuyển hướng đi tiếp khi cửa đã đóng kín
      }
      return true; // Chặn lại để đóng cửa trước
    }
    return false;
  });
  const visualPhase = blocker.state === 'blocked' && phase === 'idle' ? 'closing' : phase;

  // Khi định tuyến bị chặn, đóng cửa rồi mới proceed
  useEffect(() => {
    if (blocker.state === 'blocked') {
      const t1 = setTimeout(() => {
        setPhase('holding');
        blocker.proceed?.(); // Kích hoạt chuyển trang thực sự đằng sau cánh cửa đóng
      }, CLOSE_DURATION * 1000);

      return () => clearTimeout(t1);
    }
  }, [blocker]);

  // Điều khiển các phase mở cửa và kết thúc sau khi đã chuyển trang xong
  useEffect(() => {
    if (phase === 'holding') {
      const t2 = setTimeout(() => {
        setPhase('opening');
      }, LOGO_HOLD * 1000);

      return () => clearTimeout(t2);
    } else if (phase === 'opening') {
      const t3 = setTimeout(() => {
        setPhase('idle');
      }, OPEN_DURATION * 1000);

      return () => clearTimeout(t3);
    }
  }, [phase]);

  // Tương thích ngược
  const navigateWithTransition = (to: string) => {
    navigate(to);
  };

  const showOverlay = visualPhase !== 'idle';

  return (
    <PageTransitionContext.Provider value={{ navigateWithTransition }}>
      {children}

      <AnimatePresence>
        {showOverlay && (
          <div
            className="fixed inset-0 z-[9999] pointer-events-auto"
            style={{ perspective: '1200px' }}
          >
            {/* ── Panel trái (Màu đen bóng bẩy) ── */}
            <motion.div
              className="absolute top-0 left-0 h-full w-1/2 origin-left"
              style={{
                background: '#000000',
                boxShadow: '4px 0 30px rgba(0,0,0,0.5)',
              }}
              initial={{ x: '-100%' }}
              animate={
                visualPhase === 'closing' || visualPhase === 'holding'
                  ? { x: '0%' }
                  : visualPhase === 'opening'
                    ? { x: '-100%' }
                    : { x: '-100%' }
              }
              exit={{ x: '-100%' }}
              transition={{
                duration: visualPhase === 'closing' ? CLOSE_DURATION : OPEN_DURATION,
                ease: [0.76, 0, 0.24, 1], // easeInOutQuart
              }}
            >
              {/* Decorative pattern */}
              <div className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                  backgroundSize: '40px 40px',
                }}
              />
              {/* Gradient edge glow */}
              <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-indigo-400/30 to-transparent" />
            </motion.div>

            {/* ── Panel phải (Màu đen bóng bẩy) ── */}
            <motion.div
              className="absolute top-0 right-0 h-full w-1/2 origin-right"
              style={{
                background: '#000000',
                boxShadow: '-4px 0 30px rgba(0,0,0,0.5)',
              }}
              initial={{ x: '100%' }}
              animate={
                visualPhase === 'closing' || visualPhase === 'holding'
                  ? { x: '0%' }
                  : visualPhase === 'opening'
                    ? { x: '100%' }
                    : { x: '100%' }
              }
              exit={{ x: '100%' }}
              transition={{
                duration: visualPhase === 'closing' ? CLOSE_DURATION : OPEN_DURATION,
                ease: [0.76, 0, 0.24, 1],
              }}
            >
              {/* Decorative pattern */}
              <div className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                  backgroundSize: '40px 40px',
                }}
              />
              {/* Gradient edge glow */}
              <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-indigo-400/30 to-transparent" />
            </motion.div>

            {/* ── Logo ở giữa ── */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={
                    visualPhase === 'holding'
                      ? { opacity: 1, scale: 1 }
                      : visualPhase === 'opening'
                      ? { opacity: 0, scale: 1.1 }
                      : { opacity: 0, scale: 0.5 }
                }
                transition={{
                    duration: visualPhase === 'holding' ? 0.35 : 0.25,
                    ease: visualPhase === 'holding' ? [0.34, 1.56, 0.64, 1] : 'easeOut',
                }}
              >
                <motion.img
                  src={logoSrc}
                  alt="SecureLearn"
                  className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-2xl"
                  animate={
                    visualPhase === 'holding'
                      ? { rotate: [0, -5, 5, 0] }
                      : {}
                  }
                  transition={{
                    duration: 0.5,
                    ease: 'easeInOut',
                  }}
                />
                {/* Glowing ring behind logo */}
                <motion.div
                  className="absolute w-40 h-40 md:w-52 md:h-52 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
                  }}
                  animate={
                    visualPhase === 'holding'
                      ? { scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }
                      : { scale: 0, opacity: 0 }
                  }
                  transition={{
                    duration: 0.8,
                    repeat: visualPhase === 'holding' ? Infinity : 0,
                    ease: 'easeInOut',
                  }}
                />
                {/* Text dưới logo */}
                {/* <motion.span
                  className="text-white/80 text-sm md:text-base font-medium tracking-widest uppercase"
                  initial={{ opacity: 0, y: 10 }}
                  animate={
                    phase === 'holding'
                      ? { opacity: 1, y: 0 }
                      : { opacity: 0, y: 10 }
                  }
                  transition={{ duration: 0.3, delay: phase === 'holding' ? 0.15 : 0 }}
                >
                  SecureLearn
                </motion.span> */}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </PageTransitionContext.Provider>
  );
};
