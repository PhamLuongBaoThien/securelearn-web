import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { CreditCard, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppSelector } from '@/app/hooks';
import { buttonVariants } from '@/components/ui/button';

export const Checkout = () => {
  const [paymentMethod, setPaymentMethod] = useState<'vnpay' | 'momo' | 'credit_card'>('momo');
  const location = useLocation();
  const { isAuthenticated, authResolved } = useAppSelector((state) => state.auth);
  const cartItems = useAppSelector((state) => state.cart.cartItems);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);
  const originalPrice = totalPrice > 0 ? totalPrice * 2.5 : 0;

  if (!authResolved) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-12">
      <h1 className="text-3xl font-bold font-serif mb-8">Thanh toán an toàn</h1>

      {cartItems.length === 0 ? (
        <div className="border border-border py-16 px-6 text-center rounded-lg bg-card shadow-sm">
          <h2 className="text-2xl font-bold mb-4">Giỏ hàng của bạn đang trống</h2>
          <p className="text-muted-foreground mb-8 text-lg">Hãy chọn khóa học trước khi thanh toán.</p>
          <Link to="/courses" className={buttonVariants({ variant: 'udemy_dark', className: 'font-bold h-12 px-8 rounded-none text-base' })}>
            Khám phá khóa học
          </Link>
        </div>
      ) : (
      
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Cột trái: Thông tin thanh toán */}
        <div className="flex-1 space-y-8">
          <section>
            <h2 className="text-xl font-bold mb-4">Phương thức thanh toán</h2>
            <p className="text-sm text-muted-foreground mb-4">Vui lòng chọn phương thức thanh toán phù hợp nhất với bạn.</p>
            
            <div className="space-y-4">
              {/* VNPay */}
              <label className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'vnpay' ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/50'}`}>
                <input type="radio" name="payment" value="vnpay" checked={paymentMethod === 'vnpay'} onChange={() => setPaymentMethod('vnpay')} className="w-5 h-5 accent-primary" />
                <div className="flex-1">
                  <span className="font-bold block">Thẻ ATM nội địa / VNPay</span>
                  <span className="text-sm text-muted-foreground">Thanh toán bằng thẻ ngân hàng nội địa hoặc quét mã QR VNPay</span>
                </div>
                <div className="font-bold text-blue-700 italic border px-2 py-1 bg-white text-xs rounded">VNPAY</div>
              </label>

              {/* MoMo */}
              <label className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'momo' ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/50'}`}>
                <input type="radio" name="payment" value="momo" checked={paymentMethod === 'momo'} onChange={() => setPaymentMethod('momo')} className="w-5 h-5 accent-primary" />
                <div className="flex-1">
                  <span className="font-bold block">Ví điện tử MoMo</span>
                  <span className="text-sm text-muted-foreground">Thanh toán tiện lợi qua ứng dụng thông minh MoMo</span>
                </div>
                <div className="h-8 w-8 bg-pink-600 rounded-md flex items-center justify-center font-bold text-white text-[10px]">MoMo</div>
              </label>
              
              {/* Credit Card */}
              <label className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'credit_card' ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/50'}`}>
                <input type="radio" name="payment" value="credit_card" checked={paymentMethod === 'credit_card'} onChange={() => setPaymentMethod('credit_card')} className="w-5 h-5 accent-primary" />
                <div className="flex-1">
                  <span className="font-bold block">Thẻ tín dụng / Ghi nợ quốc tế</span>
                  <span className="text-sm text-muted-foreground">Thẻ ghi nợ hoặc Thẻ tín dụng Visa, MasterCard, JCB</span>
                </div>
                <CreditCard className="h-6 w-6 text-muted-foreground" />
              </label>
            </div>
          </section>

          {/* Form nhập Credit Card hiển thị điều kiện */}
          {paymentMethod === 'credit_card' && (
            <section className="bg-secondary/30 p-6 rounded-lg border border-border">
               <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold mb-1.5">Tên in trên thẻ</label>
                    <Input type="text" placeholder="NGUYEN VAN A" className="bg-background" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1.5">Số thẻ tin dụng</label>
                    <Input type="text" placeholder="0000 0000 0000 0000" className="bg-background" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-1.5">Ngày hết hạn</label>
                      <Input type="text" placeholder="MM/YY" className="bg-background" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1.5">Mã bảo mật CVC/CVV</label>
                      <Input type="text" placeholder="123" className="bg-background" />
                    </div>
                  </div>
               </div>
            </section>
          )}

          <Button variant="udemy_dark" className="w-full text-lg h-14 rounded-none font-bold flex items-center justify-center gap-2">
            Thanh toán an toàn <ShieldCheck className="h-5 w-5" />
          </Button>
          
          <p className="text-xs text-muted-foreground text-center mt-4 border-t pt-4">Bằng việc hoàn tất việc mua hàng này, bạn tự động đồng ý cho phép SecureLearn lưu trữ dữ liệu thanh toán với mục đích quản lý đơn hàng. Các Điều khoản dịch vụ và Chính sách bảo mật sẽ được áp dụng.</p>
        </div>

        {/* Cột phải: Tóm tắt đơn hàng */}
        <div className="w-full lg:w-[400px] shrink-0">
          <div className="bg-card border border-border rounded-lg shadow-sm sticky top-24">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-6 border-b pb-4">Tóm tắt đơn hàng</h2>
              
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item._id} className="flex gap-4">
                    <div className="w-16 h-16 bg-muted shrink-0 flex items-center justify-center">
                      <img
                        src={item.thumbnail || 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=150&q=80'}
                        alt={item.title}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-sm line-clamp-2 leading-tight">{item.title}</h3>
                      <div className="flex flex-wrap items-baseline gap-2 mt-1">
                        <span className="font-extrabold text-foreground">{item.price.toLocaleString('vi-VN')} ₫</span>
                        <span className="text-xs text-muted-foreground line-through">{(item.price * 2.5).toLocaleString('vi-VN')} ₫</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t border-border/50 pt-4 mb-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Giá gốc:</span>
                  <span>{originalPrice.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex justify-between items-center text-sm text-green-600 font-medium">
                  <span>Giảm giá nền tảng:</span>
                  <span>-{(originalPrice - totalPrice).toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>

              <div className="border-t border-border pt-4 mb-6 flex justify-between items-end">
                <span className="font-bold text-base">Tổng số tiền:</span>
                <span className="font-extrabold text-3xl">{totalPrice.toLocaleString('vi-VN')} ₫</span>
              </div>
            </div>
            
            <div className="bg-muted/30 p-4 border-t border-border text-xs text-muted-foreground text-center flex flex-col items-center gap-2">
               <ShieldCheck className="w-6 h-6 text-foreground opacity-50 block" />
               Mọi giao dịch mua bán đều được mã hóa bằng chuẩn RSA và AES-256 bit đảm bảo bảo mật tuyệt đối dữ liệu thẻ của khách hàng.
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
