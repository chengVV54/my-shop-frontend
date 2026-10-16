/**
 * 换物申请相关类型。
 *
 * 从 `types/item.ts` 拆出：换物是独立于「物品」的业务实体，
 * 后续「我的换物」列表（GET /api/barters）也复用这里的类型。
 */

/** 换物申请状态：待处理 / 已接受 / 已拒绝 / 已完成 / 已取消 */
export type BarterStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'DONE' | 'CANCELLED'

/**
 * 换物申请（后端 `BarterRequestVO`）：用 `fromItem` 换 `toItem`。
 *
 * 方向约定：`from*` 是「我提供的」，`to*` 是「我想换的」，
 * 与 `POST /api/barters` 的请求体字段（`fromItemId` / `toItemId`）保持一致。
 */
export interface BarterRequest {
  id: number
  /** 发起人（提供物品的一方） */
  fromUserId: number
  /** 被申请人（目标物品的拥有者） */
  toUserId: number
  /** 发起人提供的物品 ID */
  fromItemId: number
  /** 发起人想换的物品 ID */
  toItemId: number
  /** 留言，选填，后端限制 ≤500 字 */
  message?: string
  /** 差价：正数表示发起人需补差价，由后端计算 */
  priceDiff: number
  status: BarterStatus
  createdAt: string
}

/** 发起换物申请的请求体（POST /api/barters） */
export interface BarterApplyPayload {
  /** 我想换的物品 ID（目标物品，必填） */
  toItemId: number
  /** 我提供的物品 ID（必填，必须是自己的在架物品） */
  fromItemId: number
  /** 留言，选填，≤500 */
  message?: string
}
