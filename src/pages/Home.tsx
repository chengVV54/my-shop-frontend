import type { FC } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Col, Empty, Grid, Row, Space, Spin, Typography, theme } from 'antd'
import { RocketOutlined, SwapOutlined } from '@ant-design/icons'

import request from '@/api/request'
import ItemCard from '@/components/ItemCard'
import type { ApiResult, Item, ItemCategory } from '@/types'
import { getCategoryLabel } from '@/utils/item'

const { Title, Paragraph, Text } = Typography

/** 首页最多展示的最新物品条数（桌面一行 4 张，共 2 行） */
const LATEST_LIMIT = 8

/** 响应式栅格，与列表页保持一致 */
const COL_SPAN = { xs: 24, sm: 12, md: 8, lg: 6 }

/** 热门分类入口：emoji + 中文名，中文名统一取 utils/item.ts 的映射 */
const HOT_CATEGORIES: { key: ItemCategory; emoji: string }[] = [
  { key: 'CAMERA', emoji: '📷' },
  { key: 'BOOK', emoji: '📚' },
  { key: 'INSTRUMENT', emoji: '🎸' },
  { key: 'GAME', emoji: '🎮' },
  { key: 'PHONE', emoji: '📱' },
  { key: 'COMPUTER', emoji: '💻' },
  { key: 'CLOTHING', emoji: '👕' },
  { key: 'OTHER', emoji: '📦' },
]

/**
 * 首页。
 *
 * 结构：Hero 区（发布 / 去逛逛入口）→ 热门分类 → 最新发布（8 件 + 查看全部）。
 */
const Home: FC = () => {
  const navigate = useNavigate()
  const { token } = theme.useToken()
  const screens = Grid.useBreakpoint()

  /** md 以下视为手机：Hero 区内边距与标题字号同步收窄 */
  const isMobile = !screens.md

  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  /** 首页只是「顺带展示」最新物品，失败时静默降级为空列表，不打断主流程 */
  const fetchLatest = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const res = await request.get<ApiResult<Item[]>>('/items')

      if (!res || res.code !== 200 || !Array.isArray(res.data)) {
        throw new Error(res?.message || `接口返回异常：code=${res?.code}`)
      }

      setItems(res.data.slice(0, LATEST_LIMIT))
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchLatest()
  }, [fetchLatest])

  return (
    <Space direction="vertical" size={isMobile ? 24 : 32} style={{ width: '100%' }}>
      <Card
        styles={{ body: { padding: isMobile ? '32px 16px' : '48px 32px' } }}
        style={{
          textAlign: 'center',
          borderRadius: token.borderRadiusLG,
          background: `linear-gradient(135deg, ${token.colorPrimaryBg} 0%, ${token.colorBgContainer} 100%)`,
        }}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Title level={isMobile ? 2 : 1} style={{ marginBottom: 0 }}>
            让闲置流动起来
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 0, fontSize: isMobile ? 14 : 16 }}>
            换物为主，二手为辅
          </Paragraph>
          <Space size={12} wrap style={{ justifyContent: 'center' }}>
            <Button
              type="primary"
              size="large"
              icon={<RocketOutlined />}
              onClick={() => navigate('/publish')}
            >
              发布闲置
            </Button>
            <Button size="large" icon={<SwapOutlined />} onClick={() => navigate('/items')}>
              去逛逛
            </Button>
          </Space>
        </Space>
      </Card>

      <div>
        <Title level={4} style={{ margin: '0 0 16px' }}>
          热门分类
        </Title>

        <Row gutter={[16, 16]}>
          {HOT_CATEGORIES.map((category) => (
            <Col key={category.key} xs={12} sm={8} md={6} lg={3}>
              <Card
                hoverable
                onClick={() => navigate(`/items?category=${category.key}`)}
                styles={{ body: { padding: '16px 8px', textAlign: 'center' } }}
                style={{ borderRadius: token.borderRadiusLG, cursor: 'pointer' }}
              >
                <Space direction="vertical" size={4}>
                  <span style={{ fontSize: 32, lineHeight: 1.2 }} aria-hidden>
                    {category.emoji}
                  </span>
                  <Text>{getCategoryLabel(category.key)}</Text>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <div>
        <Title level={4} style={{ margin: '0 0 16px' }}>
          最新发布
        </Title>

        <Spin spinning={loading}>
          {items.length === 0 && !loading ? (
            <Empty description="还没有人发布物品，来发布第一件吧" style={{ padding: '32px 0' }}>
              <Button type="primary" onClick={() => navigate('/publish')}>
                发布闲置
              </Button>
            </Empty>
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

        {!loading && items.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Button size="large" onClick={() => navigate('/items')}>
              查看全部
            </Button>
          </div>
        )}
      </div>
    </Space>
  )
}

export default Home
