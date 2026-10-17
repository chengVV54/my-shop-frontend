import type { BarterStatus } from '@/types'

/**
 * 换物申请状态 → 中文文案。
 *
 * 与后端 `BarterStatus` 一一对应；用 `Record` 约束，新增枚举值时
 * TypeScript 会在这里报错，避免页面出现「未知状态」。
 */
const BARTER_STATUS_LABEL: Record<BarterStatus, string> = {
  PENDING: '待处理',
  ACCEPTED: '已接受',
  REJECTED: '已拒绝',
  DONE: '已完成',
  CANCELLED: '已取消',
}

/**
 * 换物申请状态 → antd Tag 颜色。
 *
 * 待处理橙色（需要用户关注）、已接受绿色（正向结果）、
 * 已拒绝红色（负向结果）、其余用中性色，避免列表过于花哨。
 */
const BARTER_STATUS_COLOR: Record<BarterStatus, string> = {
  PENDING: 'orange',
  ACCEPTED: 'green',
  REJECTED: 'red',
  DONE: 'blue',
  CANCELLED: 'default',
}

/** 换物状态中文名 */
export function getBarterStatusLabel(status: BarterStatus): string {
  return BARTER_STATUS_LABEL[status] ?? status
}

/** 换物状态对应的 Tag 颜色 */
export function getBarterStatusColor(status: BarterStatus): string {
  return BARTER_STATUS_COLOR[status] ?? 'default'
}

/**
 * 格式化换物时间。
 *
 * 后端返回格式为 `YYYY-MM-DD HH:mm:ss`：只展示到分钟，列表里更清爽；
 * 解析失败时原样返回，避免把后端数据吞掉。Safari 不接受
 * `YYYY-MM-DD HH:mm:ss` 这种写法，所以先把 `-` 换成 `/` 再交给 `Date`。
 */
export function formatBarterTime(createdAt: string): string {
  if (!createdAt) {
    return '-'
  }

  const time = new Date(createdAt.replace(/-/g, '/'))
  if (Number.isNaN(time.getTime())) {
    return createdAt
  }

  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${time.getFullYear()}-${pad(time.getMonth() + 1)}-${pad(time.getDate())} ${pad(
    time.getHours(),
  )}:${pad(time.getMinutes())}`
}
