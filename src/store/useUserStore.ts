import { create } from 'zustand'

import type { User } from '@/types'

/**
 * localStorage 键名。
 *
 * 只登记两个键：`token`（后端签发的凭证）与 `user`（非敏感的用户展示信息缓存）。
 * 新增键名需同步更新 docs/SECURITY.md 1.2；密码一律不入 storage。
 */
const TOKEN_KEY = 'token'
const USER_KEY = 'user'

interface UserState {
  /** 当前登录用户；null 表示未登录 */
  user: User | null
  /** 登录凭证 */
  token: string | null
  /** 登录成功后写入状态与 localStorage */
  login: (user: User, token: string) => void
  /** 退出登录：清空状态与 localStorage */
  logout: () => void
  /** 应用启动时从 localStorage 恢复登录态 */
  init: () => void
}

/** 本地缓存只信任基本结构，字段不符时按「缓存损坏」处理 */
const isUser = (value: unknown): value is User => {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Partial<User>
  return typeof candidate.id === 'number' && typeof candidate.username === 'string'
}

/**
 * 登录态。
 *
 * 安全约定（见 docs/SECURITY.md）：
 * - 只持久化 token 与非敏感的用户展示字段，**不保存密码**；
 * - `user` 仅用于渲染（头像、用户名），是显示缓存，不是权限依据；
 * - 必须以服务端为准时调用 `api/auth.ts` 的 `getCurrentUser()` 重新拉取。
 */
export const useUserStore = create<UserState>((set) => ({
  user: null,
  token: null,

  login: (user, token) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    set({ user, token })
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    set({ user: null, token: null })
  },

  init: () => {
    const token = localStorage.getItem(TOKEN_KEY)
    const userStr = localStorage.getItem(USER_KEY)
    if (!token || !userStr) {
      return
    }
    try {
      const parsed: unknown = JSON.parse(userStr)
      if (!isUser(parsed)) {
        throw new Error('本地用户缓存结构不合法')
      }
      set({ user: parsed, token })
    } catch {
      // 缓存损坏（非法 JSON 或字段缺失）：直接清掉，回到未登录状态
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    }
  },
}))
