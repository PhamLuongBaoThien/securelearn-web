import { Link } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { buttonVariants } from '../../components/ui/button';
import { Trash2 } from 'lucide-react';
import { useCartActions } from '@/hooks/useCart';

export const Cart = () => {
  const cartItems = useAppSelector((state) => state.cart.cartItems);
  const { removeItem, isRemoving } = useCartActions();
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-12 min-h-[60vh]">
      <h1 className="text-3xl font-bold font-serif mb-8">Giỏ hàng thanh toán</h1>
      
      {cartItems.length === 0 ? (
        <div className="border border-border py-16 px-6 text-center rounded-lg bg-card shadow-sm">
          <img src="https://cdni.iconscout.com/illustration/premium/thumb/empty-cart-7359557-6024626.png" alt="Empty Cart" className="w-48 mx-auto mb-6 opacity-80 dark:opacity-60 dark:invert" />
          <h2 className="text-2xl font-bold mb-4">Nhỏ ơi, giỏ hàng của bạn đang trống!</h2>
          <p className="text-muted-foreground mb-8 text-lg">Giữ cho mình một chỗ ngồi bên những kiến thức mới mẻ. Khám phá các khóa học ngay.</p>
          <Link to="/courses" className={buttonVariants({ variant: 'udemy_dark', className: 'font-bold h-12 px-8 rounded-none text-base' })}>Khám phá khóa học</Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-4">
            <h2 className="text-lg font-bold mb-2">{cartItems.length} khóa học trong giỏ hàng</h2>
            {cartItems.map((item) => (
                <div key={item._id} className="flex gap-4 p-4 border border-border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
                <img src={item.thumbnail || "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=150&q=80"} alt={item.title} className="w-24 h-24 object-cover rounded-md border border-border" />
                <div className="flex-1 flex flex-col pt-1">
                  <Link to={`/course/${item.slug}`} className="font-bold text-base hover:text-primary transition-colors line-clamp-2 leading-tight mb-1">{item.title}</Link>
                  <span className="text-sm text-muted-foreground mb-2">Giảng viên: {item.instructorName || 'Hệ thống'}</span>
                  
                  <div className="mt-auto flex items-center gap-4">
                    <button disabled={isRemoving} onClick={() => removeItem(item._id)} className="text-sm font-medium text-destructive hover:underline flex items-center gap-1.5 transition-colors disabled:opacity-60">
                      <Trash2 className="w-4 h-4" /> Bỏ khỏi giỏ
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0 pt-1">
                  <span className="font-extrabold text-xl text-primary">{item.price.toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="w-full lg:w-[350px] shrink-0">
            <div className="bg-card border border-border p-6 rounded-lg sticky top-24 shadow-sm">
              <h3 className="text-lg font-bold text-muted-foreground mb-2">Tổng cộng:</h3>
              <div className="text-4xl font-extrabold mb-1">{totalPrice.toLocaleString('vi-VN')} ₫</div>
              
              <Link to="/checkout" className={buttonVariants({ variant: 'udemy_dark', className: 'w-full h-14 font-bold text-lg rounded-none' })}>
                Thanh toán
              </Link>
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
