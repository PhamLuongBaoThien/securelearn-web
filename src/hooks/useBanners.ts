import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Banner, BannerInput } from '@/types/admin.types';
import {
  createBanner,
  deleteBanner,
  getBanners,
  reorderBanners,
  setBannerStatus,
  updateBanner,
} from '@/services/adminApi';
import { getPublicBanners } from '@/services/bannerApi';

export const bannerKeys = {
  public: ['banners', 'public'] as const,
  admin: ['admin', 'banners'] as const,
};

const PUBLIC_BANNERS_STORAGE_KEY = 'securelearn.publicBanners';

const unwrap = <T,>(response: { status: 'OK' | 'ERR'; message: string; data?: T }): T => {
  if (response.status === 'ERR') throw new Error(response.message);
  return response.data as T;
};

const readCachedPublicBanners = (): Banner[] | undefined => {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = window.localStorage.getItem(PUBLIC_BANNERS_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    window.localStorage.removeItem(PUBLIC_BANNERS_STORAGE_KEY);
    return undefined;
  }
};

const cachePublicBanners = (banners: Banner[] | undefined) => {
  if (typeof window === 'undefined' || !banners) return;
  try {
    window.localStorage.setItem(PUBLIC_BANNERS_STORAGE_KEY, JSON.stringify(banners));
  } catch {
    // localStorage may be unavailable/full; React Query cache still works for this session.
  }
};

export function usePublicBanners() {
  const query = useQuery({
    queryKey: bannerKeys.public,
    queryFn: async () => unwrap(await getPublicBanners()) || [],
    initialData: readCachedPublicBanners,
    initialDataUpdatedAt: 0,
    staleTime: 0,
    refetchOnMount: 'always',
    retry: 1,
  });

  useEffect(() => {
    cachePublicBanners(query.data);
  }, [query.data]);

  return query;
}

export function useAdminBanners() {
  return useQuery({
    queryKey: bannerKeys.admin,
    queryFn: async () => unwrap(await getBanners()) || [],
    staleTime: 30 * 1000,
  });
}

const useRefreshBanners = () => {
  const client = useQueryClient();
  return () => Promise.all([
    client.invalidateQueries({ queryKey: bannerKeys.admin }),
    client.invalidateQueries({ queryKey: bannerKeys.public }),
  ]);
};

export function useSaveBanner() {
  const refresh = useRefreshBanners();
  return useMutation({
    mutationFn: async ({ id, payload }: { id?: string; payload: BannerInput }) =>
      unwrap(id ? await updateBanner(id, payload) : await createBanner(payload)),
    onSuccess: refresh,
  });
}

export function useSetBannerStatus() {
  const refresh = useRefreshBanners();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      unwrap(await setBannerStatus(id, isActive)),
    onSuccess: refresh,
  });
}

export function useDeleteBanner() {
  const refresh = useRefreshBanners();
  return useMutation({
    mutationFn: async (id: string) => unwrap(await deleteBanner(id)),
    onSuccess: refresh,
  });
}

export function useReorderBanners() {
  const client = useQueryClient();
  const refresh = useRefreshBanners();
  return useMutation({
    mutationFn: async (banners: Banner[]) => unwrap(await reorderBanners({ ids: banners.map((item) => item._id) })),
    onMutate: async (banners) => {
      await client.cancelQueries({ queryKey: bannerKeys.admin });
      const previous = client.getQueryData<Banner[]>(bannerKeys.admin);
      client.setQueryData(bannerKeys.admin, banners.map((item, index) => ({ ...item, order: index + 1 })));
      return { previous };
    },
    onError: (_error, _banners, context) => {
      if (context?.previous) client.setQueryData(bannerKeys.admin, context.previous);
    },
    onSettled: refresh,
  });
}
