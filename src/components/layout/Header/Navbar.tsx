// ========================
// Navbar: Thanh điều hướng chính
// Hiển thị user menu + chức năng đăng xuất khi đã đăng nhập.
// ========================
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../../app/hooks';
import { toggleTheme } from '../../../features/dashboard/uiSlice';
import { useLogout } from '@/hooks/useAuth';
import {
  ShoppingCart, Search, Menu, Sun, Moon,
  Layers, Minus, BookOpen, User, Settings, Monitor,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { usePublicCourseCategories } from '@/hooks/usePublicCourseCategories';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';
import brandLogo from '@/assets/logoweb.png';

import { MegaMenuColumn } from './MegaMenuColumn';
import { NavUserDropdown } from './NavUserDropdown';
import { NavMobileDrawer } from './NavMobileDrawer';
import {
  desktopNavLinkClass,
  getTeachButtonProps,
  resolveTheme,
  buildMobileSidebarEntries,
} from './navbar.utils';

export const Navbar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useAppSelector((state) => state.ui.theme);
  const cartItems = useAppSelector((state) => state.cart.cartItems);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { data: categories = [], isLoading: isCategoriesLoading } = usePublicCourseCategories();

  const isInstructor = user?.role === 'INSTRUCTOR';
  const isInstructorView = location.pathname.startsWith('/instructor');
  const isStudentView = location.pathname.startsWith('/student');
  const currentTheme = resolveTheme(theme);
  const teachBtnProps = getTeachButtonProps(user, isInstructorView, isInstructor);
  const navCategories = categories;

  // ─── State ───────────────────────────────────────────────────
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeRootId, setActiveRootId] = useState<string | null>(null);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [activeGrandchildId, setActiveGrandchildId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    // Chỉ gọi API tìm kiếm sau khi user ngừng gõ 500ms
    if (debouncedSearchQuery.trim()) {
      console.log('Tiến hành gọi API tìm kiếm với từ khóa:', debouncedSearchQuery);
      // Bạn có thể xử lý logic filter hoặc gọi API tìm kiếm ở đây...
    }
  }, [debouncedSearchQuery]);

  // ─── Mega menu derived state ──────────────────────────────────
  const activeRoot = activeRootId ? navCategories.find((c) => c._id === activeRootId) : null;
  const activeChildren = activeRoot?.children || [];
  const activeChild = activeChildId ? activeChildren.find((c) => c._id === activeChildId) : null;
  const activeGrandchildren = activeChild?.children || [];
  const activeGrandchild = activeGrandchildId
    ? activeGrandchildren.find((c) => c._id === activeGrandchildId)
    : null;
  const activeFourthLevel = activeGrandchild?.children || [];

  // ─── Handlers ────────────────────────────────────────────────
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

  const handleThemeToggle = () =>
    dispatch(toggleTheme(currentTheme === 'dark' ? 'light' : 'dark'));

  // ─── Mobile Sidebar Entries ───────────────────────────────────
  const mobileSidebarEntries = buildMobileSidebarEntries(
    categories,
    isAuthenticated,
    user,
    teachBtnProps,
    {
      bookOpen: <BookOpen className="w-4 h-4" />,
      user: <User className="w-4 h-4" />,
      settings: <Settings className="w-4 h-4" />,
      search: <Search className="w-4 h-4 text-primary shrink-0" />,
      layers: <Layers className="w-4 h-4 text-muted-foreground shrink-0" />,
      minus: <Minus className="w-4 h-4 text-muted-foreground/40 shrink-0" />,
      monitor: <Monitor className="w-4 h-4" />,
    }
  );

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

            {/* Mega Menu Desktop */}
            <NavigationMenu className="hidden xl:flex">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    onMouseEnter={() => {
                      setActiveRootId(null);
                      setActiveChildId(null);
                      setActiveGrandchildId(null);
                    }}
                    className="bg-transparent hover:bg-transparent focus:bg-transparent px-3 text-sm font-medium hover:text-primary transition-colors"
                  >
                    Khám phá
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    {isCategoriesLoading ? (
                      <div className="flex min-h-[420px] w-[260px] flex-col overflow-hidden rounded-md border border-border bg-popover shadow-xl p-5">
                        <div className="h-5 w-3/4 animate-pulse rounded bg-secondary mt-1" />
                        <div className="space-y-4 mt-6">
                          {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="flex items-center justify-between">
                              <div className="h-4 w-2/3 animate-pulse rounded bg-secondary" />
                              <div className="h-4 w-4 animate-pulse rounded bg-secondary" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : navCategories.length > 0 ? (
                      <div className="flex max-h-[80vh] w-max overflow-y-auto rounded-md border border-border bg-popover text-popover-foreground shadow-xl">
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

            {/* Search Bar Desktop */}
            <div className="hidden md:flex w-full max-w-[220px] lg:max-w-[280px] items-center relative group">
              <Search className="absolute left-4 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors z-10" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm khóa học..."
                className="w-full h-[36px] pl-11 pr-4 bg-secondary/60 border-transparent rounded-full focus-visible:ring-1 focus-visible:ring-primary/30 transition-all text-sm"
              />
            </div>
          </div>

          {/* CENTER: Logo */}
          <div className="flex items-center justify-center shrink-0 pointer-events-none z-20 px-2 lg:px-4">
            <Link to="/" className="flex items-center pointer-events-auto">
              <img src={brandLogo} alt="SecureLearn logo" className="h-9 w-9 object-contain" />
              <span className="font-bold text-xl tracking-tight text-foreground transition-opacity hover:opacity-70">
                SecureLearn
              </span>
            </Link>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end z-10">
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">

              {/* Desktop Links */}
              <div className="hidden xl:flex items-center gap-1 shrink-0">
                <Link to={teachBtnProps.to} className={desktopNavLinkClass(isInstructorView)}>
                  {teachBtnProps.text}
                </Link>
                {isAuthenticated && user && (
                  <Link to="/student/dashboard" className={desktopNavLinkClass(isStudentView)}>
                    Học tập
                  </Link>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Cart */}
                <Link
                  to="/cart"
                  className="relative p-2 hover:bg-secondary rounded-full transition-colors cursor-pointer group shrink-0"
                >
                  <ShoppingCart className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" />
                  {cartItems.length > 0 && (
                    <span className="absolute top-0 right-0 h-[14px] w-[14px] rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center pointer-events-none">
                      {cartItems.length}
                    </span>
                  )}
                </Link>

                {/* Auth Section */}
                {isAuthenticated && user ? (
                  <NavUserDropdown
                    user={user}
                    isOpen={isUserMenuOpen}
                    onToggle={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    onClose={() => setIsUserMenuOpen(false)}
                    onLogout={handleLogout}
                  />
                ) : (
                  <div className="hidden lg:flex items-center gap-2">
                    <Link
                      to="/auth/login"
                      state={{ from: location }}
                      className="text-sm font-semibold px-4 py-2 hover:bg-secondary rounded-full transition-colors"
                    >
                      Đăng nhập
                    </Link>
                    <Link
                      to="/auth/signup"
                      state={{ from: location }}
                      className="text-sm font-semibold px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-full transition-colors"
                    >
                      Đăng ký
                    </Link>
                  </div>
                )}

                {/* Theme Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleThemeToggle}
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm nâng cao..."
                className="w-full h-12 pl-12 pr-4 bg-transparent border-transparent rounded-full focus-visible:ring-0 text-sm"
              />
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Drawer */}
      <NavMobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        entries={mobileSidebarEntries}
        user={user}
        isAuthenticated={isAuthenticated}
        currentTheme={currentTheme}
        onThemeChange={handleThemeToggle}
        onLogout={handleLogout}
        logoSrc={brandLogo}
      />
    </>
  );
};
