import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, Button, Card, Col, Empty, Row, Space, Typography, theme } from 'antd'
import { UserOutlined } from '@ant-design/icons'

import { useUserStore } from '@/store/useUserStore'

const { Title, Text } = Typography

/**
 * 「我的」页。
 *
 * 顶部用户信息来自 `useUserStore`（由 App 启动时从 localStorage 恢复，
 * 需要服务端最新数据时可调用 `GET /api/auth/me`）；未登录时引导去登录页。
 * 三块卡片仍是占位，后续分别接入 `GET /api/items?ownerId=me`、`GET /api/barters`、`GET /api/orders`。
 *
 * 注意：这里只根据登录态控制**展示**，真正的权限与数据归属由后端校验
 * （见 docs/SECURITY.md 1.3）。
 */
const Profile: FC = () => {
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const user = useUserStore((state) => state.user)

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Title level={3} style={{ marginBottom: 0 }}>
        我的
      </Title>

      <Card styles={{ body: { padding: 24 } }}>
        {user ? (
          <Space size={16} align="center" wrap>
            <Avatar
              size={64}
              src={user.avatar || undefined}
              icon={<UserOutlined style={{ fontSize: 28 }} />}
              style={{ backgroundColor: token.colorPrimary }}
            />
            <Space direction="vertical" size={0}>
              <Text strong style={{ fontSize: 18 }}>
                {user.username}
              </Text>
              <Text type="secondary">信用分：{user.credit}</Text>
              {user.createdAt ? (
                <Text type="secondary">注册时间：{user.createdAt}</Text>
              ) : null}
            </Space>
          </Space>
        ) : (
          <Space size={16} align="center" wrap>
            <Avatar
              size={64}
              icon={<UserOutlined style={{ fontSize: 28 }} />}
              style={{ backgroundColor: token.colorBorder }}
            />
            <Space direction="vertical" size={4}>
              <Text strong style={{ fontSize: 18 }}>
                未登录
              </Text>
              <Text type="secondary">登录后可查看发布、换物与订单</Text>
              <Button type="primary" size="small" onClick={() => navigate('/login')}>
                去登录
              </Button>
            </Space>
          </Space>
        )}
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="我的物品">
            <Empty description="暂无数据" style={{ padding: '24px 0' }} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="我的换物">
            <Empty description="暂无数据" style={{ padding: '24px 0' }} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="我的订单">
            <Empty description="暂无数据" style={{ padding: '24px 0' }} />
          </Card>
        </Col>
      </Row>
    </Space>
  )
}

export default Profile
