// ========================
// NavMobileDrawer: Mobile sidebar drawer + overlay
// ========================
import { User } from 'lucide-react';
import { Sidebar } from '../Sidebar';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { SidebarEntry } from '../Sidebar';
import type { NavbarUser } from './navbar.utils';

interface NavMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entries: SidebarEntry[];
  user: NavbarUser | null;
  isAuthenticated: boolean;
  currentTheme: 'light' | 'dark';
  onThemeChange: () => void;
  onLogout?: () => void;
  logoSrc: string;
}

export const NavMobileDrawer = ({
  isOpen,
  onClose,
  entries,
  user,
  isAuthenticated,
  currentTheme,
  onThemeChange,
  onLogout,
  logoSrc,
}: NavMobileDrawerProps) => {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[100] xl:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 w-72 z-[110] transform transition-transform duration-300 ease-in-out xl:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="absolute inset-0">
          <Sidebar
            entries={entries}
            collapsed={false}
            onToggleCollapsed={onClose}
            userFullName={user?.fullName || 'Người dùng'}
            userEmail={user?.email || 'Vui lòng đăng nhập để trải nghiệm'}
            userAvatarNode={
              isAuthenticated && user ? (
                <UserAvatar user={user} className="h-10 w-10 text-base" />
              ) : (
                <div className="h-10 w-10 flex items-center justify-center bg-secondary rounded-full">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
              )
            }
            profileLink={isAuthenticated ? '/profile' : undefined}
            theme={currentTheme}
            onThemeChange={onThemeChange}
            onLogout={isAuthenticated ? onLogout : undefined}
            logoSrc={logoSrc}
          />
        </div>
      </div>
    </>
  );
};
