import apiClient from './apiClient';
import type { AdminApiResponse, Banner } from '@/types/admin.types';

export const getPublicBanners = async (): Promise<AdminApiResponse<Banner[]>> => {
  const response = await apiClient.get<AdminApiResponse<Banner[]>>('/api/banners');
  return response.data;
};
