import { useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { addCartItem, getCart, mergeGuestCart, removeCartItem } from '@/services/cartApi';
import { addToCart, removeFromCart, setCartItems, type CartItem } from '@/features/courses/cartSlice';
import {
  addGuestCartItem,
  clearGuestCart,
  getGuestCartCourseIds,
  readGuestCart,
  removeGuestCartItem,
  saveUserCart,
} from '@/features/courses/cartStorage';
import { toast } from 'sonner';

export const cartKeys = {
  root: ['cart'] as const,
  items: ['cart', 'items'] as const,
};

export const toCartItem = (course: CartItem): CartItem => ({
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

export function useCartSync(options?: { enabled?: boolean }) {
  const dispatch = useAppDispatch();
  const { isAuthenticated, authResolved } = useAppSelector((state) => state.auth);
  const enabled = options?.enabled ?? true;

  const cartQuery = useQuery({
    queryKey: cartKeys.items,
    queryFn: async () => {
      const response = await getCart();
      if (response.status === 'ERR') {
        throw new Error(response.message);
      }
      return response.data ?? { items: [], totalPrice: 0 };
    },
    enabled: enabled && authResolved && isAuthenticated,
  });

  useEffect(() => {
    if (!enabled) return;
    if (!authResolved) return;

    if (!isAuthenticated) {
      dispatch(setCartItems(readGuestCart()));
      return;
    }

    if (cartQuery.data) {
      dispatch(setCartItems(cartQuery.data.items));
      saveUserCart(cartQuery.data.items);
    }
  }, [enabled, authResolved, isAuthenticated, cartQuery.data, dispatch]);

  return cartQuery;
}

export function useCartActions() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const syncServerCart = useCallback((items: CartItem[]) => {
    dispatch(setCartItems(items));
    saveUserCart(items);
    queryClient.setQueryData(cartKeys.items, {
      items,
      totalPrice: items.reduce((sum, item) => sum + item.price, 0),
    });
  }, [dispatch, queryClient]);

  const addMutation = useMutation({
    mutationFn: addCartItem,
    onSuccess: (response) => {
      syncServerCart(response.data?.items ?? []);
      toast.success(response.message || 'Đã thêm khóa học vào giỏ hàng.');
    },
    onError: (error) => {
      toast.error(error.message || 'Không thể thêm khóa học vào giỏ hàng.');
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeCartItem,
    onSuccess: (response) => {
      syncServerCart(response.data?.items ?? []);
      toast.success(response.message || 'Đã bỏ khóa học khỏi giỏ hàng.');
    },
    onError: (error) => {
      toast.error(error.message || 'Không thể bỏ khóa học khỏi giỏ hàng.');
    },
  });

  const addItem = useCallback((item: CartItem) => {
    const normalizedItem = toCartItem(item);
    if (isAuthenticated) {
      addMutation.mutate(normalizedItem._id);
      return;
    }

    const nextItems = addGuestCartItem(normalizedItem);
    dispatch(addToCart(normalizedItem));
    dispatch(setCartItems(nextItems));
    toast.success('Đã thêm khóa học vào giỏ hàng.');
  }, [addMutation, dispatch, isAuthenticated]);

  const removeItem = useCallback((courseId: string) => {
    if (isAuthenticated) {
      removeMutation.mutate(courseId);
      return;
    }

    const nextItems = removeGuestCartItem(courseId);
    dispatch(removeFromCart(courseId));
    dispatch(setCartItems(nextItems));
    toast.success('Đã bỏ khóa học khỏi giỏ hàng.');
  }, [dispatch, isAuthenticated, removeMutation]);

  return {
    addItem,
    removeItem,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}

export function useMergeGuestCart() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const courseIds = getGuestCartCourseIds();
      if (courseIds.length === 0) return null;

      const response = await mergeGuestCart(courseIds);
      if (response.status === 'ERR') {
        throw new Error(response.message);
      }
      return response.data ?? { items: [], totalPrice: 0 };
    },
    onSuccess: (cart) => {
      if (!cart) return;
      clearGuestCart();
      dispatch(setCartItems(cart.items));
      saveUserCart(cart.items);
      queryClient.setQueryData(cartKeys.items, cart);
    },
  });
}
