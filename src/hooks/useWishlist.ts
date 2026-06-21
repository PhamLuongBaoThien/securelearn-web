import { useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  setWishlistItems,
  type CartItem,
} from '@/features/courses/cartSlice';
import {
  clearGuestWishlist,
  getGuestWishlistCourseIds,
  saveUserWishlist,
} from '@/features/courses/wishlistStorage';
import {
  addWishlistItem,
  getWishlist,
  mergeGuestWishlist,
  removeWishlistItem,
  type WishlistData,
} from '@/services/wishlistApi';

export const wishlistKeys = {
  root: ['wishlist'] as const,
  items: ['wishlist', 'items'] as const,
};

export const toWishlistItem = (course: CartItem): CartItem => ({
  _id: course._id,
  slug: course.slug,
  title: course.title,
  price: course.price,
  thumbnail: course.thumbnail,
  instructorName: course.instructorName,
  level: course.level,
  totalLessons: course.totalLessons,
  totalDuration: course.totalDuration,
  rating: course.rating,
});

export function useWishlistSync(options?: { enabled?: boolean }) {
  const dispatch = useAppDispatch();
  const { isAuthenticated, authResolved, user } = useAppSelector((state) => state.auth);
  const enabled = options?.enabled ?? true;
  const isAllowed = isAuthenticated && !!user && (user.role === 'STUDENT' || user.role === 'INSTRUCTOR');

  const wishlistQuery = useQuery({
    queryKey: wishlistKeys.items,
    queryFn: async (): Promise<WishlistData> => {
      const response = await getWishlist();
      if (response.status === 'ERR') {
        throw new Error(response.message);
      }
      return response.data ?? { items: [] };
    },
    enabled: enabled && authResolved && isAllowed,
  });

  useEffect(() => {
    if (!enabled) return;
    if (!authResolved) return;

    if (!isAllowed) {
      dispatch(setWishlistItems([]));
      return;
    }

    if (wishlistQuery.data) {
      dispatch(setWishlistItems(wishlistQuery.data.items));
      saveUserWishlist(wishlistQuery.data.items);
    }
  }, [enabled, authResolved, isAllowed, wishlistQuery.data, dispatch]);

  return wishlistQuery;
}

export function useWishlistActions() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const isAllowedToWishlist = isAuthenticated && !!user && (user.role === 'STUDENT' || user.role === 'INSTRUCTOR');

  const syncServerWishlist = useCallback((items: CartItem[]) => {
    dispatch(setWishlistItems(items));
    saveUserWishlist(items);
    queryClient.setQueryData(wishlistKeys.items, { items });
  }, [dispatch, queryClient]);

  const addMutation = useMutation({
    mutationFn: addWishlistItem,
    onSuccess: (response) => {
      syncServerWishlist(response.data?.items ?? []);
      toast.success(response.message || 'Đã lưu khóa học vào danh sách mong muốn.');
    },
    onError: (error) => {
      toast.error(error.message || 'Không thể lưu khóa học.');
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeWishlistItem,
    onSuccess: (response) => {
      syncServerWishlist(response.data?.items ?? []);
      toast.success(response.message || 'Đã bỏ khóa học khỏi danh sách mong muốn.');
    },
    onError: (error) => {
      toast.error(error.message || 'Không thể bỏ khóa học khỏi danh sách mong muốn.');
    },
  });

  const addItem = useCallback((item: CartItem) => {
    if (!isAllowedToWishlist) {
      toast.error('Vui lòng đăng nhập để thêm khóa học vào danh sách mong muốn.');
      return;
    }
    const normalizedItem = toWishlistItem(item);
    addMutation.mutate(normalizedItem._id);
  }, [addMutation, isAllowedToWishlist]);

  const removeItem = useCallback((courseId: string) => {
    if (!isAllowedToWishlist) {
      toast.error('Vui lòng đăng nhập để bỏ khóa học khỏi danh sách mong muốn.');
      return;
    }
    removeMutation.mutate(courseId);
  }, [removeMutation, isAllowedToWishlist]);

  const toggleItem = useCallback((item: CartItem, isSaved: boolean) => {
    if (isSaved) {
      removeItem(item._id);
      return;
    }
    addItem(item);
  }, [addItem, removeItem]);

  return {
    addItem,
    removeItem,
    toggleItem,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}

export function useMergeGuestWishlist() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const courseIds = getGuestWishlistCourseIds();
      if (courseIds.length === 0) return null;

      const response = await mergeGuestWishlist(courseIds);
      if (response.status === 'ERR') {
        throw new Error(response.message);
      }
      return response.data ?? { items: [] };
    },
    onSuccess: (wishlist) => {
      if (!wishlist) return;
      clearGuestWishlist();
      dispatch(setWishlistItems(wishlist.items));
      saveUserWishlist(wishlist.items);
      queryClient.setQueryData(wishlistKeys.items, wishlist);
    },
  });
}
