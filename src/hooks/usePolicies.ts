import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PolicyInput } from '@/types/admin.types';
import { createPolicy, deletePolicy, getPolicies, setPolicyStatus, updatePolicy } from '@/services/adminApi';
import { getPublicPolicies, getPublicPolicyBySlug } from '@/services/policyApi';

export const policyKeys = {
  admin: ['admin', 'policies'] as const,
  public: ['public', 'policies'] as const,
  publicBySlug: (slug: string) => ['public', 'policies', slug] as const,
};

const unwrap = <T,>(response: { status: 'OK' | 'ERR'; message: string; data?: T }): T => {
  if (response.status === 'ERR') throw new Error(response.message);
  return response.data as T;
};

const useRefreshPolicies = () => {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: policyKeys.admin });
};

export function useAdminPolicies() {
  return useQuery({
    queryKey: policyKeys.admin,
    queryFn: async () => unwrap(await getPolicies()) || [],
    staleTime: 30 * 1000,
  });
}

export function useSavePolicy() {
  const refresh = useRefreshPolicies();
  return useMutation({
    mutationFn: async ({ id, payload }: { id?: string; payload: PolicyInput }) =>
      unwrap(id ? await updatePolicy(id, payload) : await createPolicy(payload)),
    onSuccess: refresh,
  });
}

export function useSetPolicyStatus() {
  const refresh = useRefreshPolicies();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      unwrap(await setPolicyStatus(id, isActive)),
    onSuccess: refresh,
  });
}

export function useDeletePolicy() {
  const refresh = useRefreshPolicies();
  return useMutation({
    mutationFn: async (id: string) => unwrap(await deletePolicy(id)),
    onSuccess: refresh,
  });
}

export function usePublicPolicies() {
  return useQuery({
    queryKey: policyKeys.public,
    queryFn: async () => unwrap(await getPublicPolicies()) || [],
    staleTime: 5 * 60 * 1000,
  });
}

export function usePublicPolicyBySlug(slug: string) {
  return useQuery({
    queryKey: policyKeys.publicBySlug(slug),
    queryFn: async () => unwrap(await getPublicPolicyBySlug(slug)),
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
  });
}
