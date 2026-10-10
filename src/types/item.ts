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

/** 换物申请状态 */
export type BarterStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'DONE' | 'CANCELLED'

/** 换物申请：fromItem 换 toItem */
export interface BarterRequest {
  id: number
  fromUserId: number
  toUserId: number
  fromItemId: number
  toItemId: number
  message: string
  priceDiff: number
  status: BarterStatus
  createdAt: string
}

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
