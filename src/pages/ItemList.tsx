import type { FC } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Col,
  Empty,
  Pagination,
  Row,
  Segmented,
  Select,
  Space,
  Spin,
  Typography,
  message,
} from 'antd'

import request from '@/api/request'
import ItemCard from '@/components/ItemCard'
import type { ApiResult, Item, ItemCategory, ItemCondition, ItemMode } from '@/types'
import { ITEM_CATEGORIES, ITEM_CONDITIONS, getCategoryLabel, getConditionLabel } from '@/utils/item'

const { Title, Text } = Typography

/** 筛选栏取值：ALL 表示不限（模式 ALL 额外包含 BARTER 与 SALE） */
type ModeFilter = ItemMode | 'ALL'
type CategoryFilter = ItemCategory | 'ALL'
type ConditionFilter = ItemCondition | 'ALL'
type SortKey = 'LATEST' | 'PRICE_ASC' | 'PRICE_DESC'

const MODE_OPTIONS: { label: string; value: ModeFilter }[] = [
  { label: '全部', value: 'ALL' },
  { label: '换物', value: 'BARTER' },
  { label: '二手', value: 'SALE' },
]

const CATEGORY_OPTIONS: { label: string; value: CategoryFilter }[] = [
  { label: '全部分类', value: 'ALL' },
  ...ITEM_CATEGORIES.map((category) => ({
    label: getCategoryLabel(category),
    value: category as CategoryFilter,
  })),
]

const CONDITION_OPTIONS: { label: string; value: ConditionFilter }[] = [
  { label: '全部成色', value: 'ALL' },
  ...ITEM_CONDITIONS.map((condition) => ({
    label: getConditionLabel(condition),
    value: condition as ConditionFilter,
  })),
]

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: '最新', value: 'LATEST' },
  { label: '价格从低到高', value: 'PRICE_ASC' },
  { label: '价格从高到低', value: 'PRICE_DESC' },
]

/** 每页条数 */
const PAGE_SIZE = 12

/** 响应式栅格：手机 1 列 / 平板 2 列 / 电脑 3 列 / 大屏 4 列 */
const COL_SPAN = { xs: 24, sm: 12, md: 8, lg: 6 }

/** `?category=BOOK` 里的值需要是合法分类才采纳 */
const toCategoryFilter = (value: string | null): CategoryFilter =>
  value && (ITEM_CATEGORIES as string[]).includes(value) ? (value as ItemCategory) : 'ALL'

/** createdAt → 时间戳；无法解析时按 0 处理，保持原顺序 */
const toTime = (createdAt: string): number => {
  const time = Date.parse(createdAt)
  return Number.isNaN(time) ? 0 : time
}

/** 价格比较：没有价格的纯换物物品永远排在最后 */
const comparePrice = (a: Item, b: Item, direction: number): number => {
  const priceA = Number.isFinite(a.price) ? (a.price as number) : null
  const priceB = Number.isFinite(b.price) ? (b.price as number) : null

  if (priceA === null && priceB === null) {
    return 0
  }
  if (priceA === null) {
    return 1
  }
  if (priceB === null) {
    return -1
  }
  return (priceA - priceB) * direction
}

/** 前端排序：最新按时间倒序，价格排序按方向，无价格的垫底 */
const sortItems = (items: Item[], sortKey: SortKey): Item[] => {
  const sorted = [...items]

  if (sortKey === 'LATEST') {
    sorted.sort((a, b) => toTime(b.createdAt) - toTime(a.createdAt))
    return sorted
  }

  const direction = sortKey === 'PRICE_ASC' ? 1 : -1
  sorted.sort((a, b) => comparePrice(a, b, direction))
  return sorted
}

/**
 * 物品列表页。
 *
 * 筛选（模式 / 分类 / 成色）+ 排序 + 分页全部在前端完成：
 * 页面只请求一次 `GET /api/items`（全部模式），避免每次切换条件都打后端。
 * 首页「热门分类」入口通过 `?category=XXX` 带入初始分类。
 */
