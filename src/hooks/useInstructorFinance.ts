// ========================
// Hook: useInstructorFinance
// Mục đích:
// - gom React Query hooks cho doanh thu mua đứt và thuê bao của giảng viên
// - giúp page performance chỉ render UI, không giữ query key và queryFn trực tiếp
// ========================
import { useQuery } from '@tanstack/react-query';
import {
  getInstructorRevenueStats,
  getInstructorSubscriptionFinance,
} from '@/services/paymentApi';

export const instructorFinanceKeys = {
  revenue: ['instructor', 'finance', 'revenue'] as const,
  subscriptions: ['instructor', 'finance', 'subscriptions'] as const,
};

export function useInstructorRevenueStats() {
  return useQuery({
    queryKey: instructorFinanceKeys.revenue,
    queryFn: async () => {
      const response = await getInstructorRevenueStats();
      if (response.status === 'ERR' || !response.data) {
        throw new Error(response.message || 'Không thể tải dữ liệu doanh thu.');
      }
      return response.data;
    },
  });
}

export function useInstructorSubscriptionFinance() {
  return useQuery({
    queryKey: instructorFinanceKeys.subscriptions,
    queryFn: async () => {
      const response = await getInstructorSubscriptionFinance();
      if (!response.data) throw new Error(response.message || 'Không thể tải doanh thu thuê bao.');
      return response.data;
    },
  });
}
