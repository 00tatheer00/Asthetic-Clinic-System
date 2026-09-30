import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@/lib/types';

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item: CartItem) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) => i.product_id === item.product_id
          );

          if (existingIndex >= 0) {
            // Update quantity if already in cart
            const updated = [...state.items];
            const newQty = updated[existingIndex].quantity + item.quantity;
            updated[existingIndex] = {
              ...updated[existingIndex],
              quantity: Math.min(newQty, item.available_stock),
            };
            return { items: updated };
          }

          // Add new item
          return { items: [...state.items, item] };
        });
      },

      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter((i) => i.product_id !== productId),
        }));
      },

      updateQuantity: (productId: string, quantity: number) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.product_id === productId
              ? { ...item, quantity: Math.max(1, Math.min(quantity, item.available_stock)) }
              : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce(
          (sum, item) => sum + item.unit_price * item.quantity,
          0
        );
      },
    }),
    {
      name: 'brimish-cart',
      // Only persist items, not methods
      partialize: (state) => ({ items: state.items }),
    }
  )
);
