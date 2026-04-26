// ========================
// Navbar: Thanh điều hướng chính
// Hiển thị user menu + chức năng đăng xuất khi đã đăng nhập.
// ========================
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { toggleTheme } from '../../features/dashboard/uiSlice';
import { useLogout } from '@/hooks/useAuth';
import { ShoppingCart, Search, Menu, Sun, Moon, X, ChevronRight, LogOut, User, BookOpen, Settings, Monitor, Compass, Layers, Minus, ArrowRight } from 'lucide-react';
import { Sidebar } from './Sidebar';
import type { SidebarEntry, MenuItem } from './Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { UserAvatar } from '@/components/ui/UserAvatar';
import { usePublicCourseCategories } from '@/hooks/usePublicCourseCategories';
import { toast } from 'sonner';
import brandLogo from '@/assets/logoweb.png';
import type { ICourseCategoryNode } from '@/services/courseApi';

const MegaMenuColumn = ({
  title,
  items,
  activeId,
  onHover,
}: {
  title?: string;
  items: ICourseCategoryNode[];
  activeId?: string | null;
  onHover: (item: ICourseCategoryNode) => void;
}) => {
  if (items.length === 0) return null;

  return (
    <div className="w-[260px] border-r border-border last:border-r-0 shrink-0 py-2 animate-in fade-in slide-in-from-left-4 duration-200 ease-out">
      {title ? (
        <div className="px-5 pt-3 pb-2 text-base font-bold text-foreground">
          {title}
        </div>
      ) : null}
      <ul>
        {items.map((item) => {
          const isActive = activeId === item._id;
          const hasChildren = (item.children || []).length > 0;

          return (
            <li key={item._id}>
              <Link
                to={`/courses?category=${encodeURIComponent(item.slug)}`}
                onMouseEnter={() => onHover(item)}
                className={`flex items-center justify-between gap-3 px-5 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-secondary text-primary font-medium'
                    : 'text-foreground/80 hover:text-primary hover:bg-secondary/40'
                }`}
              >
                <span className="line-clamp-1">{item.name}</span>
                {hasChildren ? <ChevronRight className="h-4 w-4 shrink-0 opacity-60" /> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export const Navbar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useAppSelector((state) => state.ui.theme);
  const cartItems = useAppSelector((state) => state.cart.cartItems);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { data: categories = [], isLoading: isCategoriesLoading } = usePublicCourseCategories();

  // Logic chuyển đổi nút Giảng dạy / Giảng viên / Học viên
  const isInstructor = user?.role === 'INSTRUCTOR';
  const isInstructorView = location.pathname.startsWith('/instructor');
  const isStudentView = location.pathname.startsWith('/student');

  const desktopNavLinkClass = (active = false) =>
    `rounded-full px-3 py-2 text-sm font-medium transition-all duration-200 ${
      active
        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-1 ring-primary/70'
        : 'text-foreground/80 hover:bg-secondary hover:text-primary'
    }`;

  const mobileNavLinkClass = (active = false) =>
    `px-4 py-3 transition-colors ${
      active
        ? 'bg-primary text-primary-foreground font-semibold'
        : 'hover:bg-secondary'
    }`;

  const getTeachButtonProps = () => {
    if (!user) return { text: 'Giảng dạy trên SecureLearn', to: '/teach' };
    if (isInstructorView) return { text: 'Học viên', to: '/student/dashboard' };
    if (isInstructor) return { text: 'Giảng viên', to: '/instructor/dashboard' };
    return { text: 'Giảng dạy trên SecureLearn', to: '/teach' };
  };

  const teachBtnProps = getTeachButtonProps();

  // Giải quyết trạng thái 'system' thành 'dark' hoặc 'light' dựa trên cài đặt của OS
  const currentTheme = theme === 'system' 
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') 
    : theme;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeRootId, setActiveRootId] = useState<string | null>(null);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [activeGrandchildId, setActiveGrandchildId] = useState<string | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Đóng user menu khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const logoutMutation = useLogout();

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    logoutMutation.mutate(undefined, {
      onSuccess: (data) => {
        toast.success(data?.message || 'Đã đăng xuất thành công.');
        navigate('/auth/login');
      },
    });
  };

  const navCategories = categories.slice(0, 6);
  const activeRoot = activeRootId ? navCategories.find((category) => category._id === activeRootId) : null;
  const activeChildren = activeRoot?.children || [];
  const activeChild = activeChildId ? activeChildren.find((category) => category._id === activeChildId) : null;
  const activeGrandchildren = activeChild?.children || [];
  const activeGrandchild = activeGrandchildId ? activeGrandchildren.find((category) => category._id === activeGrandchildId) : null;
  const activeFourthLevel = activeGrandchild?.children || [];

  const mobileSidebarEntries: SidebarEntry[] = [];

  if (isAuthenticated && user) {
    mobileSidebarEntries.push({
      type: 'label',
      label: {
        labelName: 'Tài khoản',
        items: [
          { name: 'Khóa học của tôi', path: '/student/dashboard', icon: <BookOpen className="w-4 h-4" /> },
          { name: 'Hồ sơ cá nhân', path: '/profile', icon: <User className="w-4 h-4" /> },
          { name: 'Cài đặt', path: '/settings', icon: <Settings className="w-4 h-4" /> },
        ]
      }
    });
  } else {
    mobileSidebarEntries.push({
      type: 'label',
      label: {
        labelName: 'Tài khoản',
        items: [
          { name: 'Đăng nhập', path: '/auth/login', icon: <User className="w-4 h-4" /> },
          { name: 'Đăng ký', path: '/auth/signup', icon: <User className="w-4 h-4" /> },
        ]
      }
    });
  }

  mobileSidebarEntries.push({
    type: 'label',
    label: {
      labelName: 'Khám phá',
      items: []
    }
  });

  const buildRecursiveCategories = (cats: ICourseCategoryNode[]): MenuItem[] => {
    return cats.map(c => {
      const item: MenuItem = {
        name: c.name,
        path: `/courses?category=${encodeURIComponent(c.slug)}`,
        icon: <Minus className="w-4 h-4 text-muted-foreground/40 shrink-0" />
      };
      
      if (c.children && c.children.length > 0) {
        item.children = buildRecursiveCategories(c.children as ICourseCategoryNode[]);
      }
      return item;
    });
  };

  categories.forEach(cat => {
    const item: SidebarEntry = {
      type: 'single',
      name: cat.name,
      path: `/courses?category=${encodeURIComponent(cat.slug)}`,
      icon: <Layers className="w-4 h-4 text-muted-foreground shrink-0" />
    };

    if (cat.children && cat.children.length > 0) {
      item.children = buildRecursiveCategories(cat.children as ICourseCategoryNode[]);
    }
    
    mobileSidebarEntries.push(item);
  });

  mobileSidebarEntries.push({
    type: 'single',
    name: 'Tất cả khóa học',
    path: '/courses',
    icon: <Search className="w-4 h-4 text-primary shrink-0" />
  });

  mobileSidebarEntries.push({
    type: 'label',
    label: {
      labelName: 'Giảng dạy',
      items: [
        { name: teachBtnProps.text, path: teachBtnProps.to, icon: <Monitor className="w-4 h-4" /> }
      ]
    }
  });

  return (
    <>
      <nav className="sticky top-4 mx-auto z-50 mb-6 w-[96%] max-w-[1440px] rounded-full border border-border/50 bg-background/80 shadow-lg backdrop-blur-md transition-all duration-300 dark:border-zinc-700/70 dark:bg-zinc-900/85 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_10px_30px_rgba(255,255,255,0.08)]">
        <div className="px-4 sm:px-6 flex h-[64px] items-center justify-between relative">
          
          {/* LEFT: Khám phá và Tìm kiếm */}
          <div className="flex items-center gap-3 flex-1 justify-start z-10">
            {/* Mobile Search Icon */}
            <Button 
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden p-2 hover:bg-secondary rounded-full transition-colors"
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Giao diện Danh mục trên Desktop */}
            <NavigationMenu className="hidden xl:flex">
              <NavigationMenuList>
                <NavigationMenuItem>
                <NavigationMenuTrigger 
                    onMouseEnter={() => {
                      setActiveRootId(null);
                      setActiveChildId(null);
                      setActiveGrandchildId(null);
                    }}
                    className="bg-transparent hover:bg-transparent focus:bg-transparent px-3 text-sm font-medium hover:text-primary transition-colors">
                    Khám phá
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    {isCategoriesLoading ? (
                      <div className="flex min-h-[420px] w-[260px] flex-col overflow-hidden rounded-md border border-border bg-popover shadow-xl p-5">
                        <div className="h-5 w-3/4 animate-pulse rounded bg-secondary mt-1"></div>
                        <div className="space-y-4 mt-6">
                          {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="flex items-center justify-between">
                              <div className="h-4 w-2/3 animate-pulse rounded bg-secondary"></div>
                              <div className="h-4 w-4 animate-pulse rounded bg-secondary"></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : navCategories.length > 0 ? (
                      <div className="flex min-h-[420px] w-max overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-xl">
                        <MegaMenuColumn
                          items={navCategories}
                          activeId={activeRoot?._id}
                          onHover={(item) => {
                            setActiveRootId(item._id);
                            setActiveChildId(null);
                            setActiveGrandchildId(null);
                          }}
                        />
                        <MegaMenuColumn
                          title={activeRoot?.name}
                          items={activeChildren}
                          activeId={activeChild?._id}
                          onHover={(item) => {
                            setActiveChildId(item._id);
                            setActiveGrandchildId(null);
                          }}
                        />
                        <MegaMenuColumn
                          title={activeChild?.name}
                          items={activeGrandchildren}
                          activeId={activeGrandchild?._id}
                          onHover={(item) => setActiveGrandchildId(item._id)}
                        />
                        <MegaMenuColumn
                          title={activeGrandchild?.name}
                          items={activeFourthLevel}
                          activeId={null}
                          onHover={() => {}}
                        />
                      </div>
                    ) : (
                      <div className="w-64 p-4 text-sm text-muted-foreground">Chưa có danh mục</div>
                    )}
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {/* Search Bar */}
            <div className="hidden md:flex w-full max-w-[220px] lg:max-w-[280px] items-center relative group">
              <Search className="absolute left-4 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors z-10" />
              <Input 
                type="text" 
                placeholder="Tìm kiếm khóa học..." 
                className="w-full h-[36px] pl-11 pr-4 bg-secondary/60 border-transparent rounded-full focus-visible:ring-1 focus-visible:ring-primary/30 transition-all text-sm"
              />
            </div>
          </div>

          {/* CENTER: Logo */}
          <div className="flex items-center justify-center shrink-0 pointer-events-none z-20 px-2 lg:px-4">
            <Link to="/" className="flex items-center pointer-events-auto">
              <img
                src={brandLogo}
                alt="SecureLearn logo"
                className="h-9 w-9 object-contain"
              />
              <span className="font-bold text-xl tracking-tight text-foreground transition-opacity hover:opacity-70">
                SecureLearn
              </span>
            </Link>
          </div>

          {/* RIGHT: Phần còn lại */}
          <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end z-10">
            
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Desktop Links */}
              <div className="hidden xl:flex items-center gap-1 shrink-0">
                <Link
                  to={teachBtnProps.to}
                  className={desktopNavLinkClass(isInstructorView)}
                >
                  {teachBtnProps.text}
                </Link>
                {isAuthenticated && user && (
                  <Link
                    to="/student/dashboard"
                    className={desktopNavLinkClass(isStudentView)}
                  >
                    Học tập
                  </Link>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 sm:gap-2 shrink-0">
                
                <Link to="/cart" className="relative p-2 hover:bg-secondary rounded-full transition-colors cursor-pointer group shrink-0">
                  <ShoppingCart className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" />
                  {cartItems.length > 0 && (
                    <span className="absolute top-0 right-0 h-[14px] w-[14px] rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center pointer-events-none">
                      {cartItems.length}
                    </span>
                  )}
                </Link>

                {/* Auth section */}
                {isAuthenticated && user ? (
                  /* ===== User đã đăng nhập: Avatar + Dropdown menu ===== */
                  <div className="hidden md:flex items-center gap-2 relative" ref={userMenuRef}>
                    <Button 
                      type="button"
                      variant="ghost"
                      className="flex h-auto w-auto items-center gap-2 cursor-pointer group rounded-full overflow-hidden p-0 hover:bg-transparent"
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    >
                      <UserAvatar 
                        user={user} 
                        className="h-8 w-8 text-sm border-2 border-transparent group-hover:border-primary/50 transition-colors" 
                      />
                    </Button>

                    {/* User Dropdown Menu */}
                    {isUserMenuOpen && (
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
                            to="/student/dashboard" 
                            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            Khóa học của tôi
                          </Link>
                          <Link 
                            to="/profile" 
                            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <User className="h-4 w-4 text-muted-foreground" />
                            Hồ sơ cá nhân
                          </Link>
                          <Link 
                            to="/settings" 
                            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <Settings className="h-4 w-4 text-muted-foreground" />
                            Cài đặt
                          </Link>
                        </div>

                        {/* Logout */}
                        <div className="border-t border-border py-2">
                          <Button 
                            type="button"
                            variant="ghost"
                            className="flex h-auto w-full items-center justify-start gap-3 rounded-none px-4 py-2.5 text-sm text-left text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={handleLogout}
                          >
                            <LogOut className="h-4 w-4" />
                            Đăng xuất
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                   <div className="hidden lg:flex items-center gap-2">
                      <Link to="/auth/login" state={{ from: location }} className="text-sm font-semibold px-4 py-2 hover:bg-secondary rounded-full transition-colors">
                        Đăng nhập
                      </Link>
                      <Link to="/auth/signup" state={{ from: location }} className="text-sm font-semibold px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-full transition-colors">
                        Đăng ký
                      </Link>
                   </div>
                )}

                <Button 
                  variant="ghost"
                  size="icon"
                  onClick={() => dispatch(toggleTheme(currentTheme === 'dark' ? 'light' : 'dark'))} 
                  className="hidden md:flex h-9 w-9 rounded-full"
                  title="Toggle theme"
                >
                  {currentTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>

                {/* Mobile Menu Icon */}
                <Button 
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="xl:hidden p-2 hover:text-primary transition-colors ml-1"
                  onClick={() => setIsMobileMenuOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile Search Bar Dropdown */}
        {isMobileSearchOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 px-4 pb-2 md:hidden animate-in fade-in slide-in-from-top-2">
            <div className="relative flex items-center bg-background rounded-full border border-border shadow-md">
              <Search className="absolute left-4 h-4 w-4 text-muted-foreground z-10" />
              <Input 
                type="text" 
                placeholder="Tìm kiếm nâng cao..." 
                className="w-full h-12 pl-12 pr-4 bg-transparent border-transparent rounded-full focus-visible:ring-0 text-sm"
              />
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[100] xl:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Mobile Drawer */}
      <div className={`fixed inset-y-0 left-0 w-72 z-[110] transform transition-transform duration-300 ease-in-out xl:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="absolute inset-0">
          <Sidebar
            entries={mobileSidebarEntries}
            collapsed={false}
            onToggleCollapsed={() => setIsMobileMenuOpen(false)}
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
            profileLink={isAuthenticated ? "/profile" : undefined}
            theme={currentTheme as 'light' | 'dark' | 'system'}
            onThemeChange={() => dispatch(toggleTheme(currentTheme === 'dark' ? 'light' : 'dark'))}
            onLogout={isAuthenticated ? handleLogout : undefined}
            logoSrc={brandLogo}
          />
        </div>
      </div>
    </>
  );
};
