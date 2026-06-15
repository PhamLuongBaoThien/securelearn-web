// ========================
// Payment API Client
// Mục đích:
// - gọi payment-service cho checkout, transaction, finance và subscription
// - gom type frontend dùng để render payment return, pricing và admin settlement
// ========================
import apiClient from './apiClient';

export type PaymentProvider = 'VNPAY' | 'MOMO';
export type PaymentMethod = 'VNPAY' | 'MOMO';

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

export const confirmVnpayPayment = async (payload: Record<string, string>) => {
  const { data } = await apiClient.post<ApiResponse<PaymentTransaction>>('/api/payments/vnpay-return', payload);
  return data;
};

export const confirmMomoPayment = async (payload: Record<string, string>) => {
  const { data } = await apiClient.post<ApiResponse<PaymentTransaction>>('/api/payments/momo-return', payload);
  return data;
};

export const getInstructorRevenueStats = async (): Promise<ApiResponse<InstructorRevenueBreakdown>> => {
  const { data } = await apiClient.get<ApiResponse<InstructorRevenueBreakdown>>('/api/payments/instructor/finance/revenue');
  return data;
};
