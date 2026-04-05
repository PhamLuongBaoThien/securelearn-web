// ========================
// Navbar: Thanh điều hướng chính
// Hiển thị user menu + chức năng đăng xuất khi đã đăng nhập.
// ========================
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { toggleTheme } from '../../features/dashboard/uiSlice';
import { useLogout } from '@/hooks/useAuth';
import { ShoppingCart, Search, Menu, Sun, Moon, X, ChevronRight, LogOut, User, BookOpen, Settings } from 'lucide-react';
import { buttonVariants, Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { toast } from 'sonner';

export const Navbar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useAppSelector((state) => state.ui.theme);
  const cartItems = useAppSelector((state) => state.cart.cartItems);
  const { user, isAuthenticated, isInitializing } = useAppSelector((state) => state.auth);

  // Giải quyết trạng thái 'system' thành 'dark' hoặc 'light' dựa trên cài đặt của OS
  const currentTheme = theme === 'system' 
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') 
    : theme;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
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

  /** Lấy chữ cái đầu tên user để hiển thị avatar */
  const getInitial = () => {
    if (!user) return '?';
    return user.fullName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?';
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-background border-b border-border shadow-sm">
        <div className="px-4 sm:px-6 flex h-[72px] items-center gap-3">
          {/* Mobile Menu Icon */}
          <button 
            className="md:hidden p-2 hover:text-primary transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0">
            <span className="font-extrabold text-2xl tracking-tight text-foreground transition-opacity hover:opacity-80">
              SecureLearn
            </span>
          </Link>

          {/* Giao diện Danh mục trên Desktop */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent hover:bg-transparent focus:bg-transparent px-3 text-sm font-medium hover:text-primary transition-colors">
                  Khám phá
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="flex flex-col w-64 p-2 relative">
                    <li className="relative group/category">
                      <NavigationMenuLink asChild>
                        <Link to="/category/development" className="flex items-center justify-between px-4 py-3 text-sm hover:bg-secondary hover:text-primary transition-colors rounded-md">
                          Phát triển phần mềm
                          <ChevronRight className="h-4 w-4 opacity-70 transition-transform group-hover/category:translate-x-1" />
                        </Link>
                      </NavigationMenuLink>
                      <div className="absolute left-full top-0 hidden group-hover/category:block animate-in fade-in slide-in-from-left-2 z-50 pl-1">
                        <ul className="flex flex-col w-64 p-2 bg-popover text-popover-foreground border border-border shadow-md rounded-md">
                          <li>
                            <Link to="/category/development/web" className="block px-4 py-3 text-sm hover:bg-secondary hover:text-primary transition-colors rounded-md">Phát triển Web</Link>
                          </li>
                          <li>
                            <Link to="/category/development/mobile" className="block px-4 py-3 text-sm hover:bg-secondary hover:text-primary transition-colors rounded-md">Phát triển Mobile</Link>
                          </li>
                          <li>
                            <Link to="/category/development/data-science" className="block px-4 py-3 text-sm hover:bg-secondary hover:text-primary transition-colors rounded-md">Khoa học Dữ liệu</Link>
                          </li>
                        </ul>
                      </div>
                    </li>
                    <li className="relative group/category">
                      <NavigationMenuLink asChild>
                        <Link to="/category/business" className="flex items-center justify-between px-4 py-3 text-sm hover:bg-secondary hover:text-primary transition-colors rounded-md">
                          Kinh doanh
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li className="relative group/category">
                      <NavigationMenuLink asChild>
                        <Link to="/category/it-software" className="flex items-center justify-between px-4 py-3 text-sm hover:bg-secondary hover:text-primary transition-colors rounded-md">
                          CNTT & Phần mềm
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li className="relative group/category">
                      <NavigationMenuLink asChild>
                        <Link to="/category/design" className="flex items-center justify-between px-4 py-3 text-sm hover:bg-secondary hover:text-primary transition-colors rounded-md">
                          Thiết kế
                          <ChevronRight className="h-4 w-4 opacity-70 transition-transform group-hover/category:translate-x-1" />
                        </Link>
                      </NavigationMenuLink>
                      <div className="absolute left-full top-0 hidden group-hover/category:block animate-in fade-in slide-in-from-left-2 z-50 pl-1">
                        <ul className="flex flex-col w-64 p-2 bg-popover text-popover-foreground border border-border shadow-md rounded-md">
                          <li>
                            <Link to="/category/design/graphic" className="block px-4 py-3 text-sm hover:bg-secondary hover:text-primary transition-colors rounded-md">Thiết kế Đồ họa</Link>
                          </li>
                          <li>
                            <Link to="/category/design/ui-ux" className="block px-4 py-3 text-sm hover:bg-secondary hover:text-primary transition-colors rounded-md">UI/UX Design</Link>
                          </li>
                          <li>
                            <Link to="/category/design/3d" className="block px-4 py-3 text-sm hover:bg-secondary hover:text-primary transition-colors rounded-md">Thiết kế 3D</Link>
                          </li>
                        </ul>
                      </div>
                    </li>
                    <li className="relative group/category">
                      <NavigationMenuLink asChild>
                        <Link to="/category/marketing" className="flex items-center justify-between px-4 py-3 text-sm hover:bg-secondary hover:text-primary transition-colors rounded-md">
                          Marketing
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Search Bar - Flexible width */}
          <div className="hidden md:flex flex-1 max-w-4xl items-center relative group">
            <Search className="absolute left-4 h-5 w-5 text-muted-foreground group-focus-within:text-foreground transition-colors z-10" />
            <Input 
              type="text" 
              placeholder="Tìm kiếm khóa học..." 
              className="w-full h-[48px] pl-12 pr-4 bg-secondary/60 border-transparent rounded-full"
            />
          </div>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-1 shrink-0">
            <Link to="/teach" className="text-sm font-medium hover:text-primary px-3 py-2 transition-colors">
              Giảng dạy trên SecureLearn
            </Link>
            {!isInitializing && isAuthenticated && user && (
              <Link to="/student/dashboard" className="text-sm font-medium hover:text-primary px-3 py-2 transition-colors">
                Học tập
              </Link>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 shrink-0 ml-auto md:ml-0">
            {/* Mobile Search Icon */}
            <button 
              className="md:hidden p-2 hover:bg-secondary rounded-full transition-colors"
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            >
              <Search className="h-6 w-6" />
            </button>

            <Link to="/cart" className="relative p-2 hover:bg-secondary rounded-full transition-colors cursor-pointer group shrink-0">
              <ShoppingCart className="h-6 w-6 text-foreground group-hover:text-primary transition-colors" />
              {cartItems.length > 0 && (
                <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center pointer-events-none">
                  {cartItems.length}
                </span>
              )}
            </Link>

            {!isInitializing && (
              isAuthenticated && user ? (
              /* ===== User đã đăng nhập: Avatar + Dropdown menu ===== */
              <div className="hidden md:flex items-center gap-3 ml-2 relative" ref={userMenuRef}>
                <button 
                  className="flex items-center gap-2 cursor-pointer group"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                  {user.profile?.avatarUrl ? (
                    <img 
                      src={user.profile.avatarUrl} 
                      alt={user.fullName}
                      className="h-9 w-9 rounded-full object-cover border-2 border-transparent group-hover:border-primary transition-colors"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm border-2 border-transparent group-hover:border-primary/50 transition-colors">
                      {getInitial()}
                    </div>
                  )}
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-72 bg-popover text-popover-foreground border border-border shadow-lg rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                    {/* Header */}
                    <div className="p-4 border-b border-border bg-secondary/30">
                      <div className="flex items-center gap-3">
                        {user.profile?.avatarUrl ? (
                          <img 
                            src={user.profile.avatarUrl} 
                            alt={user.fullName}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                            {getInitial()}
                          </div>
                        )}
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
                      <button 
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-destructive/10 text-destructive transition-colors w-full text-left"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4" />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
               <div className="hidden md:flex items-center gap-2 ml-1">
                  <Link to="/auth/login" state={{ from: location }} className={buttonVariants({ variant: 'udemy_outline', className: "px-5 py-2.5 rounded-none font-bold" })}>
                    Đăng nhập
                  </Link>
                  <Link to="/auth/signup" state={{ from: location }} className={buttonVariants({ variant: 'udemy_dark', className: "px-5 py-2.5 rounded-none font-bold" })}>
                    Đăng ký
                  </Link>
               </div>
              )
            )}

            <Button 
              variant="udemy_outline"
              onClick={() => dispatch(toggleTheme(currentTheme === 'dark' ? 'light' : 'dark'))} 
              className="hidden md:flex ml-1 w-10 h-10 p-0 rounded-none"
              title="Toggle theme"
            >
              {currentTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>


          </div>
        </div>
        
        {/* Mobile Search Bar Dropdown */}
        {isMobileSearchOpen && (
          <div className="md:hidden px-4 pb-4 pt-2 bg-background border-b border-border">
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-5 w-5 text-muted-foreground z-10" />
              <Input 
                type="text" 
                placeholder="Tìm kiếm khóa học..." 
                className="w-full h-12 pl-10 pr-4 bg-secondary/60 border-transparent rounded-full"
              />
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[100] md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Mobile Drawer */}
      <div className={`fixed inset-y-0 left-0 w-[280px] bg-background z-[110] transform transition-transform duration-300 ease-in-out flex flex-col md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 flex items-center justify-between border-b border-border/50">
          <span className="font-extrabold text-xl tracking-tight text-foreground">SecureLearn</span>
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-secondary rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1">
          {!isInitializing && (
            isAuthenticated && user ? (
            <div className="px-4 pb-4 mb-2 border-b border-border/50 flex items-center gap-3">
              {user.profile?.avatarUrl ? (
                <img 
                  src={user.profile.avatarUrl} 
                  alt={user.fullName}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-base">
                  {getInitial()}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-foreground truncate">{user.fullName}</span>
                <span className="text-xs text-muted-foreground truncate">{user.email}</span>
              </div>
            </div>
          ) : (
            <div className="px-4 pb-4 mb-2 flex flex-col gap-2 border-b border-border/50">
              <Link to="/auth/login" state={{ from: location }} onClick={() => setIsMobileMenuOpen(false)} className="text-primary hover:underline font-bold py-2">
                Đăng nhập
              </Link>
              <Link to="/auth/signup" state={{ from: location }} onClick={() => setIsMobileMenuOpen(false)} className="text-primary hover:underline font-bold py-2">
                Đăng ký
              </Link>
            </div>
            )
          )}

          {isAuthenticated && (
            <>
              <div className="px-4 py-2 text-sm font-bold text-muted-foreground">Tài khoản</div>
              <Link to="/student/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 hover:bg-secondary transition-colors flex items-center gap-3">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                Khóa học của tôi
              </Link>
              <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 hover:bg-secondary transition-colors flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                Hồ sơ cá nhân
              </Link>
            </>
          )}

          <div className="px-4 py-2 mt-2 text-sm font-bold text-muted-foreground">Học tập</div>
          <Link to="/courses" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 hover:bg-secondary transition-colors">Khám phá</Link>
          <Link to="/teach" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 hover:bg-secondary transition-colors">Giảng dạy trên SecureLearn</Link>
          
          <div className="px-4 mt-4 py-2 text-sm font-bold text-muted-foreground border-t border-border/50 pt-6">Cài đặt</div>
          <button 
            onClick={() => dispatch(toggleTheme(currentTheme === 'dark' ? 'light' : 'dark'))} 
            className="px-4 py-3 hover:bg-secondary flex items-center gap-3 text-left transition-colors w-full"
          >
            {currentTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            {currentTheme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
          </button>

          {/* Nút đăng xuất ở mobile drawer */}
          {isAuthenticated && (
            <div className="px-4 mt-2 border-t border-border/50 pt-4">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors w-full px-2 rounded-md"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
