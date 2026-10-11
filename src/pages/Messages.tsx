import type { FC } from 'react'
import { useState } from 'react'
import { Avatar, Card, Col, Empty, List, Row, Space, Typography, theme } from 'antd'
import { UserOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

/** 会话占位数据（mock）：站内消息接口尚未开发，仅用于占位，不含任何真实用户信息 */
interface Conversation {
  id: number
  name: string
  lastMessage: string
  time: string
}

const MOCK_CONVERSATIONS: Conversation[] = [
  { id: 1, name: '换物小伙伴', lastMessage: '你好，这台相机还在吗？', time: '10:24' },
  { id: 2, name: '二手买家', lastMessage: '可以再便宜一点吗？', time: '昨天' },
  { id: 3, name: '平台通知', lastMessage: '你的物品已通过审核', time: '周一' },
]

/**
 * 消息页（占位）。
 *
 * 左侧会话列表 + 右侧聊天区，整体用 `Row` + `Col` 布局：
 * 手机（xs）上下排列，桌面（md）左右分栏。
 * 聊天能力与消息接口尚未开发（见 docs/PROGRESS.md 待做），右侧仅做占位。
 */
const Messages: FC = () => {
  const { token } = theme.useToken()
  const [activeId, setActiveId] = useState<number>(MOCK_CONVERSATIONS[0].id)

  const activeConversation = MOCK_CONVERSATIONS.find((item) => item.id === activeId)

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Title level={3} style={{ marginBottom: 0 }}>
        消息
      </Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={9}>
          <Card styles={{ body: { padding: 0 } }} style={{ minHeight: 420 }}>
            <List
              dataSource={MOCK_CONVERSATIONS}
              renderItem={(conversation) => {
                const active = conversation.id === activeId
                return (
                  <List.Item
                    onClick={() => setActiveId(conversation.id)}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      background: active ? token.colorPrimaryBg : undefined,
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar style={{ backgroundColor: token.colorPrimary }}>
                          <UserOutlined />
                        </Avatar>
                      }
                      title={conversation.name}
                      description={
                        <Text type="secondary" ellipsis style={{ fontSize: 13 }}>
                          {conversation.lastMessage}
                        </Text>
                      }
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {conversation.time}
                    </Text>
                  </List.Item>
                )
              }}
            />
          </Card>
        </Col>

        <Col xs={24} md={15}>
          <Card
            title={activeConversation ? activeConversation.name : '聊天'}
            style={{ minHeight: 420 }}
          >
            <Empty description="聊天功能开发中" style={{ padding: '64px 0' }} />
          </Card>
        </Col>
      </Row>
    </Space>
  )
}

export default Messages
