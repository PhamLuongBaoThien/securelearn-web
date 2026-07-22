// ========================
// Navbar Utils: Constants, types, và pure functions
// ========================
import type { ReactNode } from 'react';
import type { ICourseCategoryNode } from '@/services/courseApi';
import type { SidebarEntry, MenuItem } from '../Sidebar';


// ===== Types =====

export interface TeachButtonProps {
  text: string;
  to: string;
}

export interface NavbarUser {
  fullName: string;
  email: string;
  role?: string;
  publicSlug?: string;
}

// ===== CSS Helper Functions =====

/** Class cho nav link trên desktop */
export const desktopNavLinkClass = (active = false) =>
  `rounded-full px-3 py-2 text-sm font-medium transition-all duration-200 ${
    active
      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-1 ring-primary/70'
      : 'text-foreground/80 hover:bg-secondary hover:text-primary'
  }`;

/** Class cho nav link trên mobile */
export const mobileNavLinkClass = (active = false) =>
  `px-4 py-3 transition-colors ${
    active
      ? 'bg-primary text-primary-foreground font-semibold'
      : 'hover:bg-secondary'
  }`;

// ===== Pure Functions =====

/**
 * Trả về text và đường dẫn cho nút "Giảng dạy / Giảng viên / Học viên"
 * dựa trên trạng thái đăng nhập và vị trí hiện tại
 */
export const getTeachButtonProps = (
  user: NavbarUser | null,
  isInstructorView: boolean,
  isInstructor: boolean
): TeachButtonProps => {
  if (!user) return { text: 'Giảng dạy trên SecureLearn', to: '/teach' };
  if (isInstructorView) return { text: 'Học viên', to: '/student/dashboard' };
  if (isInstructor) return { text: 'Giảng viên', to: '/instructor/dashboard' };
  return { text: 'Giảng dạy trên SecureLearn', to: '/teach' };
};

/**
 * Giải quyết giá trị theme 'system' thành 'dark' hoặc 'light'
 * dựa trên cài đặt hệ điều hành
 */
export const resolveTheme = (theme: string): 'dark' | 'light' => {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme as 'dark' | 'light';
};

/**
 * Xây dựng danh sách SidebarEntry cho mobile sidebar
 * từ categories, trạng thái auth, và teach button props
 */
export const buildMobileSidebarEntries = (
  categories: ICourseCategoryNode[],
  isAuthenticated: boolean,
  user: NavbarUser | null,
  teachBtnProps: TeachButtonProps,
  icons: {
    bookOpen: ReactNode;
    heart?: ReactNode;
    creditCard?: ReactNode;
    user: ReactNode;
    settings: ReactNode;
    search: ReactNode;
    layers: ReactNode;
    monitor: ReactNode;
  }
): SidebarEntry[] => {
  const entries: SidebarEntry[] = [];

  // Tài khoản
  if (isAuthenticated && user) {
    entries.push({
      type: 'label',
      label: {
        labelName: user.fullName || 'Tài khoản',
        items: [
          { name: 'Khóa học của tôi', path: '/student/dashboard', icon: icons.bookOpen },
          { name: 'Danh sách mong muốn', path: '/student/dashboard?tab=wishlist', icon: icons.heart },
          { name: 'Lịch sử thanh toán', path: '/student/dashboard?tab=payments', icon: icons.creditCard },
          { name: 'Hồ sơ công khai', path: user.publicSlug ? '/users/' + user.publicSlug : '/account/settings/profile', icon: icons.user },
          { name: 'Cài đặt tài khoản', path: '/account/settings/profile', icon: icons.settings },
        ],
      },
    });
  } else {
    entries.push({
      type: 'label',
      label: {
        labelName: 'Tài khoản',
        items: [
          { name: 'Đăng nhập', path: '/auth/login', icon: icons.user },
          { name: 'Đăng ký', path: '/auth/signup', icon: icons.user },
        ],
      },
    });
  }

  // Khám phá
  entries.push({ type: 'label', label: { labelName: 'Khám phá', items: [] } });

  // Khám phá tất cả
  entries.push({
    type: 'single',
    name: 'Tất cả khóa học',
    path: '/courses',
    icon: icons.search,
  });

  // Chỉ hiển thị các danh mục gốc chính trên Mobile Sidebar (không đệ quy sâu gây rối)
  categories.forEach((cat) => {
    entries.push({
      type: 'single',
      name: cat.name,
      path: `/courses?category=${encodeURIComponent(cat.slug)}`,
      icon: icons.layers,
    });
  });

  // Giảng dạy
  entries.push({
    type: 'label',
    label: {
      labelName: 'Giảng dạy',
      items: [{ name: teachBtnProps.text, path: teachBtnProps.to, icon: icons.monitor }],
    },
  });

  return entries;
};
