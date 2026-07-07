import apiClient from './apiClient';
import type { AdminApiResponse, IWebsiteConfig } from '@/types/admin.types';

export const getPublicWebsiteConfig = async (): Promise<AdminApiResponse<IWebsiteConfig>> => {
  const response = await apiClient.get<AdminApiResponse<IWebsiteConfig>>('/api/website-config');
  return response.data;
};
