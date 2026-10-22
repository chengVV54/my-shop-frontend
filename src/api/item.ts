import request from './request'

import type { ApiResult, CreateItemPayload, Item } from '@/types'

/**
 * 物品接口。
 *
 * 统一走 `request`（baseURL 已是 `/api`，因此路径省略 `/api` 前缀），
 * token 由 request.ts 的请求拦截器自动注入，业务代码不手写 Authorization。
 * 返回值是后端包装体 `{ code, message, data }`，调用方需自行判断 `code`。
 *
 * 已知失败码（最终判断在后端，前端只做提示）：
 * - 401 未登录 / token 失效（拦截器会清除本地登录态）
 * - 400 入参不合法（如 SALE / BOTH 缺少 price、mode 取值非法、标题为空）；
 *   下架时还会表示「物品已被锁定或完成」
 * - 403 下架时表示越权（不是自己的物品）；404 下架时表示物品不存在
 */

/**
 * 发布物品：POST /api/items，需要 Authorization: Bearer <token>。
 *
 * 请求体里**没有 `ownerId`**：发布者由后端从 JWT 中解析，前端即使传了也会被忽略，
 * 避免伪造他人发布。成功后返回新建的物品（含数据库自增 `id`），
 * 页面据此跳转到 `/items/{id}` 详情页。
 */
export function createItem(data: CreateItemPayload) {
  return request.post<ApiResult<Item>>('/items', data)
}

/**
 * 下架物品（软删除）：DELETE /api/items/{id}，需要 Authorization: Bearer <token>。
 *
 * 后端只把 `status` 改成 `REMOVED`，**不删除数据库行**：物品可能已被换物申请 / 订单引用，
 * 物理删除会让关联记录指向不存在的 id。因此下架后详情接口仍能查到这条记录（状态为已下架）。
 *
 * 响应 `data` 为 `null`（后端是 `Result<Void>`），调用方只需判断 `code === 200`。
 *
 * 已知失败（最终判断在后端，前端只做提示）：
 * - 401 未登录 / token 失效（HTTP 401，拦截器会清除本地登录态）
 * - 404 物品不存在
 * - 403 只能下架自己的物品（越权）
 * - 400 物品状态不是 `AVAILABLE`（已被锁定 / 已完成，无法下架）
 *
 * 注意：除 401 外，这些业务失败是**HTTP 200 + 包装体 `code` 非 200**，
 * 所以调用方必须判断 `res.code`，不能只看 HTTP 状态码。
 */
export function deleteItem(id: number) {
  return request.delete<ApiResult<null>>(`/items/${id}`)
}
