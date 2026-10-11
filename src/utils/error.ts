import axios from 'axios'

/**
 * 从请求异常中提取可展示给用户的提示文案。
 *
 * `request.ts` 的响应拦截器会把错误原样抛出（`AxiosError`），
 * 后端失败时响应体里带有 `{ code, message }`，优先使用后端 message；
 * 没有响应体（网络中断）或超时的情况给出固定的中文提示。
 *
 * 约定：后端返回的 message 属于不可信数据，这里只按纯文本返回，
 * 由调用方通过 antd message 渲染（React 文本插值，默认转义）。
 */
export function getErrorMessage(error: unknown, fallback = '操作失败，请稍后重试'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: unknown } | undefined
    const backendMessage = data?.message
    if (typeof backendMessage === 'string' && backendMessage.trim()) {
      return backendMessage
    }
    if (error.code === 'ECONNABORTED') {
      return '请求超时，请稍后重试'
    }
    if (!error.response) {
      return '网络异常，请检查网络后重试'
    }
    return fallback
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}
