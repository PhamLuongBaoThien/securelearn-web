import type { CartItem } from './cartSlice';

const GUEST_CART_KEY = 'sl_guest_cart_v1';

const normalizeItems = (items: CartItem[]) => {
  const itemsById = new Map<string, CartItem>();
  items.forEach((item) => {
    if (item?._id && item.slug && item.title) {
      itemsById.set(item._id, item);
    }
  });
  return [...itemsById.values()];
};

export const readGuestCart = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? normalizeItems(parsed as CartItem[]) : [];
  } catch {
    return [];
  }
};

export const saveGuestCart = (items: CartItem[]) => {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(normalizeItems(items)));
  } catch {
    // Ignore private/incognito storage errors.
  }
};

export const addGuestCartItem = (item: CartItem) => {
  const nextItems = normalizeItems([...readGuestCart(), item]);
  saveGuestCart(nextItems);
  return nextItems;
};

export const removeGuestCartItem = (courseId: string) => {
  const nextItems = readGuestCart().filter((item) => item._id !== courseId);
  saveGuestCart(nextItems);
  return nextItems;
};

export const clearGuestCart = () => {
  try {
    localStorage.removeItem(GUEST_CART_KEY);
  } catch {
    // Ignore private/incognito storage errors.
  }
};

export const getGuestCartCourseIds = () => readGuestCart().map((item) => item._id);
