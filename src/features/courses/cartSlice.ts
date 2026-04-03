import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface CourseSnippet {
  id: string;
  title: string;
  price: number;
  thumbnail?: string;
  instructor?: string;
}

interface CartState {
  cartItems: CourseSnippet[];
  wishlist: CourseSnippet[];
}

const initialState: CartState = {
  cartItems: [],
  wishlist: [],
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CourseSnippet>) => {
      if (!state.cartItems.find(item => item.id === action.payload.id)) {
        state.cartItems.push(action.payload);
      }
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.cartItems = state.cartItems.filter(item => item.id !== action.payload);
    },
    addToWishlist: (state, action: PayloadAction<CourseSnippet>) => {
      if (!state.wishlist.find(item => item.id === action.payload.id)) {
        state.wishlist.push(action.payload);
      }
    },
    removeFromWishlist: (state, action: PayloadAction<string>) => {
      state.wishlist = state.wishlist.filter(item => item.id !== action.payload);
    },
    clearCart: (state) => {
      state.cartItems = [];
    }
  },
});

export const { addToCart, removeFromCart, addToWishlist, removeFromWishlist, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
