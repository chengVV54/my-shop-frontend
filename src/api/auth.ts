import request from './request'

import type { ApiResult, LoginResponse, User } from '@/types'

/**
 * 用户鉴权接口。
 *
 * 统一走 `request`（baseURL 已是 `/api`，因此路径省略 `/api` 前缀），
 * token 由 request.ts 的请求拦截器自动注入，业务代码不手写 Authorization。
 * 返回值是后端包装体 `{ code, message, data }`，调用方需自行判断 `code`。
 */

/** 注册：POST /api/auth/register */
export function register(data: { username: string; password: string }) {
  return request.post<ApiResult<User>>('/auth/register', data)
}

/** 登录：POST /api/auth/login，成功返回 token 与用户信息 */
export function login(data: { username: string; password: string }) {
  return request.post<ApiResult<LoginResponse>>('/auth/login', data)
}

/** 获取当前登录用户：GET /api/auth/me，需要 Authorization: Bearer <token> */
export function getCurrentUser() {
  return request.get<ApiResult<User>>('/auth/me')
}
