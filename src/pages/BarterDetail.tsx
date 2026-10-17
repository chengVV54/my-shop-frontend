import type { FC } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Card, Space, Typography } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

/**
 * 换物详情占位页（路由 `/barters/:id`）。
 *
 * 目前 `GET /api/barters` 只返回列表数据、没有单条详情接口，
 * 因此这里先只展示换物 ID 与「开发中」提示；
 * 下一步接入详情数据（双方物品、状态流转、接受 / 拒绝操作）后替换本页内容。
 */
const BarterDetail: FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/barters')}>
          返回列表
        </Button>

        <Card>
          <Title level={3} style={{ margin: 0 }}>
            换物详情 #{id ?? '-'}（开发中）
          </Title>
          <Text type="secondary">
            详情页正在开发中，稍后可在这里查看双方物品、留言与换物状态。
          </Text>
        </Card>
      </Space>
    </div>
  )
}

export default BarterDetail
