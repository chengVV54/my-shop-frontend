export * from './item'
export * from './barter'
export * from './user'

/**
 * 后端统一响应包装体：{ "code": 200, "message": "success", "data": ... }
 *
 * 注意：src/api/request.ts 的响应拦截器返回的是 axios 的 res.data，
 * 也就是这个包装体本身，所以调用方需要自己判断 code 并取 data。
 */
export interface ApiResult<T> {
  code: number
  message: string
  data: T
}
