// ========================
// Hook: useMyPaymentTransactions
// Mục đích:
// - đọc lịch sử thanh toán của user hiện tại, gồm mua khóa học và mua gói thuê bao
// ========================
import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/app/hooks';
import {
  getMyPaymentTransactions,
  type MyPaymentTransactionsResponse,
  type PaymentTransaction,
} from '@/services/paymentApi';

export const myPaymentTransactionKeys = {
  all: ['payments', 'me'] as const,
  list: (params: MyPaymentTransactionsParams) => ['payments', 'me', params] as const,
};

export interface MyPaymentTransactionsParams {
  search?: string;
  productType?: PaymentTransaction['productType'];
  status?: PaymentTransaction['status'];
  page?: number;
  limit?: number;
}

const emptyHistory: MyPaymentTransactionsResponse = {
  transactions: [],
  total: 0,
  page: 1,
  limit: 10,
};

export function useMyPaymentTransactions(params: MyPaymentTransactionsParams = {}) {
  const userId = useAppSelector((state) => state.auth.user?._id ?? '');

  return useQuery({
    queryKey: myPaymentTransactionKeys.list(params),
    queryFn: async () => {
      const response = await getMyPaymentTransactions(params);
      if (response.status === 'ERR') {
        throw new Error(response.message || 'Không thể tải lịch sử thanh toán.');
      }
      return response.data || { ...emptyHistory, page: params.page || 1, limit: params.limit || 10 };
    },
    enabled: Boolean(userId),
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000,
  });
}
