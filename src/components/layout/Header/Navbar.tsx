// ========================
// Navbar: Thanh điều hướng chính
// Hiển thị user menu + chức năng đăng xuất khi đã đăng nhập.
// ========================
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../../app/hooks';
import { toggleTheme } from '../../../features/dashboard/uiSlice';
import { useLogout } from '@/hooks/useAuth';
import {
  ShoppingCart, Search, Menu, Sun, Moon, Heart,
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
import { useCourseSearchSuggestions } from '@/hooks/useCourseSearchSuggestions';
import { toast } from 'sonner';
import brandLogo from '@/assets/logoweb.png';

import { MegaMenuColumn } from './MegaMenuColumn';
import { NavUserDropdown } from './NavUserDropdown';
import { NavMobileDrawer } from './NavMobileDrawer';
import { NotificationBell } from '@/components/notifications/NotificationBell';
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
  const wishlist = useAppSelector((state) => state.cart.wishlist);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { data: categories = [], isLoading: isCategoriesLoading } = usePublicCourseCategories();
  const showAuthenticatedUI = isAuthenticated && !!user;
  const resolvedUser = user;

  const isInstructor = resolvedUser?.role === 'INSTRUCTOR';
  const isInstructorView = location.pathname.startsWith('/instructor');
  const isStudentView = location.pathname.startsWith('/student');
  const currentTheme = resolveTheme(theme);
  const teachBtnProps = getTeachButtonProps(resolvedUser, isInstructorView, isInstructor);
  const navCategories = categories;

  // ─── State ───────────────────────────────────────────────────
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeRootId, setActiveRootId] = useState<string | null>(null);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [activeGrandchildId, setActiveGrandchildId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const trimmedSearchQuery = searchQuery.trim();
  const suggestionsQuery = useCourseSearchSuggestions(searchQuery, 5);
  const suggestions = suggestionsQuery.data?.courses ?? [];
  const instructorSuggestions = suggestionsQuery.data?.instructors ?? [];
  const totalSuggestions = suggestionsQuery.data?.total ?? 0;
  const hasMoreSuggestions = totalSuggestions > suggestions.length;
  const shouldShowSuggestions = isSearchActive && trimmedSearchQuery.length > 0;

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!searchContainerRef.current?.contains(event.target as Node)) {
        setIsSearchActive(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsSearchActive(false);
      setIsMobileSearchOpen(false);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [location.pathname, location.search]);

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

  const handleSearchSubmit = () => {
    if (!trimmedSearchQuery) return;

    const params = new URLSearchParams();
    params.set('search', trimmedSearchQuery);
    navigate(`/courses?${params.toString()}`);
    setIsSearchActive(false);
    setIsMobileSearchOpen(false);
  };

  const handleSuggestionSelect = (slug: string) => {
    navigate(`/course/${slug}`);
    setIsSearchActive(false);
    setIsMobileSearchOpen(false);
  };

  // ─── Mobile Sidebar Entries ───────────────────────────────────
  const mobileSidebarEntries = buildMobileSidebarEntries(
    categories,
    showAuthenticatedUI,
    resolvedUser,
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
      <nav
        ref={searchContainerRef}
        className="sticky top-4 mx-auto z-50 mb-6 w-[96%] max-w-[1440px] rounded-full border border-border/50 bg-background/80 shadow-lg backdrop-blur-md transition-all duration-300 dark:border-zinc-700/70 dark:bg-zinc-900/85 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_10px_30px_rgba(255,255,255,0.08)]"
      >
        <div className="relative flex h-[64px] items-center justify-between px-4 sm:px-6">

          {/* LEFT: Khám phá và Tìm kiếm */}
          <div className="z-10 flex min-w-0 flex-1 items-center justify-start gap-3 pr-3">
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
            <div className="group relative hidden w-full max-w-[260px] items-center md:flex lg:max-w-[360px] xl:max-w-[420px]">
              <Search className="pointer-events-none absolute left-4 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors z-10" />
              <Input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchActive(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchActive(true);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleSearchSubmit();
                  }
                }}
                placeholder="Tìm kiếm khóa học..."
                className="w-full h-[36px] pl-11 pr-4 bg-secondary/60 border-transparent rounded-full focus-visible:ring-1 focus-visible:ring-primary/30 transition-all text-sm"
              />

              {shouldShowSuggestions && (
                <div className="absolute left-0 right-0 top-[calc(100%+10px)] overflow-hidden rounded-2xl border border-border/70 bg-background/95 shadow-xl backdrop-blur-md xl:min-w-[420px]">
                  {suggestionsQuery.isLoading ? (
                    <div className="space-y-2 p-3">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="flex items-center gap-3 rounded-xl px-2 py-2">
                          <div className="h-11 w-16 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="h-4 w-4/5 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                            <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : suggestions.length > 0 || instructorSuggestions.length > 0 ? (
                    <div className="p-2">
                      {suggestions.length > 0 && <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Khóa học</p>}
                      {suggestions.map((course) => (
                        <button key={course._id} type="button" onClick={() => handleSuggestionSelect(course.slug)} className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-secondary">
                          <div className="h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary">{course.thumbnail ? <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center"><BookOpen className="h-4 w-4 text-zinc-400" /></div>}</div>
                          <div className="min-w-0 flex-1"><p className="line-clamp-1 text-sm font-semibold text-foreground">{course.title}</p><p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{course.instructorName}</p></div>
                        </button>
                      ))}
                      {instructorSuggestions.length > 0 && <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Giảng viên</p>}
                      {instructorSuggestions.map((instructor) => (
                        <button key={instructor._id} type="button" onClick={() => { navigate(`/users/${instructor.publicSlug}`); setIsSearchActive(false); setIsMobileSearchOpen(false); }} className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-secondary">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 font-semibold text-primary">{instructor.avatarUrl ? <img src={instructor.avatarUrl} alt={instructor.fullName} className="h-full w-full object-cover"/> : instructor.fullName.charAt(0).toUpperCase()}</div>
                          <div className="min-w-0 flex-1"><p className="line-clamp-1 text-sm font-semibold">{instructor.fullName}</p><p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{instructor.headline || 'Giảng viên SecureLearn'}</p></div>
                        </button>
                      ))}
                      {hasMoreSuggestions && (
                        <button
                          type="button"
                          onClick={handleSearchSubmit}
                          className="mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-secondary"
                        >
                          <span>Xem tất cả kết quả</span>
                          <Search className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 text-sm text-muted-foreground">Không tìm thấy khóa học phù hợp.</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* CENTER: Logo */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 px-2 lg:px-4">
            <Link to="/" className="flex items-center pointer-events-auto whitespace-nowrap">
              <img src={brandLogo} alt="SecureLearn logo" className="h-9 w-9 object-contain" />
              <span className="hidden text-xl font-bold tracking-tight text-foreground transition-opacity hover:opacity-70 sm:inline">
                SecureLearn
              </span>
            </Link>
          </div>

          {/* RIGHT */}
          <div className="z-10 flex flex-1 items-center justify-end gap-2 pl-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">

              {/* Desktop Links */}
              <div className="hidden xl:flex items-center gap-1 shrink-0">
                <Link to={teachBtnProps.to} className={desktopNavLinkClass(isInstructorView)}>
                  {teachBtnProps.text}
                </Link>
                {showAuthenticatedUI && (
                  <Link to="/student/dashboard" className={desktopNavLinkClass(isStudentView)}>
                    Học tập
                  </Link>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <NotificationBell enabled={showAuthenticatedUI} />
                {/* Wishlist */}
                <Link
                  to="/student/dashboard?tab=wishlist"
                  className="relative p-2 hover:bg-secondary rounded-full transition-colors cursor-pointer group shrink-0"
                  title="Danh sách mong muốn"
                >
                  <Heart className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" />
                  {wishlist.length > 0 && (
                    <span
                      key={wishlist.length}
                      className="absolute top-0 right-0 h-[14px] w-[14px] rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center pointer-events-none animate-badge-pop"
                    >
                      {wishlist.length}
                    </span>
                  )}
                </Link>

                {/* Cart */}
                <Link
                  to="/cart"
                  className="relative p-2 hover:bg-secondary rounded-full transition-colors cursor-pointer group shrink-0"
                >
                  <ShoppingCart className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" />
                  {cartItems.length > 0 && (
                    <span
                      key={cartItems.length}
                      className="absolute top-0 right-0 h-[14px] w-[14px] rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center pointer-events-none animate-badge-pop"
                    >
                      {cartItems.length}
                    </span>
                  )}
                </Link>

                {/* Auth Section */}
                {showAuthenticatedUI ? (
                  <NavUserDropdown
                    user={resolvedUser!}
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
            <div className="overflow-hidden rounded-3xl border border-border bg-background shadow-md">
              <div className="relative flex items-center">
                <Search className="absolute left-4 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setIsSearchActive(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchActive(true);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleSearchSubmit();
                    }
                  }}
                  placeholder="Tìm kiếm nâng cao..."
                  className="w-full h-12 pl-12 pr-4 bg-transparent border-transparent rounded-full focus-visible:ring-0 text-sm"
                />
              </div>

              {shouldShowSuggestions && (
                <>
                  <div className="border-t border-border/70" />
                  {suggestionsQuery.isLoading ? (
                    <div className="space-y-2 p-3">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="flex items-center gap-3 rounded-xl px-2 py-2">
                          <div className="h-11 w-16 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="h-4 w-4/5 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                            <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : suggestions.length > 0 || instructorSuggestions.length > 0 ? (
                    <div className="p-2">
                      {suggestions.length > 0 && <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Khóa học</p>}
                      {suggestions.map((course) => (
                        <button key={course._id} type="button" onClick={() => handleSuggestionSelect(course.slug)} className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-secondary">
                          <div className="h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary">{course.thumbnail ? <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center"><BookOpen className="h-4 w-4 text-zinc-400" /></div>}</div>
                          <div className="min-w-0 flex-1"><p className="line-clamp-1 text-sm font-semibold text-foreground">{course.title}</p><p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{course.instructorName}</p></div>
                        </button>
                      ))}
                      {instructorSuggestions.length > 0 && <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Giảng viên</p>}
                      {instructorSuggestions.map((instructor) => (
                        <button key={instructor._id} type="button" onClick={() => { navigate(`/users/${instructor.publicSlug}`); setIsSearchActive(false); setIsMobileSearchOpen(false); }} className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-secondary">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 font-semibold text-primary">{instructor.avatarUrl ? <img src={instructor.avatarUrl} alt={instructor.fullName} className="h-full w-full object-cover"/> : instructor.fullName.charAt(0).toUpperCase()}</div>
                          <div className="min-w-0 flex-1"><p className="line-clamp-1 text-sm font-semibold">{instructor.fullName}</p><p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{instructor.headline || 'Giảng viên SecureLearn'}</p></div>
                        </button>
                      ))}
                      {hasMoreSuggestions && (
                        <button
                          type="button"
                          onClick={handleSearchSubmit}
                          className="mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-secondary"
                        >
                          <span>Xem tất cả kết quả</span>
                          <Search className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 text-sm text-muted-foreground">Không tìm thấy khóa học phù hợp.</div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Drawer */}
      <NavMobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        entries={mobileSidebarEntries}
        user={resolvedUser}
        isAuthenticated={showAuthenticatedUI}
        currentTheme={currentTheme}
        onThemeChange={handleThemeToggle}
        onLogout={handleLogout}
        logoSrc={brandLogo}
      />
    </>
  );
};
