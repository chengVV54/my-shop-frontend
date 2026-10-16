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

/** 我的换物申请列表：GET /api/barters，需要 Authorization: Bearer <token> */
export function getBarters() {
  return request.get<ApiResult<BarterRequest[]>>('/barters')
}
