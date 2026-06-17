// ========================
// Hook: useCatalog
// Quản lý state filter/search/pagination cho trang Catalog công khai.
// Dùng React Query để cache và deduplicate requests.
// ========================
import { useQuery } from '@tanstack/react-query';
import { getPublishedCourses, type ICourse } from '@/services/courseApi';

export interface CatalogFilters {
  search?: string;
  category?: string[];
  level?: string[];
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  minDuration?: number; // seconds
  maxDuration?: number; // seconds
  sort?: string;
  page?: number;
  limit?: number;
}

export interface CatalogData {
  courses: ICourse[];
  total: number;
  page: number;
  totalPages: number;
}

export const catalogKeys = {
  all: ['courses', 'public'] as const,
  list: (filters: CatalogFilters) => ['courses', 'public', 'list', filters] as const,
};

export function useCatalog(filters: CatalogFilters = {}) {
  return useQuery<CatalogData>({
    queryKey: catalogKeys.list(filters),
    queryFn: async () => {
      const response = await getPublishedCourses({
        page: filters.page || 1,
        limit: filters.limit || 12,
        search: filters.search || undefined,
        category: filters.category?.join(',') || undefined,
        level: filters.level?.join(',') || undefined,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        rating: filters.rating,
        minDuration: filters.minDuration,
        maxDuration: filters.maxDuration,
        sort: filters.sort,
      });
      if (response.status === 'ERR') {
        throw new Error(response.message || 'Không thể tải danh sách khóa học.');
      }
      return (response.data as CatalogData) ?? { courses: [], total: 0, page: 1, totalPages: 0 };
    },
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  });
}
