import type { FC } from 'react'
import { Empty, Space, Typography } from 'antd'

const { Title } = Typography

/**
 * 视频页（占位）。
 *
 * 视频浏览能力尚未开发，当前仅给出空态提示；
 * 路由 `/videos` 已就绪，后续在此接入视频流接口。
 */
const Videos: FC = () => {
  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Title level={3} style={{ marginBottom: 0 }}>
        视频
      </Title>

      <Empty description="视频功能开发中" style={{ padding: '64px 0' }} />
    </Space>
  )
}

export default Videos
