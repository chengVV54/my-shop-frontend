import type { ItemCategory, ItemCondition, ItemMode, ItemStatus } from '@/types/item'

/** 交易模式 → 中文文案 */
const MODE_LABEL: Record<ItemMode, string> = {
  BARTER: '换物',
  SALE: '二手',
  BOTH: '都可',
}

/** 交易模式 → antd Tag 颜色 */
const MODE_COLOR: Record<ItemMode, string> = {
  BARTER: 'orange',
  SALE: 'blue',
  BOTH: 'green',
}

/** 分类 → 中文文案 */
const CATEGORY_LABEL: Record<ItemCategory, string> = {
  CAMERA: '相机',
  BOOK: '书籍',
  INSTRUMENT: '乐器',
  GAME: '游戏',
  PHONE: '手机',
  COMPUTER: '电脑',
  CLOTHING: '服饰',
  OTHER: '其他',
}

/** 成色 → 中文文案 */
const CONDITION_LABEL: Record<ItemCondition, string> = {
  NEW: '全新',
  LIKE_NEW: '几乎全新',
  GOOD: '成色良好',
  FAIR: '有使用痕迹',
  POOR: '明显磨损',
}

/** 物品状态 → 中文文案 */
const STATUS_LABEL: Record<ItemStatus, string> = {
  AVAILABLE: '在架',
  LOCKED: '交易中',
  DONE: '已完成',
  REMOVED: '已下架',
}

/** 物品状态 → antd Tag 颜色 */
const STATUS_COLOR: Record<ItemStatus, string> = {
  AVAILABLE: 'success',
  LOCKED: 'processing',
  DONE: 'default',
  REMOVED: 'default',
}

/** 分类展示顺序（供下拉框、标签组等场景复用） */
export const ITEM_CATEGORIES: ItemCategory[] = [
  'CAMERA',
  'BOOK',
  'INSTRUMENT',
  'GAME',
  'PHONE',
  'COMPUTER',
  'CLOTHING',
  'OTHER',
]

/** 成色展示顺序（由新到旧） */
export const ITEM_CONDITIONS: ItemCondition[] = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR']

/** 交易模式展示顺序 */
export const ITEM_MODES: ItemMode[] = ['BARTER', 'SALE', 'BOTH']

/** 换物 / 二手 / 都可 */
export function getModeLabel(mode: ItemMode): string {
  return MODE_LABEL[mode] ?? mode
}

/** 换物 → orange，二手 → blue，都可 → green */
export function getModeColor(mode: ItemMode): string {
  return MODE_COLOR[mode] ?? 'default'
}

/** 分类中文名 */
export function getCategoryLabel(category: ItemCategory): string {
  return CATEGORY_LABEL[category] ?? category
}

/** 成色中文名 */
export function getConditionLabel(condition: ItemCondition): string {
  return CONDITION_LABEL[condition] ?? condition
}

/** 物品状态中文名 */
export function getStatusLabel(status: ItemStatus): string {
  return STATUS_LABEL[status] ?? status
}

/** 物品状态对应的 Tag 颜色 */
export function getStatusColor(status: ItemStatus): string {
  return STATUS_COLOR[status] ?? 'default'
}

/**
 * 价格格式化。
 *
 * - 有有效价格：`¥399.00`
 * - 没有价格（纯换物）：空字符串，由调用方决定展示「换物」等文案
 * - 非法价格（NaN / 负数）：空字符串
 */
export function formatPrice(price?: number): string {
  if (price === undefined || price === null || !Number.isFinite(price) || price < 0) {
    return ''
  }
  return `¥${price.toFixed(2)}`
}
