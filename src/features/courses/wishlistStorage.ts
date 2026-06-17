import type { CartItem } from './cartSlice';

const GUEST_WISHLIST_KEY = 'sl_guest_wishlist_v1';
const USER_WISHLIST_KEY = 'sl_user_wishlist_v1';

const normalizeItems = (items: CartItem[]) => {
  const itemsById = new Map<string, CartItem>();
  items.forEach((item) => {
    if (item?._id && item.slug && item.title) {
      itemsById.set(item._id, item);
    }
  });
  return [...itemsById.values()];
};

const readItems = (key: string): CartItem[] => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? normalizeItems(parsed as CartItem[]) : [];
  } catch {
    return [];
  }
};

const saveItems = (key: string, items: CartItem[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(normalizeItems(items)));
  } catch {
    // Ignore private/incognito storage errors.
  }
};

const clearItems = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore private/incognito storage errors.
  }
};

export const readGuestWishlist = () => readItems(GUEST_WISHLIST_KEY);

export const saveGuestWishlist = (items: CartItem[]) => saveItems(GUEST_WISHLIST_KEY, items);

export const addGuestWishlistItem = (item: CartItem) => {
  const nextItems = normalizeItems([...readGuestWishlist(), item]);
  saveGuestWishlist(nextItems);
  return nextItems;
};

export const removeGuestWishlistItem = (courseId: string) => {
  const nextItems = readGuestWishlist().filter((item) => item._id !== courseId);
  saveGuestWishlist(nextItems);
  return nextItems;
};

export const clearGuestWishlist = () => clearItems(GUEST_WISHLIST_KEY);

export const getGuestWishlistCourseIds = () => readGuestWishlist().map((item) => item._id);

export const readUserWishlist = () => readItems(USER_WISHLIST_KEY);

export const saveUserWishlist = (items: CartItem[]) => saveItems(USER_WISHLIST_KEY, items);

export const clearUserWishlist = () => clearItems(USER_WISHLIST_KEY);
