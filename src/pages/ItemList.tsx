import type { FC } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Col, Empty, Row, Segmented, Spin, Typography, message } from 'antd'

import request from '@/api/request'
import ItemCard from '@/components/ItemCard'
import type { ApiResult, Item, ItemMode } from '@/types'

const { Title, Text } = Typography

/** 筛选栏取值：ALL 表示不传 mode 参数 */
type ModeFilter = ItemMode | 'ALL'

const FILTER_OPTIONS: { label: string; value: ModeFilter }[] = [
  { label: '全部', value: 'ALL' },
  { label: '换物', value: 'BARTER' },
  { label: '二手', value: 'SALE' },
]

/** 响应式栅格：手机 1 列 / 平板 2 列 / 电脑 3 列 / 大屏 4 列 */
const COL_SPAN = { xs: 24, sm: 12, md: 8, lg: 6 }

/**
 * 物品列表页。
 *
 * 顶部按交易模式筛选（全部 / 换物 / 二手），下方为响应式卡片网格。
 */
const ItemList: FC = () => {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [mode, setMode] = useState<ModeFilter>('ALL')
  const [messageApi, contextHolder] = message.useMessage()

  // 只接受最后一次请求的结果，避免快速切换筛选时旧响应覆盖新数据
  const requestIdRef = useRef<number>(0)

  const fetchItems = useCallback(
    async (current: ModeFilter): Promise<void> => {
      requestIdRef.current += 1
      const requestId = requestIdRef.current

      setLoading(true)
      try {
        // request.ts 的拦截器返回的是后端的包装体 { code, message, data }
        const res = await request.get<ApiResult<Item[]>>('/items', {
          params: current === 'ALL' ? {} : { mode: current },
        })

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
    },
    [messageApi],
  )

  useEffect(() => {
    void fetchItems(mode)
  }, [fetchItems, mode])

  const isEmpty = !loading && items.length === 0

  return (
    <div>
      {contextHolder}

      <Title level={3} style={{ marginBottom: 4 }}>
        逛一逛
      </Title>
      <Text type="secondary">换物为主，二手为辅</Text>

      <div style={{ margin: '16px 0 24px' }}>
        <Segmented<ModeFilter>
          options={FILTER_OPTIONS}
          value={mode}
          onChange={(value) => setMode(value)}
        />
      </div>

      <Spin spinning={loading}>
        {isEmpty ? (
          <Empty
            description={mode === 'ALL' ? '还没有人发布物品' : '这个分类下暂时没有物品'}
            style={{ padding: '64px 0' }}
          />
        ) : (
          <Row gutter={[16, 16]}>
            {items.map((item) => (
              <Col key={item.id} {...COL_SPAN}>
                <ItemCard item={item} />
              </Col>
            ))}
          </Row>
        )}
      </Spin>
    </div>
  )
}

export default ItemList
