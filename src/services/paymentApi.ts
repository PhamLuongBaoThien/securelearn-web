// ========================
// Payment API Client
// Mục đích:
// - gọi payment-service cho checkout, transaction, finance và subscription
// - gom type frontend dùng để render payment return, pricing và admin settlement
// ========================
import apiClient from './apiClient';

export type PaymentProvider = 'VNPAY' | 'MOMO';
export type PaymentMethod = 'VNPAY' | 'MOMO';
export type CouponType = 'PERCENT' | 'FIXED';
export type CouponComputedStatus = 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'INACTIVE' | 'USED_UP';

export interface Coupon {
  _id: string;
  code: string;
  name: string;
  type: CouponType;
  value: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number;
  usageLimit: number | null;
  usedCount: number;
  perUserLimit: number;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  combinable?: boolean;
  computedStatus?: CouponComputedStatus;
  discountPreview?: number;
  discountAmount?: number;
  finalAmount?: number;
  reasonIfUnavailable?: string;
  createdBy: string;
  createdByName?: string;
  updatedBy: string;
  updatedByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CouponValidation {
  coupon: Coupon;
  subtotal: number;
  discountAmount: number;
  finalAmount: number;
}

export interface AdminCouponsResponse {
  coupons: Coupon[];
  total: number;
  page: number;
  limit: number;
}

export interface AvailableCouponsResponse {
  subtotal: number;
  coupons: Coupon[];
}

export interface BestCouponResponse {
  subtotal: number;
  coupon: Coupon | null;
}

export interface BestCouponPreviewsResponse {
  previews: Record<string, BestCouponResponse>;
}

export interface CouponRedemption {
  _id: string;
  couponId: string;
  couponCode: string;
  userId: string;
  transactionId: string;
  transactionCode: string;
  discountAmount: number;
  createdAt: string;
}

export interface CouponRedemptionsResponse {
  redemptions: CouponRedemption[];
  total: number;
  page: number;
  limit: number;
}

export interface CouponStats {
  totalCoupons: number;
  statusCounts: Record<CouponComputedStatus, number>;
  totalRedemptions: number;
  totalDiscountAmount: number;
  uniqueUsers: number;
  topByUsage: Array<{ couponId: string; code: string; usedCount: number; computedStatus: CouponComputedStatus }>;
  topByDiscount: Array<{ couponId: string; code: string; totalDiscountAmount: number; redemptions: number }>;
}

export type CouponPayload = Omit<Coupon, '_id' | 'usedCount' | 'createdBy' | 'createdByName' | 'updatedBy' | 'updatedByName' | 'createdAt' | 'updatedAt'>;

export interface PaymentCourseItem {
  courseId: string;
  slug: string;
  title: string;
  price: number;
  thumbnail?: string;
  instructorName?: string;
  instructorId?: string;
  adminPercent?: number;
  instructorPercent?: number;
  adminAmount?: number;
  instructorAmount?: number;
}

export interface PaymentTransaction {
  _id: string;
  transactionCode: string;
  userId: string;
  userRole: string;
  fullName: string;
  email: string;
  items: PaymentCourseItem[];
  amount: number;
  discountAmount?: number;
  couponSnapshot?: {
    couponId: string;
    code: string;
    type: CouponType;
    value: number;
    discountAmount: number;
  } | null;
  // productType giúp return page và finance UI biết đây là mua khóa học hay mua thuê bao.
  productType: 'COURSE' | 'SUBSCRIPTION';
  subscriptionSnapshot?: {
    planId: string;
    planType: 'MONTHLY' | 'YEARLY';
    name: string;
    durationDays: number;
    adminPercent: number;
    instructorPercent: number;
    adminAmount: number;
    instructorPoolAmount: number;
  } | null;
  grossAmount?: number;
  adminAmount?: number;
  instructorAmount?: number;
  provider: PaymentProvider;
  paymentMethod: PaymentMethod;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
  providerRef?: string;
  failureReason?: string;
  paidAt?: string | null;
  failedAt?: string | null;
  refundedAt?: string | null;
  refundedBy?: string;
  refundReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T = undefined> {
  status: string;
  message?: string;
  data?: T;
}

export interface InstructorRevenueBreakdown {
  totalGrossRevenue: number;
  totalAdminRevenue: number;
  totalInstructorRevenue: number;
  totalTransactions: number;
  monthlyData: {
    month: string;
    revenue: number;
    adminRevenue: number;
    instructorRevenue: number;
    transactions: number;
  }[];
  dailyData?: {
    date: string;
    revenue: number;
    adminRevenue: number;
    instructorRevenue: number;
    transactions: number;
  }[];
  providerBreakdown: {
    provider: PaymentProvider;
    revenue: number;
    adminRevenue: number;
    instructorRevenue: number;
    transactions: number;
  }[];
  courseBreakdown: {
    courseId: string;
    courseTitle: string;
    slug: string;
    grossRevenue: number;
    adminRevenue: number;
    instructorRevenue: number;
    transactions: number;
  }[];
  adminPercent?: number;
  instructorPercent?: number;
}

export interface CourseCheckoutResponse {
  transaction: PaymentTransaction;
  paymentUrl: string;
}

export interface MyPaymentTransactionsResponse {
  transactions: PaymentTransaction[];
  total: number;
  page: number;
  limit: number;
}

export interface SubscriptionPlan {
  _id: string;
  type: 'MONTHLY' | 'YEARLY';
  name: string;
  description: string;
  price: number;
  durationDays: 30 | 365;
  features: string[];
  sortOrder: number;
  isActive: boolean;
}

export interface SubscriptionTerm {
  _id: string;
  planName: string;
  planType: 'MONTHLY' | 'YEARLY';
  status: 'SCHEDULED' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'REFUNDED';
  startsAt: string;
  endsAt: string;
}

export const createCourseCheckout = async (payload: {
  paymentMethod: PaymentMethod;
  provider?: PaymentProvider;
  couponCode?: string;
}) => {
  const { data } = await apiClient.post<ApiResponse<CourseCheckoutResponse>>('/api/payments/course-checkout', payload);
  return data;
};

export const getSubscriptionPlans = async () => {
  const { data } = await apiClient.get<ApiResponse<SubscriptionPlan[]>>('/api/payments/subscription-plans');
  return data;
};

export const createSubscriptionCheckout = async (payload: {
  planId: string;
  paymentMethod: PaymentMethod;
  provider?: PaymentProvider;
}) => {
  const { data } = await apiClient.post<ApiResponse<CourseCheckoutResponse>>('/api/payments/subscription-checkout', payload);
  return data;
};

export const getMySubscription = async () => {
  const { data } = await apiClient.get<ApiResponse<{
    current: SubscriptionTerm | null;
    scheduled: SubscriptionTerm[];
    history: SubscriptionTerm[];
  }>>('/api/payments/subscriptions/me');
  return data;
};

export const getAdminSubscriptionPlans = async () => {
  const { data } = await apiClient.get<ApiResponse<SubscriptionPlan[]>>('/api/payments/admin/subscription-plans');
  return data;
};

export const saveAdminSubscriptionPlan = async (plan: Omit<SubscriptionPlan, '_id'>) => {
  const { data } = await apiClient.put<ApiResponse<SubscriptionPlan>>('/api/payments/admin/subscription-plans', plan);
  return data;
};

export interface AdminSubscriptionTerm extends SubscriptionTerm {
  userId: string;
  transactionCode: string;
  price: number;
  instructorPoolAmount: number;
}

export interface SubscriptionSettlement {
  _id: string;
  period: string;
  status: 'OPEN' | 'CALCULATED' | 'LOCKED' | 'AVAILABLE';
  recognizedGross: number;
  adminRevenue: number;
  instructorPool: number;
  refundGrossAdjustment: number;
  refundAdminAdjustment: number;
  refundInstructorPoolAdjustment: number;
  carriedIn: number;
  carriedOut: number;
  totalQualifiedSeconds: number;
  calculatedAt?: string;
}

export const getAdminSubscriptionTerms = async () => {
  const { data } = await apiClient.get<ApiResponse<AdminSubscriptionTerm[]>>('/api/payments/admin/subscriptions/terms');
  return data;
};

export const refundAdminSubscriptionTerm = async (termId: string, reason: string) => {
  const { data } = await apiClient.post<ApiResponse<AdminSubscriptionTerm>>(`/api/payments/admin/subscriptions/terms/${termId}/refund`, { reason });
  return data;
};

export const getSubscriptionSettlements = async () => {
  const { data } = await apiClient.get<ApiResponse<SubscriptionSettlement[]>>('/api/payments/admin/subscriptions/settlements');
  return data;
};

export const calculateSubscriptionSettlement = async (period: string) => {
  const { data } = await apiClient.post<ApiResponse<SubscriptionSettlement>>(`/api/payments/admin/subscriptions/settlements/${period}/calculate`);
  return data;
};

export const updateSubscriptionSettlementStatus = async (
  period: string,
  status: SubscriptionSettlement['status']
) => {
  const { data } = await apiClient.patch<ApiResponse<SubscriptionSettlement>>(`/api/payments/admin/subscriptions/settlements/${period}/status`, { status });
  return data;
};

export interface InstructorSubscriptionFinance {
  estimated: number;
  pending: number;
  available: number;
  qualifiedSeconds: number;
  settlements: Array<{
    period: string;
    status: 'OPEN' | 'CALCULATED' | 'LOCKED' | 'AVAILABLE';
    courseId: string;
    qualifiedSeconds: number;
    amount: number;
  }>;
}

export const getInstructorSubscriptionFinance = async () => {
  const { data } = await apiClient.get<ApiResponse<InstructorSubscriptionFinance>>('/api/payments/instructor/finance/subscriptions');
  return data;
};

export const getTransaction = async (transactionId: string) => {
  const { data } = await apiClient.get<ApiResponse<PaymentTransaction>>(`/api/payments/transactions/${transactionId}`);
  return data;
};

export const getTransactionByCode = async (transactionCode: string) => {
  const { data } = await apiClient.get<ApiResponse<PaymentTransaction>>(`/api/payments/transactions/code/${transactionCode}`);
  return data;
};

export const getMyPaymentTransactions = async (params?: {
  search?: string;
  productType?: PaymentTransaction['productType'];
  status?: PaymentTransaction['status'];
  page?: number;
  limit?: number;
}) => {
  const { data } = await apiClient.get<ApiResponse<MyPaymentTransactionsResponse>>('/api/payments/transactions/me', { params });
  return data;
};

export const confirmVnpayPayment = async (payload: Record<string, string>) => {
  const { data } = await apiClient.post<ApiResponse<PaymentTransaction>>('/api/payments/vnpay-return', payload);
  return data;
};

export const confirmMomoPayment = async (payload: Record<string, string>) => {
  const { data } = await apiClient.post<ApiResponse<PaymentTransaction>>('/api/payments/momo-return', payload);
  return data;
};

export const getInstructorRevenueStats = async (params?: {
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<InstructorRevenueBreakdown>> => {
  const { data } = await apiClient.get<ApiResponse<InstructorRevenueBreakdown>>('/api/payments/instructor/finance/revenue', { params });
  return data;
};




export const validateCourseCoupon = async (code: string) => {
  const { data } = await apiClient.post<ApiResponse<CouponValidation>>('/api/payments/coupons/validate', { code });
  return data;
};


export const getAvailableCourseCoupons = async () => {
  const { data } = await apiClient.get<ApiResponse<AvailableCouponsResponse>>('/api/payments/coupons/available');
  return data;
};

export const getBestCourseCoupon = async () => {
  const { data } = await apiClient.get<ApiResponse<BestCouponResponse>>('/api/payments/coupons/best');
  return data;
};
export const getBestCourseCouponPreview = async (amount: number) => {
  const { data } = await apiClient.get<ApiResponse<BestCouponResponse>>('/api/payments/coupons/best-preview', { params: { amount } });
  return data;
};
export const getBestCourseCouponPreviews = async (items: Array<{ courseId: string; price: number }>) => {
  const { data } = await apiClient.post<ApiResponse<BestCouponPreviewsResponse>>('/api/payments/coupons/best-previews', { items });
  return data;
};
export const getAdminCoupons = async (params?: { search?: string; status?: string; page?: number; limit?: number }) => {
  const { data } = await apiClient.get<ApiResponse<AdminCouponsResponse>>('/api/payments/admin/coupons', { params });
  return data;
};

export const createAdminCoupon = async (payload: CouponPayload) => {
  const { data } = await apiClient.post<ApiResponse<Coupon>>('/api/payments/admin/coupons', payload);
  return data;
};

export const updateAdminCoupon = async (id: string, payload: CouponPayload) => {
  const { data } = await apiClient.patch<ApiResponse<Coupon>>(`/api/payments/admin/coupons/${id}`, payload);
  return data;
};

export const updateAdminCouponStatus = async (id: string, isActive: boolean) => {
  const { data } = await apiClient.patch<ApiResponse<Coupon>>(`/api/payments/admin/coupons/${id}/status`, { isActive });
  return data;
};

export const deleteAdminCoupon = async (id: string) => {
  const { data } = await apiClient.delete<ApiResponse>(`/api/payments/admin/coupons/${id}`);
  return data;
};
export const getAdminCouponStats = async () => {
  const { data } = await apiClient.get<ApiResponse<CouponStats>>('/api/payments/admin/coupons/stats');
  return data;
};

export const getAdminCouponDetailStats = async (id: string) => {
  const { data } = await apiClient.get<ApiResponse<CouponStats>>(`/api/payments/admin/coupons/${id}/stats`);
  return data;
};

export const getAdminCouponRedemptions = async (params?: { code?: string; user?: string; page?: number; limit?: number }) => {
  const { data } = await apiClient.get<ApiResponse<CouponRedemptionsResponse>>('/api/payments/admin/coupon-redemptions', { params });
  return data;
};

export const getAdminCouponDetailRedemptions = async (id: string, params?: { page?: number; limit?: number }) => {
  const { data } = await apiClient.get<ApiResponse<CouponRedemptionsResponse>>(`/api/payments/admin/coupons/${id}/redemptions`, { params });
  return data;
};





