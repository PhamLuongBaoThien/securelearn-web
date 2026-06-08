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

// Khóa dùng để lưu trữ giỏ hàng của người dùng đã đăng nhập trong localStorage
const USER_CART_KEY = 'sl_user_cart_v1';

/**
 * Đọc danh sách khóa học trong giỏ hàng của user đã đăng nhập từ localStorage.
 * Giúp hiển thị giỏ hàng ngay lập tức khi load lại trang mà không cần chờ gọi API.
 */
export const readUserCart = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(USER_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? normalizeItems(parsed as CartItem[]) : [];
  } catch {
    return [];
  }
};

/**
 * Lưu danh sách giỏ hàng của user đã đăng nhập vào localStorage để làm cache.
 * Được gọi mỗi khi dữ liệu giỏ hàng trên server có sự thay đổi.
 */
export const saveUserCart = (items: CartItem[]) => {
  try {
    localStorage.setItem(USER_CART_KEY, JSON.stringify(normalizeItems(items)));
  } catch {
    // Bỏ qua lỗi khi trình duyệt mở tab ẩn danh (Private/Incognito)
  }
};

/**
 * Xóa sạch dữ liệu giỏ hàng của user trong localStorage.
 * Được gọi khi đăng xuất hoặc khi thanh toán thành công.
 */
export const clearUserCart = () => {
  try {
    localStorage.removeItem(USER_CART_KEY);
  } catch {
    // Bỏ qua lỗi khi trình duyệt mở tab ẩn danh (Private/Incognito)
  }
};


