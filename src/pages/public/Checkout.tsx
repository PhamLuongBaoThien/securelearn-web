// ========================
// Checkout Page
// Mục đích:
// - hiển thị tóm tắt giỏ hàng
// - chọn phương thức thanh toán
// - tạo phiên thanh toán thật qua payment-service
// Hàm/chức năng chính:
// - providerForMethod(): map method UI sang provider
// - checkoutMutation: gọi createCourseCheckout()
// ========================
import { useMemo, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { useAppSelector } from '@/app/hooks';
import { useMutation } from '@tanstack/react-query';
import { createCourseCheckout, type PaymentMethod, type PaymentProvider } from '@/services/paymentApi';
import { toast } from 'sonner';

const providerForMethod = (method: PaymentMethod): PaymentProvider =>
  method === 'MOMO' ? 'MOMO' : 'VNPAY';

export const Checkout = () => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('VNPAY');
  const location = useLocation();
  const { isAuthenticated, authResolved } = useAppSelector((state) => state.auth);
  const cartItems = useAppSelector((state) => state.cart.cartItems);

  const totalPrice = useMemo(() => cartItems.reduce((sum, item) => sum + item.price, 0), [cartItems]);

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const response = await createCourseCheckout({
        paymentMethod,
        provider: providerForMethod(paymentMethod),
      });

      if (response.status === 'ERR') {
        throw new Error(response.message || 'Không thể tạo phiên thanh toán.');
      }

      return response.data;
    },
    onSuccess: (data) => {
      if (!data?.paymentUrl) {
        toast.error('Không tìm thấy đường dẫn thanh toán.');
        return;
      }

      window.location.href = data.paymentUrl;
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Không thể thanh toán lúc này.');
    },
  });

  const handleCheckout = () => {
    checkoutMutation.mutate();
  };

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
          <div className="flex-1 space-y-8">
            <section>
              <h2 className="text-xl font-bold mb-4">Phương thức thanh toán</h2>
              <p className="text-sm text-muted-foreground mb-4">Vui lòng chọn phương thức thanh toán phù hợp nhất với bạn.</p>

              <div className="space-y-4">
                <label className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'VNPAY' ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/50'}`}>
                  <input type="radio" name="payment" value="VNPAY" checked={paymentMethod === 'VNPAY'} onChange={() => setPaymentMethod('VNPAY')} className="w-5 h-5 accent-primary" />
                  <div className="flex-1">
                    <span className="font-bold block">Thẻ ATM nội địa / VNPay</span>
                    <span className="text-sm text-muted-foreground">Thanh toán bằng thẻ ngân hàng nội địa hoặc quét mã QR VNPay</span>
                  </div>
                  <div className="font-bold text-blue-700 italic border px-2 py-1 bg-white text-xs rounded">VNPAY</div>
                </label>

                <label className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'MOMO' ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/50'}`}>
                  <input type="radio" name="payment" value="MOMO" checked={paymentMethod === 'MOMO'} onChange={() => setPaymentMethod('MOMO')} className="w-5 h-5 accent-primary" />
                  <div className="flex-1">
                    <span className="font-bold block">MoMo</span>
                    <span className="text-sm text-muted-foreground">MoMo sẽ mở trang chọn phương thức thanh toán phù hợp</span>
                  </div>
                  <div className="h-8 w-8 bg-pink-600 rounded-md flex items-center justify-center font-bold text-white text-[10px]">MoMo</div>
                </label>

              </div>
            </section>

            <Button
              variant="udemy_dark"
              className="w-full text-lg h-14 rounded-none font-bold flex items-center justify-center gap-2"
              onClick={handleCheckout}
              disabled={checkoutMutation.isPending}
            >
              {checkoutMutation.isPending ? 'Đang tạo giao dịch...' : 'Thanh toán an toàn'}
              {checkoutMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-4 border-t pt-4">
              Bằng việc hoàn tất việc mua hàng này, bạn tự động đồng ý cho phép SecureLearn lưu trữ dữ liệu thanh toán với mục đích quản lý đơn hàng.
            </p>
          </div>

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
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 mb-6 flex justify-between items-end">
                  <span className="font-bold text-base">Tổng số tiền:</span>
                  <span className="font-extrabold text-3xl">{totalPrice.toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>

              <div className="bg-muted/30 p-4 border-t border-border text-xs text-muted-foreground text-center flex flex-col items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-foreground opacity-50 block" />
                Giao dịch sẽ được xác nhận qua payment-service trước khi course-service ghi danh tự động.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
