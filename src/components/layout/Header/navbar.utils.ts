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
 * Xây dựng đệ quy danh sách MenuItem từ cây ICourseCategoryNode
 * để dùng trong mobile sidebar
 */
export const buildRecursiveCategories = (
  cats: ICourseCategoryNode[],
  iconNode: ReactNode
): MenuItem[] =>
  cats.map((c) => {
    const item: MenuItem = {
      name: c.name,
      path: `/courses?category=${encodeURIComponent(c.slug)}`,
      icon: iconNode,
    };
    if (c.children && c.children.length > 0) {
      item.children = buildRecursiveCategories(
        c.children as ICourseCategoryNode[],
        iconNode
      );
    }
    return item;
  });

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
    user: ReactNode;
    settings: ReactNode;
    search: ReactNode;
    layers: ReactNode;
    minus: ReactNode;
    monitor: ReactNode;
  }
): SidebarEntry[] => {
  const entries: SidebarEntry[] = [];

  // Tài khoản
  if (isAuthenticated && user) {
    entries.push({
      type: 'label',
      label: {
        labelName: 'Tài khoản',
        items: [
          { name: 'Khóa học của tôi', path: '/student/dashboard', icon: icons.bookOpen },
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

  // Các danh mục gốc
  categories.forEach((cat) => {
    const item: SidebarEntry = {
      type: 'single',
      name: cat.name,
      path: `/courses?category=${encodeURIComponent(cat.slug)}`,
      icon: icons.layers,
    };
    if (cat.children && cat.children.length > 0) {
      item.children = buildRecursiveCategories(
        cat.children as ICourseCategoryNode[],
        icons.minus
      );
    }
    entries.push(item);
  });

  // Tất cả khóa học
  entries.push({
    type: 'single',
    name: 'Tất cả khóa học',
    path: '/courses',
    icon: icons.search,
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
