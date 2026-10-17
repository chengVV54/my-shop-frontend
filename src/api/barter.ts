import request from './request'

import type { ApiResult, BarterApplyPayload, BarterRequest } from '@/types'

/**
 * 换物接口。
 *
 * 统一走 `request`（baseURL 已是 `/api`，因此路径省略 `/api` 前缀），
 * token 由 request.ts 的请求拦截器自动注入，业务代码不手写 Authorization。
 * 返回值是后端包装体 `{ code, message, data }`，调用方需自行判断 `code`。
 *
 * 已知失败码（最终判断在后端，前端只做提示）：
 * - 401 未登录 / token 失效（拦截器会清除本地登录态）
 * - 404 物品不存在
 * - 400 物品不可换 / 不能和自己换 / 已发起过换物申请
 * - 403 只能用自己的物品发起换物
 */

/** 发起换物申请：POST /api/barters，需要 Authorization: Bearer <token> */
export function createBarter(data: BarterApplyPayload) {
  return request.post<ApiResult<BarterRequest>>('/barters', data)
}

/**
 * 我的换物申请列表：GET /api/barters，需要 Authorization: Bearer <token>。
 *
 * `type` 用于区分视角：`from` 我发起的、`to` 我收到的、`all` 全部（不传等于 all）。
 * 方向由后端根据 token 里的当前用户判定，前端不需要传 userId。
 */
export function getBarters(params?: { type?: 'from' | 'to' | 'all' }) {
  return request.get<ApiResult<BarterRequest[]>>('/barters', { params })
}

/**
 * 换物申请详情：GET /api/barters/{id}，需要 Authorization: Bearer <token>。
 *
 * 只有申请的双方（发起方 / 接收方）可以查看，非当事人后端返回 HTTP 403；
 * 申请不存在返回 HTTP 404。前端据此分别展示「无权查看」和「换物申请不存在」。
 */
export function getBarterDetail(id: number) {
  return request.get<ApiResult<BarterRequest>>(`/barters/${id}`)
}

/**
 * 同意换物申请：PUT /api/barters/{id}/accept，需要 Authorization: Bearer <token>。
 *
 * 只有**接收方**（`toUserId`）能操作，且申请状态必须是 `PENDING`；
 * 非接收方返回 HTTP 403，状态不是待处理返回 HTTP 400。
 */
export function acceptBarter(id: number) {
  return request.put<ApiResult<BarterRequest>>(`/barters/${id}/accept`)
}

/**
 * 拒绝换物申请：PUT /api/barters/{id}/reject，需要 Authorization: Bearer <token>。
 *
 * 权限与状态约束与 `acceptBarter` 一致：仅接收方、仅 `PENDING` 状态可操作。
 */
export function rejectBarter(id: number) {
  return request.put<ApiResult<BarterRequest>>(`/barters/${id}/reject`)
}
