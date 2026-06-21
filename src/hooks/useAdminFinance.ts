// ========================
// Hook: useAdminFinance
// Mục đích:
// - gom React Query hooks cho báo cáo tài chính và vận hành thuê bao của Admin
// - giữ query key, invalidation và toast ở cùng một nơi để các page finance chỉ lo UI
// ========================
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getRevenueSplitConfig,
  getRevenueStats,
  getTransactions,
  updateRevenueSplitConfig,
} from '@/services/adminApi';
import type { IRevenueSplitConfig, IRevenueStats } from '@/types/admin.types';
import {
  calculateSubscriptionSettlement,
  createAdminCoupon,
  deleteAdminCoupon,
  getAdminCoupons,
  getAdminSubscriptionPlans,
  getAdminSubscriptionTerms,
  getSubscriptionSettlements,
  refundAdminSubscriptionTerm,
  updateAdminCoupon,
  updateAdminCouponStatus,
  saveAdminSubscriptionPlan,
  updateSubscriptionSettlementStatus,
  type CouponPayload,
  type SubscriptionPlan,
  type SubscriptionSettlement,
} from '@/services/paymentApi';

export const adminFinanceKeys = {
  splitConfig: ['admin', 'finance', 'split-config'] as const,
  revenue: ['admin', 'finance', 'revenue'] as const,
  transactions: (params: {
    search?: string;
    providerFilter?: string;
    statusFilter?: string;
    page: number;
    limit: number;
  }) => ['admin', 'finance', 'transactions', params] as const,
  subscriptionPlans: ['admin', 'subscription-plans'] as const,
  subscriptionTerms: ['admin', 'subscription-terms'] as const,
  subscriptionSettlements: ['admin', 'subscription-settlements'] as const,
  coupons: (params: { search?: string; status?: string; page: number; limit: number }) => ['admin', 'coupons', params] as const,
};

export function useAdminRevenueSplitConfig() {
  return useQuery({
    queryKey: adminFinanceKeys.splitConfig,
    queryFn: async () => {
      const response = await getRevenueSplitConfig();
      if (response.status === 'ERR' || !response.data) {
        throw new Error(response.message || 'Không thể tải cấu hình chia doanh thu.');
      }
      return response.data;
    },
  });
}

export function useAdminRevenueStats() {
  return useQuery({
    queryKey: adminFinanceKeys.revenue,
    queryFn: async () => {
      const response = await getRevenueStats();
      if (response.status === 'ERR' || !response.data) {
        throw new Error(response.message || 'Không thể tải báo cáo doanh thu.');
      }
      return response.data as IRevenueStats;
    },
  });
}

export function useAdminTransactions(params: {
  search?: string;
  providerFilter?: string;
  statusFilter?: string;
  page: number;
  limit: number;
}) {
  return useQuery({
    queryKey: adminFinanceKeys.transactions(params),
    queryFn: async () => {
      const response = await getTransactions({
        search: params.search || undefined,
        provider: params.providerFilter || undefined,
        status: params.statusFilter || undefined,
        page: params.page,
        limit: params.limit,
      });
      if (response.status === 'ERR' || !response.data) {
        throw new Error(response.message || 'Không thể tải danh sách giao dịch.');
      }
      return response.data;
    },
    placeholderData: (previousData) => previousData,
  });
}

export function useUpdateRevenueSplitConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: IRevenueSplitConfig) => {
      const response = await updateRevenueSplitConfig(config);
      if (response.status === 'ERR' || !response.data) {
        throw new Error(response.message || 'Không thể cập nhật cấu hình chia doanh thu.');
      }
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminFinanceKeys.splitConfig });
      await queryClient.invalidateQueries({ queryKey: adminFinanceKeys.revenue });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'finance', 'transactions'] });
      toast.success('Đã cập nhật tỷ lệ chia doanh thu.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Không thể cập nhật tỷ lệ chia doanh thu.');
    },
  });
}

