import type { Variants } from 'framer-motion';

/**
 * ==========================================
 * DEFAULT SIDEBAR ANIMATIONS (FALLBACKS)
 * ==========================================
 */

export const sidebarSubMenuVariants: Variants = {
  hidden: { 
    height: 0, 
    opacity: 0,
    overflow: 'hidden'
  },
  visible: { 
    height: 'auto', 
    opacity: 1,
    transition: { 
      duration: 0.2, 
      ease: 'easeInOut' 
    }
  }
};

export const sidebarTextVariants: Variants = {
  hidden: { 
    opacity: 0, 
    width: 0,
    transition: { duration: 0.15 }
  },
  visible: { 
    opacity: 1, 
    width: 'auto',
    transition: { duration: 0.2 }
  }
};

/**
 * ==========================================
 * ADMIN SIDEBAR ANIMATIONS
 * ==========================================
 */

export const adminSubMenuVariants: Variants = sidebarSubMenuVariants;
export const adminTextVariants: Variants = sidebarTextVariants;

/**
 * ==========================================
 * INSTRUCTOR SIDEBAR ANIMATIONS
 * ==========================================
 */

// Đối với Instructor Sidebar, nhãn chữ (text) chỉ fade mượt mà 
// thay vì co giãn width để tránh bị bẻ dòng chữ khi sidebar co giãn width.
export const instructorTextVariants: Variants = sidebarTextVariants;
