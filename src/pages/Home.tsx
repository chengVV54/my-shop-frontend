import type { FC } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Col, Empty, Row, Space, Spin, Typography, theme } from 'antd'
import { RocketOutlined, SwapOutlined } from '@ant-design/icons'

import request from '@/api/request'
import ItemCard from '@/components/ItemCard'
import type { ApiResult, Item } from '@/types'

const { Title, Paragraph, Text } = Typography

/** 首页最多展示的最新物品条数 */
const LATEST_LIMIT = 4

/** 响应式栅格，与列表页保持一致 */
const COL_SPAN = { xs: 24, sm: 12, md: 8, lg: 6 }

const Home: FC = () => {
  const navigate = useNavigate()
  const { token } = theme.useToken()

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
    <Space direction="vertical" size={32} style={{ width: '100%' }}>
      <Card
        styles={{ body: { padding: '48px 32px' } }}
        style={{
          textAlign: 'center',
          background: `linear-gradient(135deg, ${token.colorPrimaryBg} 0%, ${token.colorBgContainer} 100%)`,
        }}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Title level={1} style={{ marginBottom: 0 }}>
            让闲置流动起来
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 0, fontSize: 16 }}>
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
            <Button
              size="large"
              icon={<SwapOutlined />}
              onClick={() => navigate('/items')}
            >
              去逛逛
            </Button>
          </Space>
        </Space>
      </Card>

      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            最新物品
          </Title>
          <Button type="link" onClick={() => navigate('/items')}>
            查看全部
          </Button>
        </div>

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
          <Text type="secondary" style={{ display: 'block', marginTop: 12, fontSize: 12 }}>
            展示最新 {items.length} 件物品
          </Text>
        )}
      </div>
    </Space>
  )
}

export default Home
