// ========================
// NavUserDropdown: Avatar + dropdown menu khi user đã đăng nhập
// ========================
import { useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, User, BookOpen, Settings, ShoppingCart, Heart, LayoutDashboard, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { NavbarUser } from './navbar.utils';

interface NavUserDropdownProps {
  user: NavbarUser;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onLogout: () => void;
}

export const NavUserDropdown = ({
  user,
  isOpen,
  onToggle,
  onClose,
  onLogout,
}: NavUserDropdownProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Đóng dropdown khi chuyển trang
  useEffect(() => {
    onClose();
  }, [location.pathname]);

  return (
    <div className="hidden md:flex items-center gap-2 relative" ref={containerRef}>
      <Button
        type="button"
        variant="ghost"
        className="flex h-auto w-auto items-center gap-2 cursor-pointer group rounded-full overflow-hidden p-0 hover:bg-transparent"
        onClick={onToggle}
      >
        <UserAvatar
          user={user}
          className="h-8 w-8 text-sm border-2 border-transparent group-hover:border-primary/50 transition-colors"
        />
      </Button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-3 w-72 bg-popover text-popover-foreground border border-border shadow-lg rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
          {/* Header */}
          <div className="p-4 border-b border-border bg-secondary/30">
            <div className="flex items-center gap-3">
              <UserAvatar user={user} className="h-10 w-10 text-base" />
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm truncate">{user.fullName}</span>
                <span className="text-xs text-muted-foreground truncate">{user.email}</span>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link
              to="/profile"
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary transition-colors"
              onClick={onClose}
            >
              <User className="h-4 w-4 text-muted-foreground" />
              Hồ sơ công khai
            </Link>
            <Link
              to="/settings"
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary transition-colors"
              onClick={onClose}
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              Cài đặt
            </Link>
            <Link
              to="/student/dashboard"
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary transition-colors"
              onClick={onClose}
            >
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              Học tập
            </Link>
            <Link
              to="/cart"
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary transition-colors"
              onClick={onClose}
            >
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              Giỏ hàng
            </Link>
            <Link
              to="/student/dashboard?tab=wishlist"
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary transition-colors"
              onClick={onClose}
            >
              <Heart className="h-4 w-4 text-muted-foreground" />
              Khóa học mong muốn
            </Link>
            {user.role === 'INSTRUCTOR' && (
              <Link
                to="/instructor/dashboard"
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary transition-colors text-primary font-semibold"
                onClick={onClose}
              >
                <LayoutDashboard className="h-4 w-4 text-primary" />
                Bảng điều khiển Giảng viên
              </Link>
            )}
            <Link
              to="/student/dashboard?tab=payments"
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary transition-colors"
              onClick={onClose}
            >
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              Lịch sử thanh toán
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t border-border py-2">
            <Button
              type="button"
              variant="ghost"
              className="flex h-auto w-full items-center justify-start gap-3 rounded-none px-4 py-2.5 text-sm text-left text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
