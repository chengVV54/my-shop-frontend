import axios from 'axios'
import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'

import { useUserStore } from '@/store/useUserStore'

/**
 * axios 实例。
 *
 * baseURL 为 "/api"，开发环境由 vite.config.ts 中的 server.proxy
 * 转发到后端 http://localhost:8080。
 */
const instance: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

instance.interceptors.request.use(
  // 统一注入鉴权头：token 存在时自动带 Authorization: Bearer <token>。
  // 业务代码不得手写该请求头（见 docs/SECURITY.md 1.2）。
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const { token } = useUserStore.getState()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError): Promise<never> => Promise.reject(error),
)

instance.interceptors.response.use(
  // 响应拦截器直接返回 res.data，调用方拿到的就是业务数据
  (response: AxiosResponse) => response.data,
  (error: AxiosError): Promise<never> => {
    // 401：未登录或 token 已失效（过期 / 被后端撤销）。
    // 清除本地登录态，回到未登录；这里**不自动跳转**，
    // 交由页面决定（登录页需要留在原地展示错误，其他页面可自行引导去登录）。
    if (error.response?.status === 401) {
      useUserStore.getState().logout()
    }
    return Promise.reject(error)
  },
)

/**
 * 解包后的请求接口。
 *
 * 因为上面的响应拦截器已经把 AxiosResponse 换成了 res.data，
 * 运行时返回值和 axios 自带的类型声明不一致，所以用这个接口描述真实行为：
 * `request.get<ApiResult<Item[]>>('/items')` 的返回值就是 `Promise<ApiResult<Item[]>>`，
 * 调用方不需要再写 `res.data`，也不需要做类型断言。
 */
export interface Request {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>
}

/** 目前 axios 的类型声明无法表达"拦截器改写返回值"，这里做一次集中收敛 */
const request = instance as unknown as Request

/** 需要访问拦截器 / defaults 等原始能力时使用 */
export { instance as axiosInstance }

export default request
