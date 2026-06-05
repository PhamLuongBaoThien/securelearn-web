import apiClient from './apiClient';
import type { CartItem } from '@/features/courses/cartSlice';

export interface CartData {
  items: CartItem[];
  totalPrice: number;
}

interface ApiResponse<T = undefined> {
  status: string;
  message?: string;
  data?: T;
}

export const getCart = async () => {
  const { data } = await apiClient.get<ApiResponse<CartData>>('/api/cart');
  return data;
};

export const addCartItem = async (courseId: string) => {
  const { data } = await apiClient.post<ApiResponse<CartData>>('/api/cart/items', { courseId });
  return data;
};

export const removeCartItem = async (courseId: string) => {
  const { data } = await apiClient.delete<ApiResponse<CartData>>(`/api/cart/items/${courseId}`);
  return data;
};

export const mergeGuestCart = async (courseIds: string[]) => {
  const { data } = await apiClient.post<ApiResponse<CartData>>('/api/cart/merge', { courseIds });
  return data;
};

export const clearServerCart = async () => {
  const { data } = await apiClient.delete<ApiResponse<CartData>>('/api/cart');
  return data;
};
