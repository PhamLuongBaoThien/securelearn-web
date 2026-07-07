import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminApiResponse, IWebsiteConfig, WebsiteConfigInput } from '@/types/admin.types';
import { getWebsiteConfig, updateWebsiteConfig } from '@/services/adminApi';
import { getPublicWebsiteConfig } from '@/services/websiteConfigApi';

export const WEBSITE_CONFIG_FALLBACK: IWebsiteConfig = {
  siteUrl: 'https://securelearn.vn',
  logoUrl: '',
  faviconUrl: '/favicon.svg',
  contactEmail: 'plbthien2004@gmail.com',
  contactPhone: '+84 343613222',
  address: '',
  facebookUrl: '',
  youtubeUrl: '',
  githubUrl: '',
  linkedinUrl: '',
};

export const websiteConfigKeys = {
  public: ['website-config', 'public'] as const,
  admin: ['admin', 'website-config'] as const,
};

const STORAGE_KEY = 'securelearn.websiteConfig';

const unwrap = <T,>(response: AdminApiResponse<T>): T => {
  if (response.status === 'ERR') throw new Error(response.message);
  return response.data as T;
};

const readCachedConfig = (): IWebsiteConfig | undefined => {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : undefined;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return undefined;
  }
};

const cacheConfig = (config?: IWebsiteConfig) => {
  if (typeof window === 'undefined' || !config) return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); } catch { /* ignore storage failures */ }
};

export function usePublicWebsiteConfig() {
  const query = useQuery({
    queryKey: websiteConfigKeys.public,
    queryFn: async () => unwrap(await getPublicWebsiteConfig()) || WEBSITE_CONFIG_FALLBACK,
    initialData: readCachedConfig,
    initialDataUpdatedAt: 0,
    staleTime: 0,
    refetchOnMount: 'always',
    retry: 1,
  });

  useEffect(() => { cacheConfig(query.data); }, [query.data]);
  return query;
}

export function useAdminWebsiteConfig() {
  return useQuery({
    queryKey: websiteConfigKeys.admin,
    queryFn: async () => unwrap(await getWebsiteConfig()) || WEBSITE_CONFIG_FALLBACK,
    staleTime: 30 * 1000,
  });
}

export function useUpdateWebsiteConfig() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: WebsiteConfigInput) => unwrap(await updateWebsiteConfig(payload)),
    onSuccess: async (config) => {
      cacheConfig(config);
      client.setQueryData(websiteConfigKeys.admin, config);
      client.setQueryData(websiteConfigKeys.public, config);
      await Promise.all([
        client.invalidateQueries({ queryKey: websiteConfigKeys.admin }),
        client.invalidateQueries({ queryKey: websiteConfigKeys.public }),
      ]);
    },
  });
}
