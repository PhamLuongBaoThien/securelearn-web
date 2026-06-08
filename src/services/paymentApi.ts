// ========================
// Payment API Client
// Mục đích:
// - gọi payment-service từ frontend
// - tạo checkout / lấy transaction / confirm payment
// Hàm chính:
// - createCourseCheckout()
// - getTransaction()
// - confirmCoursePayment()
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
  provider: PaymentProvider;
  paymentMethod: PaymentMethod;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
  providerRef?: string;
  failureReason?: string;
  paidAt?: string | null;
  failedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T = undefined> {
  status: string;
  message?: string;
  data?: T;
}

export interface CourseCheckoutResponse {
  transaction: PaymentTransaction;
  paymentUrl: string;
}

export const createCourseCheckout = async (payload: {
  paymentMethod: PaymentMethod;
  provider?: PaymentProvider;
}) => {
  const { data } = await apiClient.post<ApiResponse<CourseCheckoutResponse>>('/api/payments/course-checkout', payload);
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
