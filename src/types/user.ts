/**
 * 用户相关类型。
 *
 * 对应后端 `UserVO` 与 `POST /api/auth/login` 的返回体 `LoginResponse`。
 * 这里的字段是「展示用」的：前端只据此渲染界面，
 * 真正的身份与权限判断始终由后端根据 token 完成（见 docs/SECURITY.md 1.3）。
 */

/** 后端返回的用户信息（UserVO） */
export interface User {
  id: number
  username: string
  avatar?: string
  credit: number
  createdAt?: string
}

/** 登录接口返回体 */
export interface LoginResponse {
  token: string
  user: User
}
