import { create } from 'zustand'

import type { Item } from '@/types'
import { isPurchasable } from '@/utils/cart'

interface CartState {
  items: Item[]
  add: (item: Item) => void
  remove: (id: number) => void
  clear: () => void
}

/**
 * 购物车。
 *
 * 只有支持二手的物品（SALE / BOTH）才能加入购物车，
 * 纯换物物品需要通过「发起换物」流程处理。
 */
export const useCartStore = create<CartState>((set) => ({
  items: [],

  add: (item: Item) =>
    set((state) => {
      if (!isPurchasable(item)) {
        return state
      }
      if (state.items.some((existing) => existing.id === item.id)) {
        return state
      }
      return { items: [...state.items, item] }
    }),

  remove: (id: number) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),

  clear: () => set({ items: [] }),
}))
