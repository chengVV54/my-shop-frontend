/** 物品交易模式：换物 / 二手 / 都可 */
export type ItemMode = 'BARTER' | 'SALE' | 'BOTH'

/** 物品成色 */
export type ItemCondition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'POOR'

/** 物品分类 */
export type ItemCategory =
  | 'CAMERA'
  | 'BOOK'
  | 'INSTRUMENT'
  | 'GAME'
  | 'PHONE'
  | 'COMPUTER'
  | 'CLOTHING'
  | 'OTHER'

/** 物品状态：在架 / 锁定 / 已完成 / 已下架 */
export type ItemStatus = 'AVAILABLE' | 'LOCKED' | 'DONE' | 'REMOVED'

/** 物品（换物 + 二手共用的核心实体） */
export interface Item {
  id: number
  title: string
  images: string[]
  description: string
  category: ItemCategory
  condition: ItemCondition
  ownerId: number
  mode: ItemMode
  /** 仅 SALE / BOTH 有价格 */
  price?: number
  /** 仅 BARTER / BOTH 有想换的分类 */
  wantCategories?: ItemCategory[]
  /** 仅 BARTER / BOTH 有想换的补充说明 */
  wantDescription?: string
  /** 是否接受补差价 */
  allowPriceDiff?: boolean
  status: ItemStatus
  createdAt: string
}

/**
 * POST /api/items 的请求体。
 *
 * 只描述「物品本身」：发布者 `ownerId`、`status`、`createdAt` 都刻意不在请求体里，
 * 由后端从登录态和数据库生成，前端无法伪造。
 *
 * `price` 与 `wantCategories` 按 `mode` 互斥：
 * - `SALE`：只传 `price`，不传换物偏好；
 * - `BARTER`：只传换物偏好，不传 `price`；
 * - `BOTH`：两者都传。
 * 页面提交前会按 mode 清洗成这个形状（见 `PublishItem` 的 `buildCreatePayload`）。
 */
export interface CreateItemPayload {
  title: string
  description?: string
  category: ItemCategory
  condition: ItemCondition
  mode: ItemMode
  /** 仅 SALE / BOTH 传，BARTER 不传 */
  price?: number
  /** 仅 BARTER / BOTH 传 */
  wantCategories?: ItemCategory[]
  /** 仅 BARTER / BOTH 传 */
  wantDescription?: string
  /** 仅 BARTER / BOTH 传 */
  allowPriceDiff?: boolean
}

// 换物申请相关类型（BarterStatus / BarterRequest）已拆到 `types/barter.ts`，
// 经 `types/index.ts` 统一导出，这里不再重复定义，避免同名导出冲突。

/** 二手订单状态 */
export type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'DONE' | 'CANCELLED'

/** 二手订单 */
export interface Order {
  id: number
  buyerId: number
  sellerId: number
  itemId: number
  price: number
  address: string
  status: OrderStatus
  createdAt: string
}
