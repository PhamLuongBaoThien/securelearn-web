// ========================
// Payment Process Page
// Mục đích:
// - nhận user sau khi tạo giao dịch
// - poll/confirm giao dịch
// - clear cart và chuyển người học sang dashboard khi thanh toán xong
// Hàm/chức năng chính:
// - finishSuccess(): dọn state sau thanh toán thành công
// ========================
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useAppDispatch } from '@/app/hooks';
import { clearCart, setCartItems } from '@/features/courses/cartSlice';
import { clearGuestCart } from '@/features/courses/cartStorage';
import { confirmCoursePayment, getTransaction, type PaymentTransaction } from '@/services/paymentApi';
import { cartKeys } from '@/hooks/useCart';
import { enrolledKeys } from '@/hooks/useEnrolledCourses';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function PaymentProcess() {
  const { transactionId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const [transaction, setTransaction] = useState<PaymentTransaction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const run = async () => {
      const finishSuccess = async (payment: PaymentTransaction) => {
        setTransaction(payment);
        setIsDone(true);
        clearGuestCart();
        dispatch(clearCart());
        dispatch(setCartItems([]));
        queryClient.setQueryData(cartKeys.items, { items: [], totalPrice: 0 });
        queryClient.invalidateQueries({ queryKey: enrolledKeys.all });
        toast.success('Thanh toán thành công. Khóa học đã được mở quyền.');

        const returnTo = searchParams.get('returnTo') || '/student/dashboard';
        window.setTimeout(() => {
          navigate(returnTo, { replace: true });
        }, 1200);
      };

      if (!transactionId) {
        setError('Thiếu mã giao dịch.');
        return;
      }

      try {
        const preview = await getTransaction(transactionId);
        if (preview.status === 'ERR') {
          throw new Error(preview.message || 'Không thể tải giao dịch.');
        }

        if (preview.data) {
          setTransaction(preview.data);
          if (preview.data.status === 'SUCCEEDED') {
            await finishSuccess(preview.data);
            return;
          }
        }

        const providerRef = searchParams.get('providerRef') || `web-${Date.now()}`;
        const confirmRes = await confirmCoursePayment(transactionId, providerRef);
        if (confirmRes.status === 'ERR') {
          throw new Error(confirmRes.message || 'Thanh toán thất bại.');
        }

        if (confirmRes.data) {
          await finishSuccess(confirmRes.data);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Không thể hoàn tất thanh toán.';
        setError(message);
        toast.error(message);
      }
    };

    run();
  }, [dispatch, navigate, queryClient, searchParams, transactionId]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-xl w-full border border-border bg-card p-8 rounded-lg shadow-sm text-center space-y-4">
        {!error && !isDone ? (
          <>
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <h1 className="text-2xl font-bold">Đang xử lý thanh toán</h1>
            <p className="text-muted-foreground">
              Hệ thống đang xác nhận giao dịch và cấp quyền học cho tài khoản của bạn.
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
