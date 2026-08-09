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
  createAdminCoupon,
  deleteAdminCoupon,
  multiDeleteAdminCoupons,
  multiUpdateAdminCouponStatus,
  getAdminCoupons,
  getAdminCouponStats,
  getAdminCouponRedemptions,
  getAdminCouponDetailRedemptions,
  getAdminSubscriptionPlans,
  getAdminSubscriptionTerms,
  getSubscriptionSettlements,
  updateAdminCoupon,
  updateAdminCouponStatus,
  saveAdminSubscriptionPlan,
  updateSubscriptionSettlementStatus,
  type CouponPayload,
  type SubscriptionPlan,
  type SubscriptionSettlement,
} from '@/services/paymentApi';

export const adminFinanceKeys = {
  splitConfig: (productType: 'COURSE' | 'SUBSCRIPTION') => ['admin', 'finance', 'split-config', productType] as const,
  revenue: ['admin', 'finance', 'revenue'] as const,
  revenueByRange: (params: { startDate?: string; endDate?: string; productType?: 'COURSE' | 'SUBSCRIPTION' }) =>
    [...adminFinanceKeys.revenue, params] as const,
  transactions: (params: {
    search?: string;
    providerFilter?: string;
    statusFilter?: string;
    sort?: string;
    startDate?: string;
    endDate?: string;
    page: number;
    limit: number;
    productType: 'COURSE' | 'SUBSCRIPTION';
  }) => ['admin', 'finance', 'transactions', params] as const,
  subscriptionPlans: ['admin', 'subscription-plans'] as const,
  subscriptionTerms: ['admin', 'subscription-terms'] as const,
  subscriptionSettlements: ['admin', 'subscription-settlements'] as const,
  coupons: (params: { search?: string; status?: string; sort?: string; page: number; limit: number }) => ['admin', 'coupons', params] as const,
  couponStats: ['admin', 'coupons', 'stats'] as const,
  couponRedemptions: (params: { code?: string; user?: string; page: number; limit: number }) => ['admin', 'coupon-redemptions', params] as const,
  couponDetailRedemptions: (id: string, page: number, limit: number) => ['admin', 'coupons', id, 'redemptions', page, limit] as const,
};

export function useAdminRevenueSplitConfig(productType: 'COURSE' | 'SUBSCRIPTION' = 'COURSE') {
  return useQuery({
    queryKey: adminFinanceKeys.splitConfig(productType),
    queryFn: async () => {
      const response = await getRevenueSplitConfig(productType);
      if (response.status === 'ERR' || !response.data) {
        throw new Error(response.message || 'Không thể tải cấu hình chia doanh thu.');
      }
      return response.data;
    },
  });
}

export function useAdminRevenueStats(params: {
  startDate?: string;
  endDate?: string;
  productType?: 'COURSE' | 'SUBSCRIPTION';
} = {}) {
  return useQuery({
    queryKey: adminFinanceKeys.revenueByRange(params),
    queryFn: async () => {
      const response = await getRevenueStats(params);
      if (response.status === 'ERR' || !response.data) {
        throw new Error(response.message || 'Không thể tải báo cáo doanh thu.');
      }
      return response.data as IRevenueStats;
    },
    placeholderData: (previousData) => previousData,
  });
}

export function useAdminTransactions(params: {
  search?: string;
  providerFilter?: string;
  statusFilter?: string;
  sort?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
  productType: 'COURSE' | 'SUBSCRIPTION';
}) {
  return useQuery({
    queryKey: adminFinanceKeys.transactions(params),
    queryFn: async () => {
      const response = await getTransactions({
        search: params.search || undefined,
        provider: params.providerFilter || undefined,
        status: params.statusFilter || undefined,
        sort: params.sort || undefined,
        startDate: params.startDate || undefined,
        endDate: params.endDate || undefined,
        page: params.page,
        limit: params.limit,
        productType: params.productType,
      });
      if (response.status === 'ERR' || !response.data) {
        throw new Error(response.message || 'Không thể tải danh sách giao dịch.');
      }
      return response.data;
    },
    placeholderData: (previousData) => previousData,
  });
}

export function useUpdateRevenueSplitConfig(productType: 'COURSE' | 'SUBSCRIPTION' = 'COURSE') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: IRevenueSplitConfig) => {
      const response = await updateRevenueSplitConfig(config, productType);
      if (response.status === 'ERR' || !response.data) {
        throw new Error(response.message || 'Không thể cập nhật cấu hình chia doanh thu.');
      }
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminFinanceKeys.splitConfig(productType) });
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
      const payload: Omit<SubscriptionPlan, '_id'> = {
        type: plan.type,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        durationDays: plan.durationDays,
        features: plan.features,
        sortOrder: plan.sortOrder,
        isActive: plan.isActive,
      };
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

export function useAdminCoupons(params: { search?: string; status?: string; sort?: string; page: number; limit: number }) {
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


export function useAdminCouponStats() {
  return useQuery({
    queryKey: adminFinanceKeys.couponStats,
    queryFn: async () => {
      const response = await getAdminCouponStats();
      if (!response.data) throw new Error(response.message || 'Không thể tải thống kê coupon.');
      return response.data;
    },
  });
}

export function useAdminCouponRedemptions(params: { code?: string; user?: string; page: number; limit: number }) {
  return useQuery({
    queryKey: adminFinanceKeys.couponRedemptions(params),
    queryFn: async () => {
      const response = await getAdminCouponRedemptions(params);
      if (!response.data) throw new Error(response.message || 'Không thể tải lịch sử coupon.');
      return response.data;
    },
    placeholderData: (previousData) => previousData,
  });
}

export function useAdminCouponDetailRedemptions(id: string | null, page = 1, limit = 10) {
  return useQuery({
    queryKey: adminFinanceKeys.couponDetailRedemptions(id || 'none', page, limit),
    enabled: Boolean(id),
    queryFn: async () => {
      if (!id) throw new Error('Coupon không hợp lệ.');
      const response = await getAdminCouponDetailRedemptions(id, { page, limit });
      if (!response.data) throw new Error(response.message || 'Không thể tải lịch sử coupon.');
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
      await queryClient.invalidateQueries({ queryKey: adminFinanceKeys.couponStats });
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
      await queryClient.invalidateQueries({ queryKey: adminFinanceKeys.couponStats });
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
      await queryClient.invalidateQueries({ queryKey: adminFinanceKeys.couponStats });
      toast.success('Đã xóa coupon.');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Không thể xóa coupon.'),
  });
}

export function useMultiDeleteAdminCoupons() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await multiDeleteAdminCoupons(ids);
      if (response.status === 'ERR') throw new Error(response.message || 'Không thể xóa các coupon.');
      return response;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      await queryClient.invalidateQueries({ queryKey: adminFinanceKeys.couponStats });
      toast.success('Đã xóa các coupon được chọn.');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Không thể xóa các coupon.'),
  });
}

export function useMultiUpdateAdminCouponStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, isActive }: { ids: string[]; isActive: boolean }) => {
      const response = await multiUpdateAdminCouponStatus(ids, isActive);
      if (response.status === 'ERR') throw new Error(response.message || 'Không thể cập nhật trạng thái các coupon.');
      return response;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      await queryClient.invalidateQueries({ queryKey: adminFinanceKeys.couponStats });
      toast.success('Đã cập nhật trạng thái các coupon.');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái các coupon.'),
  });
}
