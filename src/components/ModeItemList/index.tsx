import type { FC } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Col, Empty, Row, Spin, Typography, message } from 'antd'

import request from '@/api/request'
import ItemCard from '@/components/ItemCard'
import type { ApiResult, Item, ItemMode } from '@/types'

const { Title, Text } = Typography

/** 响应式栅格：手机 1 列 / 平板 2 列 / 电脑 3 列 / 大屏 4 列 */
const COL_SPAN = { xs: 24, sm: 12, md: 8, lg: 6 }

interface ModeItemListProps {
  /** 页面标题 */
  title: string
  /** 页面副标题 */
  subtitle: string
  /** 需要展示的交易模式：BOTH（都可）在换物与二手两个入口都会出现 */
  modes: ItemMode[]
  /** 空态文案 */
  emptyText: string
}

/**
 * 按交易模式过滤的物品网格（换物页 / 二手页共用）。
 *
 * 后端 `GET /api/items` 只支持单一 mode 过滤，而「换物」「二手」两个入口
 * 都需要同时包含 `BOTH`，因此这里一次性拉取全部物品后在前端过滤，
 * 避免发两次请求再合并去重。
 */
const ModeItemList: FC<ModeItemListProps> = ({ title, subtitle, modes, emptyText }) => {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [messageApi, contextHolder] = message.useMessage()

  // 只接受最后一次请求的结果，避免组件重挂载等场景下旧响应覆盖新数据
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

  /** 前端过滤：换物 = BARTER | BOTH，二手 = SALE | BOTH */
  const filtered = items.filter((item) => modes.includes(item.mode))
  const isEmpty = !loading && filtered.length === 0

  return (
    <div>
      {contextHolder}

      <Title level={3} style={{ marginBottom: 4 }}>
        {title}
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        {subtitle}
      </Text>

      <Spin spinning={loading}>
        {isEmpty ? (
          <Empty description={emptyText} style={{ padding: '64px 0' }} />
        ) : (
          <Row gutter={[16, 16]}>
            {filtered.map((item) => (
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

export default ModeItemList
