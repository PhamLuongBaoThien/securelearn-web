import apiClient from './apiClient';
import type { Policy } from '@/types/admin.types';

export interface PublicPolicy {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  status: 'OK' | 'ERR';
  message: string;
  data?: T;
}

export const getPublicPolicies = async (): Promise<ApiResponse<PublicPolicy[]>> => {
  const response = await apiClient.get<ApiResponse<PublicPolicy[]>>('/api/policies');
  return response.data;
};

export const getPublicPolicyBySlug = async (slug: string): Promise<ApiResponse<Policy>> => {
  const response = await apiClient.get<ApiResponse<Policy>>(`/api/policies/${slug}`);
  return response.data;
};


