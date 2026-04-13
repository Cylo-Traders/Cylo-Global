import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ICartItem, IProduct } from "@/lib/types";

interface CartStore {
  items: ICartItem[];
  addToCart: (product: IProduct) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getItemsByFarmer: () => Map<string, ICartItem[]>;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addToCart: (product: IProduct) => {
        const items = get().items;
        const existingItem = items.find((item) => item.id === product.id);

        if (existingItem) {
          set({
            items: items.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item,
            ),
          });
        } else {
          set({
            items: [...items, { ...product, quantity: 1 }],
          });
        }
      },

      removeFromCart: (productId: string) => {
        set({
          items: get().items.filter((item) => item.id !== productId),
        });
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }

        set({
          items: get().items.map((item) =>
            item.id === productId ? { ...item, quantity } : item,
          ),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0,
        );
      },

      getItemsByFarmer: () => {
        const grouped = new Map<string, ICartItem[]>();
        for (const item of get().items) {
          const key = item.farmer.wallet;
          const existing = grouped.get(key) || [];
          grouped.set(key, [...existing, item]);
        }
        return grouped;
      },
    }),
    {
      name: "cylo-cart",
    },
  ),
);
