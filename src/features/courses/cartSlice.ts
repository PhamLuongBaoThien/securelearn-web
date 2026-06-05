import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ICourse } from '@/services/courseApi';

export type CartItem = Pick<ICourse, '_id' | 'slug' | 'title' | 'price' | 'thumbnail' | 'instructorName'>;

interface CartState {
  cartItems: CartItem[];
  wishlist: CartItem[];
}

const initialState: CartState = {
  cartItems: [],
  wishlist: [],
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCartItems: (state, action: PayloadAction<CartItem[]>) => {
      state.cartItems = action.payload;
    },
    addToCart: (state, action: PayloadAction<CartItem>) => {
      if (!state.cartItems.find(item => item._id === action.payload._id)) {
        state.cartItems.push(action.payload);
      }
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.cartItems = state.cartItems.filter(item => item._id !== action.payload);
    },
    addToWishlist: (state, action: PayloadAction<CartItem>) => {
      if (!state.wishlist.find(item => item._id === action.payload._id)) {
        state.wishlist.push(action.payload);
      }
    },
    removeFromWishlist: (state, action: PayloadAction<string>) => {
      state.wishlist = state.wishlist.filter(item => item._id !== action.payload);
    },
    clearCart: (state) => {
      state.cartItems = [];
    }
  },
});

export const { setCartItems, addToCart, removeFromCart, addToWishlist, removeFromWishlist, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
