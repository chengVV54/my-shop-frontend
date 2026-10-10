import type { Item } from '@/types/item'

/**
 * 物品是否支持直接下单购买。
 *
 * 只有二手（SALE）和都可（BOTH）才挂价格、可以加入购物车；
 * 纯换物（BARTER）只能走换物申请流程。
 */
export function isPurchasable(item: Pick<Item, 'mode'>): boolean {
  return item.mode === 'SALE' || item.mode === 'BOTH'
}
