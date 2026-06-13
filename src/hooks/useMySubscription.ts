// ========================
// Hook: useMySubscription
// Mục đích:
// - đọc kỳ thuê bao hiện tại của user đã đăng nhập
// - dùng lại ở pricing, subscription catalog và CTA học bằng thuê bao
// ========================
import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/app/hooks';
import { getMySubscription } from '@/services/paymentApi';

export const mySubscriptionKeys = {
  all: ['subscription', 'me'] as const,
};

export function useMySubscription() {
  const userId = useAppSelector((state) => state.auth.user?._id ?? '');

  return useQuery({
    queryKey: mySubscriptionKeys.all,
    queryFn: async () => {
      const response = await getMySubscription();
      if (response.status === 'ERR') {
        throw new Error(response.message || 'Không thể tải trạng thái thuê bao.');
      }
      return response.data || { current: null, scheduled: [], history: [] };
    },
    enabled: Boolean(userId),
    staleTime: 30 * 1000,
  });
}
