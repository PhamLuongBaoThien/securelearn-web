import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { toggleTheme } from '../../features/dashboard/uiSlice';
import { ShoppingCart, Search, Menu, Sun, Moon, X, ChevronRight } from 'lucide-react';
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

export const Navbar = () => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);
  const cartItems = useAppSelector((state) => state.cart.cartItems);
  const user = useAppSelector((state) => state.auth.user);

  // Giải quyết trạng thái 'system' thành 'dark' hoặc 'light' dựa trên cài đặt của OS
  const currentTheme = theme === 'system' 
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') 
    : theme;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

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
          {/* 1. NavigationMenu là component ngoài cùng, khởi tạo "context" giúp các mục bên trong biết khi nào nên đóng/mở */}
          <NavigationMenu className="hidden md:flex">
            {/* 2. NavigationMenuList đóng vai trò như thẻ <ul> chứa các danh mục */}
            <NavigationMenuList>
              {/* 3. NavigationMenuItem đóng vai trò là thẻ <li> định nghĩa một khối của Navigation */}
              <NavigationMenuItem>
                {/* 4. Trigger là vùng mà thư viện sẽ theo dõi. Khi bạn rê chuột vào đây, nó lập tức kích hoạt logic tự mở menu thả xuống và xoay mũi tên */}
                <NavigationMenuTrigger className="bg-transparent hover:bg-transparent focus:bg-transparent px-3 text-sm font-medium hover:text-primary transition-colors">
                  Khám phá
                </NavigationMenuTrigger>
                {/* 5. Content là nội dung phần thả xuống. Thư viện sẽ tính toán độ trễ (delay) hợp lý, để khi trượt chuột qua lại nó không bị ẩn ngay gây chớp */}
                <NavigationMenuContent>
                  <ul className="flex flex-col w-64 p-2 relative">
                    <li className="relative group/category">
                      {/* 6. asChild là tính năng cốt lõi của Radix. Vì react-router dùng thẻ <Link>, asChild giúp gộp chung sự kiện của NavigationMenuLink thẳng vào thẻ <Link> bên dưới để không tạo sinh ra thẻ <a> dư thừa gây rối CSS */}
                      <NavigationMenuLink asChild>
                        <Link to="/category/development" className="flex items-center justify-between px-4 py-3 text-sm hover:bg-secondary hover:text-primary transition-colors rounded-md">
                          Phát triển phần mềm
                          <ChevronRight className="h-4 w-4 opacity-70 transition-transform group-hover/category:translate-x-1" />
                        </Link>
                      </NavigationMenuLink>
                      {/* Dropdown con cấp 2 xuất hiện khi bên trên được hover */}
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
                      {/* Dropdown con cấp 2 cho khối Thiết kế */}
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

            {user ? (
              <div className="hidden md:flex items-center gap-3 ml-2 cursor-pointer group">
                <div className="h-9 w-9 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-sm">
                  {user.name.charAt(0)}
                </div>
              </div>
            ) : (
               <div className="hidden md:flex items-center gap-2 ml-1">
                  <Link to="/auth/login" className={buttonVariants({ variant: 'udemy_outline', className: "px-5 py-2.5 rounded-none font-bold" })}>
                    Đăng nhập
                  </Link>
                  <Link to="/auth/signup" className={buttonVariants({ variant: 'udemy_dark', className: "px-5 py-2.5 rounded-none font-bold" })}>
                    Đăng ký
                  </Link>
               </div>
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
          {user ? (
            <div className="px-4 pb-4 mb-2 border-b border-border/50 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-base">
                {user.name.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-foreground">Chào, {user.name}</span>
                <span className="text-xs text-muted-foreground">Chào mừng trở lại</span>
              </div>
            </div>
          ) : (
            <div className="px-4 pb-4 mb-2 flex flex-col gap-2 border-b border-border/50">
              <Link to="/auth/login" onClick={() => setIsMobileMenuOpen(false)} className="text-primary hover:underline font-bold py-2">
                Đăng nhập
              </Link>
              <Link to="/auth/signup" onClick={() => setIsMobileMenuOpen(false)} className="text-primary hover:underline font-bold py-2">
                Đăng ký
              </Link>
            </div>
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

        </div>
      </div>
    </>
  );
};