export function useAdminSubscriptionPlans() {
  return useQuery({
    queryKey: adminFinanceKeys.subscriptionPlans,
    queryFn: async () => {
      const response = await getAdminSubscriptionPlans();
      if (!response.data) throw new Error(response.message || 'Không thể tải gói thuê bao.');
      return response.data;
    },
  });
}

export function useAdminSubscriptionTerms() {
  return useQuery({
    queryKey: adminFinanceKeys.subscriptionTerms,
    queryFn: async () => {
      const response = await getAdminSubscriptionTerms();
      return response.data || [];
    },
  });
}

export function useAdminSubscriptionSettlements() {
  return useQuery({
    queryKey: adminFinanceKeys.subscriptionSettlements,
    queryFn: async () => {
      const response = await getSubscriptionSettlements();
      return response.data || [];
    },
  });
}

export function useSaveAdminSubscriptionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plan: SubscriptionPlan) => {
      const { _id: _ignored, ...payload } = plan;
      const response = await saveAdminSubscriptionPlan(payload);
      if (!response.data) throw new Error(response.message || 'Không thể lưu gói.');
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminFinanceKeys.subscriptionPlans });
      toast.success('Đã cập nhật gói thuê bao.');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Không thể lưu gói.'),
  });
}

export function useCalculateSubscriptionSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (period: string) => {
      const response = await calculateSubscriptionSettlement(period);
      if (!response.data) throw new Error(response.message || 'Không thể cập nhật settlement.');
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminFinanceKeys.subscriptionSettlements });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Không thể cập nhật settlement.'),
  });
}

export function useUpdateSubscriptionSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ period, status }: { period: string; status: SubscriptionSettlement['status'] }) => {
      const response = await updateSubscriptionSettlementStatus(period, status);
      if (!response.data) throw new Error(response.message || 'Không thể cập nhật settlement.');
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminFinanceKeys.subscriptionSettlements });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Không thể cập nhật settlement.'),
  });
}

export function useRefundAdminSubscriptionTerm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (termId: string) => {
      const reason = window.prompt('Lý do hoàn tiền đã thực hiện tại VNPay/MoMo:');
      if (!reason) throw new Error('Đã hủy thao tác hoàn tiền.');
      const response = await refundAdminSubscriptionTerm(termId, reason);
      if (!response.data) throw new Error(response.message || 'Không thể ghi nhận hoàn tiền.');
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminFinanceKeys.subscriptionTerms });
      toast.success('Đã thu hồi kỳ thuê bao.');
    },
    onError: (error) => {
      if (error instanceof Error && error.message === 'Đã hủy thao tác hoàn tiền.') return;
      toast.error(error instanceof Error ? error.message : 'Không thể hoàn tiền.');
    },
  });
}

export function useAdminCoupons(params: { search?: string; status?: string; page: number; limit: number }) {
  return useQuery({
    queryKey: adminFinanceKeys.coupons(params),
    queryFn: async () => {
      const response = await getAdminCoupons(params);
      if (!response.data) throw new Error(response.message || 'Không thể tải danh sách coupon.');
      return response.data;
    },
    placeholderData: (previousData) => previousData,
  });
}

export function useSaveAdminCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id?: string; payload: CouponPayload }) => {
      const response = id ? await updateAdminCoupon(id, payload) : await createAdminCoupon(payload);
      if (!response.data) throw new Error(response.message || 'Không thể lưu coupon.');
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      toast.success('Đã lưu coupon.');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Không thể lưu coupon.'),
  });
}

export function useUpdateAdminCouponStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await updateAdminCouponStatus(id, isActive);
      if (!response.data) throw new Error(response.message || 'Không thể cập nhật trạng thái coupon.');
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      toast.success('Đã cập nhật trạng thái coupon.');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Không thể cập nhật coupon.'),
  });
}

export function useDeleteAdminCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await deleteAdminCoupon(id);
      if (response.status === 'ERR') throw new Error(response.message || 'Không thể xóa coupon.');
      return response;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      toast.success('Đã xóa coupon.');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Không thể xóa coupon.'),
  });
}