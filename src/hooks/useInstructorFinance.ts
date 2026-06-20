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

export type InstructorRevenueParams = {
  startDate?: string;
  endDate?: string;
};

export const instructorFinanceKeys = {
  revenue: (params?: InstructorRevenueParams) => ['instructor', 'finance', 'revenue', params?.startDate || '', params?.endDate || ''] as const,
  subscriptions: ['instructor', 'finance', 'subscriptions'] as const,
};

export function useInstructorRevenueStats(params?: InstructorRevenueParams) {
  return useQuery({
    queryKey: instructorFinanceKeys.revenue(params),
    queryFn: async () => {
      const response = await getInstructorRevenueStats(params);
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


