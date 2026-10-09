import { create } from 'zustand'

import type { Product } from '@/types/product'

interface CartState {
  items: Product[]
  add: (product: Product) => void
  remove: (id: number) => void
  clear: () => void
}

export const useCartStore = create<CartState>((set) => ({
  items: [],

  add: (product: Product) =>
    set((state) => ({
      items: [...state.items, product],
    })),

  remove: (id: number) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),

  clear: () => set({ items: [] }),
}))
