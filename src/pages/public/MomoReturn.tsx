// ========================
// MoMo Return Page
// Mục đích:
// - xác nhận giao dịch MoMo sau khi user quay về frontend
// - điều hướng khác nhau cho mua khóa học và mua thuê bao theo productType
// ========================
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { clearCart, setCartItems } from '@/features/courses/cartSlice';
import { clearGuestCart, clearUserCart } from '@/features/courses/cartStorage';
import { cartKeys } from '@/hooks/useCart';
import { enrolledKeys } from '@/hooks/useEnrolledCourses';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { confirmMomoPayment, getTransactionByCode, type PaymentTransaction } from '@/services/paymentApi';

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export function MomoReturn() {
  const [searchParams] = useSearchParams();
  const [transaction, setTransaction] = useState<PaymentTransaction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const hasRun = useRef(false);
  const { authResolved, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!authResolved) return;
    if (!isAuthenticated) {
      navigate('/auth/login', { state: { from: location }, replace: true });
      return;
    }

    if (hasRun.current) return;
    hasRun.current = true;

    const finishSuccess = async (payment: PaymentTransaction) => {
      setTransaction(payment);
      setIsDone(true);
      if (payment.productType === 'COURSE') {
        // Chỉ checkout khóa học mới dọn cart; subscription checkout không dùng cart.
        clearGuestCart();
        clearUserCart();
        dispatch(clearCart());
        dispatch(setCartItems([]));
        queryClient.setQueryData(cartKeys.items, { items: [], totalPrice: 0 });
        queryClient.invalidateQueries({ queryKey: enrolledKeys.all });
        toast.success('Thanh toán thành công. Khóa học đã được mở quyền.');
      } else {
        queryClient.invalidateQueries({ queryKey: ['subscription', 'me'] });
        toast.success('Thanh toán thành công. Kỳ thuê bao đã được ghi nhận.');
      }

      const returnTo = payment.productType === 'SUBSCRIPTION' ? '/pricing' : '/student/dashboard';
      window.setTimeout(() => {
        navigate(returnTo, { replace: true });
      }, 1200);
    };

    const run = async () => {
      const orderId = searchParams.get('orderId');
      const resultCode = searchParams.get('resultCode');

      if (!orderId) {
        setError('Thiếu mã đơn hàng MoMo.');
        return;
      }

      if (resultCode && !['0', '9000'].includes(resultCode)) {
        setError('Giao dịch MoMo không thành công.');
        return;
      }

      const payload: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        payload[key] = value;
      });

      try {
        const confirmRes = await confirmMomoPayment(payload);
        if (confirmRes.status === 'OK' && confirmRes.data) {
          setTransaction(confirmRes.data);
          if (confirmRes.data.status === 'SUCCEEDED') {
            await finishSuccess(confirmRes.data);
            return;
          }
          if (confirmRes.data.status === 'FAILED') {
            setError(confirmRes.data.failureReason || 'Giao dịch MoMo đã thất bại.');
            return;
          }
        }
      } catch (confirmErr: unknown) {
        console.error('Lỗi khi confirm MoMo với backend:', confirmErr);
      }

      try {
        for (let attempt = 0; attempt < 15; attempt++) {
          const res = await getTransactionByCode(orderId);
          if (res.status === 'ERR') {
            throw new Error(res.message || 'Không thể tải trạng thái giao dịch.');
          }

          if (res.data) {
            setTransaction(res.data);

            if (res.data.status === 'SUCCEEDED') {
              await finishSuccess(res.data);
              return;
            }

            if (res.data.status === 'FAILED') {
              setError(res.data.failureReason || 'Giao dịch MoMo đã thất bại.');
              return;
            }
          }

          await sleep(1200);
        }

        setError('Đang chờ MoMo xác nhận giao dịch. Vui lòng tải lại sau ít phút.');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Không thể hoàn tất thanh toán.';
        setError(message);
        toast.error(message);
      }
    };

    run();
  }, [authResolved, dispatch, isAuthenticated, location, navigate, queryClient, searchParams]);

  if (authResolved && !isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-xl w-full border border-border bg-card p-8 rounded-lg shadow-sm text-center space-y-4">
        {!error && !isDone ? (
          <>
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <h1 className="text-2xl font-bold">Đang xác nhận thanh toán MoMo</h1>
            <p className="text-muted-foreground">
              Hệ thống đang chờ IPN từ MoMo để ghi nhận giao dịch và cấp quyền học.
            </p>
            {transaction?.transactionCode && (
              <p className="text-sm text-muted-foreground">Mã giao dịch: {transaction.transactionCode}</p>
            )}
          </>
        ) : error ? (
          <>
            <XCircle className="mx-auto h-12 w-12 text-red-500" />
            <h1 className="text-2xl font-bold">Thanh toán chưa hoàn tất</h1>
            <p className="text-muted-foreground">{error}</p>
            <button
              type="button"
              onClick={() => navigate('/cart', { replace: true })}
              className="mt-2 inline-flex items-center justify-center h-12 px-6 bg-primary text-primary-foreground font-semibold"
            >
              Quay lại giỏ hàng
            </button>
          </>
        ) : (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            <h1 className="text-2xl font-bold">Thanh toán thành công</h1>
            <p className="text-muted-foreground">
              Ghi danh đã được cập nhật. Bạn sẽ được chuyển hướng sau vài giây.
            </p>
            {transaction?.transactionCode && (
              <p className="text-sm text-muted-foreground">Mã giao dịch: {transaction.transactionCode}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