const ItemList: FC = () => {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [mode, setMode] = useState<ModeFilter>('ALL')
  const [searchParams] = useSearchParams()
  const [category, setCategory] = useState<CategoryFilter>(() =>
    toCategoryFilter(searchParams.get('category')),
  )
  const [condition, setCondition] = useState<ConditionFilter>('ALL')
  const [sortKey, setSortKey] = useState<SortKey>('LATEST')
  const [page, setPage] = useState<number>(1)
  const [messageApi, contextHolder] = message.useMessage()

  // 只接受最后一次请求的结果，避免旧响应覆盖新数据
  const requestIdRef = useRef<number>(0)

  const fetchItems = useCallback(async (): Promise<void> => {
    requestIdRef.current += 1
    const requestId = requestIdRef.current

    setLoading(true)
    try {
      // request.ts 的拦截器返回的是后端的包装体 { code, message, data }
      const res = await request.get<ApiResult<Item[]>>('/items')

      if (requestId !== requestIdRef.current) {
        return
      }

      if (!res || res.code !== 200) {
        throw new Error(res?.message || `接口返回异常：code=${res?.code}`)
      }

      setItems(Array.isArray(res.data) ? res.data : [])
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return
      }

      const detail = error instanceof Error ? error.message : String(error)
      messageApi.error(`物品列表加载失败：${detail}`)
      setItems([])
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [messageApi])

  useEffect(() => {
    void fetchItems()
  }, [fetchItems])

  // 首页分类入口跳转过来时（/items?category=BOOK），同步筛选条件
  useEffect(() => {
    const nextCategory = toCategoryFilter(searchParams.get('category'))
    if (nextCategory !== 'ALL') {
      setCategory(nextCategory)
      setPage(1)
    }
  }, [searchParams])

  /** 模式过滤：换物 = BARTER | BOTH，二手 = SALE | BOTH */
  const filtered = items.filter((item) => {
    const modeMatched =
      mode === 'ALL' ||
      item.mode === mode ||
      (item.mode === 'BOTH' && (mode === 'BARTER' || mode === 'SALE'))
    const categoryMatched = category === 'ALL' || item.category === category
    const conditionMatched = condition === 'ALL' || item.condition === condition
    return modeMatched && categoryMatched && conditionMatched
  })

  const sorted = sortItems(filtered, sortKey)
  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  /** 条件变化导致总页数变少时，用安全页码兜底，避免出现空白页 */
  const safePage = Math.min(page, totalPages)
  const pageItems = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const isEmpty = !loading && total === 0

  /**
   * 筛选条件变化时统一回到第 1 页。
   * 这里只改状态，不做数据请求——数据已在前端，无需重新拉取。
   */
  const resetPage = (): void => setPage(1)

  return (
    <div>
      {contextHolder}

      <Title level={3} style={{ marginBottom: 4 }}>
        逛一逛
      </Title>
      <Text type="secondary">换物为主，二手为辅</Text>

      <Space size={12} wrap style={{ margin: '16px 0 24px' }} align="center">
        <Segmented<ModeFilter>
          options={MODE_OPTIONS}
          value={mode}
          onChange={(value) => {
            setMode(value)
            resetPage()
          }}
        />

        <Select<CategoryFilter>
          value={category}
          options={CATEGORY_OPTIONS}
          style={{ width: 140 }}
          onChange={(value) => {
            setCategory(value)
            resetPage()
          }}
        />

        <Select<ConditionFilter>
          value={condition}
          options={CONDITION_OPTIONS}
          style={{ width: 140 }}
          onChange={(value) => {
            setCondition(value)
            resetPage()
          }}
        />

        <Select<SortKey>
          value={sortKey}
          options={SORT_OPTIONS}
          style={{ width: 160 }}
          onChange={(value) => {
            setSortKey(value)
            resetPage()
          }}
        />

        {!loading && <Text type="secondary">共 {total} 件</Text>}
      </Space>

      <Spin spinning={loading}>
        {isEmpty ? (
          <Empty description="没有符合条件的物品" style={{ padding: '64px 0' }} />
        ) : (
          <Row gutter={[16, 16]}>
            {pageItems.map((item) => (
              <Col key={item.id} {...COL_SPAN}>
                <ItemCard item={item} />
              </Col>
            ))}
          </Row>
        )}
      </Spin>

      {!isEmpty && total > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <Pagination
            current={safePage}
            pageSize={PAGE_SIZE}
            total={total}
            showSizeChanger={false}
            onChange={(nextPage) => setPage(nextPage)}
          />
        </div>
      )}
    </div>
  )
}

export default ItemList
