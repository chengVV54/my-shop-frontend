import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Space, Typography } from 'antd'

const { Title, Paragraph } = Typography

const Home: FC = () => {
  const navigate = useNavigate()

  return (
    <div style={{ padding: 48 }}>
      <Space direction="vertical" size="middle">
        <Title level={2} style={{ marginBottom: 0 }}>
          My Shop
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          个人电商项目：支持新品购买、二手买卖、以物换物。
        </Paragraph>
        <Button type="primary" onClick={() => navigate('/products')}>
          进入商品列表
        </Button>
      </Space>
    </div>
  )
}

export default Home
