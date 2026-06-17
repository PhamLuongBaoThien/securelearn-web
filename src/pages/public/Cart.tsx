import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { Button } from '@/components/ui/button';
import { Trash2, ShoppingCart, ArrowRight, ShieldCheck, BookOpen, CreditCard, CheckCircle2, ChevronRight, Star, Clock } from 'lucide-react';
import { useCartActions } from '@/hooks/useCart';
import { toast } from 'sonner';

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: 'Cơ bản',
  INTERMEDIATE: 'Trung cấp',
  ADVANCED: 'Nâng cao',
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h${m > 0 ? ` ${m}m` : ''}`;
  return `${m}m`;
}

const STEPS = [
  { label: 'Giỏ hàng', icon: ShoppingCart },
  { label: 'Thanh toán', icon: CreditCard },
  { label: 'Hoàn tất', icon: CheckCircle2 },
];

export const Cart = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const cartItems = useAppSelector((state) => state.cart.cartItems);
  const { removeItem, isRemoving } = useCartActions();
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

  const handleCheckoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.warning('Bạn cần đăng nhập để thực hiện thanh toán khóa học.', {
        description: 'Đang chuyển hướng bạn đến trang đăng nhập...',
        duration: 3000,
      });
      window.setTimeout(() => {
        navigate('/auth/login', { state: { from: '/checkout' } });
      }, 1500);
      return;
    }
    navigate('/checkout');
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-10 min-h-[60vh]">
      {/* ── Progress Stepper ── */}
      <nav className="flex items-center gap-2 mb-10 animate-fade-in">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = i === 0;
          const isCompleted = false;

          return (
            <div key={step.label} className="flex items-center gap-2">
              {i > 0 && <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />}
              <div className={`checkout-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                <div className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors
                  ${isActive
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500'
                  }
                `}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="hidden sm:inline">{step.label}</span>
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-3xl font-bold font-serif">Giỏ hàng</h1>
      </div>

      {cartItems.length === 0 ? (
        /* ── Empty State ── */
        <div className="border border-border py-16 px-6 text-center rounded-2xl bg-card animate-fade-in">
          <div className="inline-block mb-6">
            <svg width="180" height="150" viewBox="0 0 180 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
              {/* Decorative circles */}
              <circle cx="25" cy="35" r="5" className="fill-blue-400/50 dark:fill-blue-500/30" />
              <circle cx="155" cy="95" r="6" className="fill-rose-400/50 dark:fill-rose-500/30" />
              <circle cx="15" cy="110" r="4" className="fill-amber-400/50 dark:fill-amber-500/30" />
              <circle cx="90" cy="15" r="3" className="fill-emerald-400/50 dark:fill-emerald-500/30" />

              {/* Cart body */}
              <path d="M30 45 L45 45 L55 105 L125 105 L135 55 L50 55" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500 dark:text-indigo-400" />
              {/* Cart handle */}
              <path d="M20 45 L30 45" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" className="text-indigo-500 dark:text-indigo-400" />
              
              {/* Wheel left */}
              <circle cx="70" cy="118" r="8" stroke="currentColor" strokeWidth="3.5" className="text-zinc-700 dark:text-zinc-400" fill="currentColor" />
              {/* Wheel right */}
              <circle cx="112" cy="118" r="8" stroke="currentColor" strokeWidth="3.5" className="text-zinc-700 dark:text-zinc-400" fill="currentColor" />
              
              {/* Dashed lines inside cart */}
              <line x1="65" y1="70" x2="105" y2="70" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 4" className="text-indigo-200 dark:text-indigo-900/60" />
              <line x1="62" y1="82" x2="110" y2="82" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 4" className="text-indigo-200 dark:text-indigo-900/60" />
              <line x1="59" y1="94" x2="115" y2="94" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 4" className="text-indigo-200 dark:text-indigo-900/60" />
              
              {/* Magnifying glass */}
              <circle cx="125" cy="35" r="16" stroke="currentColor" strokeWidth="3" className="text-amber-500 dark:text-amber-400" fill="none" />
              <line x1="136" y1="46" x2="146" y2="56" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-amber-500 dark:text-amber-400" />
              
              {/* Question mark inside magnifier */}
              <text x="120" y="41" fontSize="16" fontWeight="extrabold" fill="currentColor" className="text-amber-600 dark:text-amber-500">?</text>
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-3">Giỏ hàng đang trống</h2>
          <p className="text-muted-foreground mb-8 text-base max-w-md mx-auto">
            Hãy khám phá những khóa học chất lượng và thêm vào giỏ hàng để bắt đầu hành trình học tập.
          </p>
          <Button
            variant="udemy_dark"
            onClick={() => navigate('/courses')}
            className="font-bold h-12 px-8 rounded-lg text-base gap-2"
          >
            Khám phá khóa học
          </Button>
        </div>
      ) : (
        /* ── Cart Content ── */
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Item List ── */}
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-4 font-medium">
              {cartItems.length} khóa học trong giỏ hàng
            </p>
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div
                  key={item._id}
                  className="cart-item flex gap-4 p-4 border border-border rounded-xl bg-card hover:shadow-md transition-all duration-200 group"
                >
                  {/* Thumbnail */}
                  <Link to={`/course/${item.slug}`} className="shrink-0">
                    <img
                      src={item.thumbnail || 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=150&q=80'}
                      alt={item.title}
                      className="w-28 h-[4.5rem] object-cover rounded-lg border border-border group-hover:scale-[1.02] transition-transform duration-200"
                    />
                  </Link>

                  {/* Info */}
                  <div className="flex-1 flex flex-col min-w-0 pt-0.5">
                    <Link
                      to={`/course/${item.slug}`}
                      className="font-bold text-base hover:text-primary transition-colors line-clamp-1 leading-snug"
                    >
                      {item.title}
                    </Link>
                    <span className="text-sm text-muted-foreground mt-0.5">
                      {item.instructorName || 'Hệ thống'}
                    </span>

                    {/* Course details */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-2 text-xs text-muted-foreground">
                      {item.rating != null && item.rating > 0 && (
                        <div className="flex items-center gap-0.5 text-amber-600 dark:text-amber-500 font-bold mr-0.5">
                          <span>{item.rating.toFixed(1)}</span>
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        </div>
                      )}
                      {item.rating != null && item.rating > 0 && <span className="text-border">•</span>}
                      {item.level && (
                        <span>{LEVEL_LABEL[item.level] ?? item.level}</span>
                      )}
                      {item.level && (item.totalLessons || item.totalDuration) && <span className="text-border">•</span>}
                      {item.totalLessons != null && item.totalLessons > 0 && (
                        <span className="flex items-center gap-0.5">
                          <BookOpen className="w-3 h-3" />
                          {item.totalLessons} bài giảng
                        </span>
                      )}
                      {item.totalLessons != null && item.totalLessons > 0 && item.totalDuration != null && item.totalDuration > 0 && <span className="text-border">•</span>}
                      {item.totalDuration != null && item.totalDuration > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {formatDuration(item.totalDuration)}
                        </span>
                      )}
                    </div>

                    <div className="mt-auto pt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isRemoving}
                        onClick={() => removeItem(item._id)}
                        className="text-xs font-semibold text-destructive hover:text-destructive/90 hover:bg-destructive/5 flex items-center gap-1 transition-colors disabled:opacity-50 h-8 px-2.5 rounded-lg -ml-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Xóa
                      </Button>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="shrink-0 flex items-start pt-0.5">
                    <span className="font-extrabold text-lg">{item.price.toLocaleString('vi-VN')} ₫</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Order Summary Sidebar ── */}
          <div className="w-full lg:w-[340px] shrink-0">
            <div className="bg-card border border-border rounded-2xl sticky top-24 overflow-hidden">
              <div className="p-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                  Tổng cộng
                </h3>
                <div className="text-4xl font-extrabold mb-6 tracking-tight">
                  {totalPrice.toLocaleString('vi-VN')}
                  <span className="text-2xl ml-1">₫</span>
                </div>

                <Button
                  variant="udemy_dark"
                  onClick={handleCheckoutClick}
                  className="w-full h-13 font-bold text-base rounded-xl cursor-pointer gap-2"
                >
                  Thanh toán
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Trust badge */}
              <div className="border-t border-border px-6 py-4 flex items-center gap-3 bg-muted/30">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Thông tin thanh toán của bạn được bảo mật tuyệt đối và xử lý an toàn.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
