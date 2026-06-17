import apiClient from './apiClient';
import type { CartItem } from '@/features/courses/cartSlice';

export interface WishlistData {
  items: CartItem[];
}

interface ApiResponse<T = undefined> {
  status: string;
  message?: string;
  data?: T;
}

export const getWishlist = async () => {
  const { data } = await apiClient.get<ApiResponse<WishlistData>>('/api/wishlist');
  return data;
};

export const addWishlistItem = async (courseId: string) => {
  const { data } = await apiClient.post<ApiResponse<WishlistData>>('/api/wishlist/items', { courseId });
  return data;
};

export const removeWishlistItem = async (courseId: string) => {
  const { data } = await apiClient.delete<ApiResponse<WishlistData>>(`/api/wishlist/items/${courseId}`);
  return data;
};

export const mergeGuestWishlist = async (courseIds: string[]) => {
  const { data } = await apiClient.post<ApiResponse<WishlistData>>('/api/wishlist/merge', { courseIds });
  return data;
};

export const clearServerWishlist = async () => {
  const { data } = await apiClient.delete<ApiResponse<WishlistData>>('/api/wishlist');
  return data;
};
