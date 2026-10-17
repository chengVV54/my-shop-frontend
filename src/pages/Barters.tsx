import type { FC } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Empty,
  List,
  Segmented,
  Space,
  Spin,
  Tag,
  Typography,
  message,
  theme,
} from 'antd'
import { RightOutlined, SwapOutlined } from '@ant-design/icons'

import { getBarters } from '@/api/barter'
import { useUserStore } from '@/store/useUserStore'
import type { BarterRequest } from '@/types'
import { formatBarterTime, getBarterStatusColor, getBarterStatusLabel } from '@/utils/barter'
import { getErrorMessage } from '@/utils/error'

const { Title, Text, Paragraph } = Typography

/** 筛选视角：all 全部 / from 我发起的 / to 我收到的，与后端 type 参数一致 */
type BarterFilterType = 'all' | 'from' | 'to'

const FILTER_OPTIONS: { label: string; value: BarterFilterType }[] = [
  { label: '全部', value: 'all' },
  { label: '我发起的', value: 'from' },
  { label: '我收到的', value: 'to' },
]

/**
 * 「我的换物」页（路由 `/barters`，需登录）。
 *
 * 数据来自 `GET /api/barters?type=all|from|to`，token 由 `request.ts`
 * 拦截器自动携带，方向（我发起 / 我收到）由后端根据当前用户判定。
 *
 * 页面职责：
 * - 未登录：提示后 `replace` 到 `/login`（不做静默放行）；
 * - 顶部 `Segmented` 切换视角，切换即重新请求；
 * - 列表展示双方物品 ID、状态标签、留言、时间，点击整卡进入 `/barters/:id`；
 * - 覆盖加载中 / 空态 / 请求失败三种状态。
 *
 * 说明：后端列表只返回 `fromItemId` / `toItemId`，暂未带物品标题，
 * 因此这里先用「物品 #ID」占位；后续接口补充标题后只需替换展示字段。
 */
const Barters: FC = () => {
  const navigate = useNavigate()
  const { token } = theme.useToken()
  const [messageApi, contextHolder] = message.useMessage()
  const user = useUserStore((state) => state.user)

  const [filterType, setFilterType] = useState<BarterFilterType>('all')
  const [barters, setBarters] = useState<BarterRequest[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  // 只接受最后一次请求的结果：快速切换筛选时，旧响应不会覆盖新数据
  const requestIdRef = useRef<number>(0)

  const fetchBarters = useCallback(
    async (type: BarterFilterType): Promise<void> => {
      requestIdRef.current += 1
      const requestId = requestIdRef.current

      setLoading(true)
      try {
        const res = await getBarters({ type })

        if (requestId !== requestIdRef.current) {
          return
        }

        if (!res || res.code !== 200) {
          throw new Error(res?.message || `接口返回异常：code=${res?.code}`)
        }

        setBarters(Array.isArray(res.data) ? res.data : [])
      } catch (error) {
        if (requestId !== requestIdRef.current) {
          return
        }

        setBarters([])

        // 401 时 request.ts 已清空登录态：引导重新登录，而不是只提示「加载失败」
        if (!useUserStore.getState().user) {
          messageApi.warning('登录已失效，请重新登录')
          navigate('/login', { replace: true })
          return
        }

        messageApi.error(getErrorMessage(error, '换物列表加载失败，请稍后重试'))
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false)
        }
      }
    },
    [messageApi, navigate],
  )

  useEffect(() => {
    // App.tsx 在父组件 effect 里恢复登录态，子组件 effect 先执行；
    // 直接刷新本页时 store 里的 user 还是 null，这里先幂等恢复一次。
    useUserStore.getState().init()

    if (!useUserStore.getState().user) {
      messageApi.warning('请先登录')
      navigate('/login', { replace: true })
      return
    }

    void fetchBarters(filterType)
  }, [fetchBarters, filterType, messageApi, navigate])

  // 未登录时 effect 正在跳转，先渲染一个占位，避免用错误的「我收到的」标签闪一下
  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '96px 0' }}>
        {contextHolder}
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      {contextHolder}

      <Title level={3} style={{ marginBottom: 4 }}>
        我的换物
      </Title>
      <Text type="secondary">我发起的和我收到的换物申请都在这里</Text>

      <Space size={12} wrap align="center" style={{ margin: '16px 0 24px' }}>
        <Segmented<BarterFilterType>
          options={FILTER_OPTIONS}
          value={filterType}
          onChange={(value) => setFilterType(value)}
        />
        {!loading && <Text type="secondary">共 {barters.length} 条</Text>}
      </Space>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
          <Spin size="large" />
        </div>
      ) : barters.length === 0 ? (
        <Empty description="暂无换物记录" style={{ padding: '64px 0' }} />
      ) : (
        <List<BarterRequest>
          dataSource={barters}
          split={false}
          renderItem={(record) => {
            const outgoing = record.fromUserId === user.id

            return (
              <List.Item key={record.id} style={{ padding: 0, marginBottom: 12 }}>
                <Card
                  hoverable
                  style={{ width: '100%' }}
                  styles={{ body: { padding: 16 } }}
                  onClick={() => navigate(`/barters/${record.id}`)}
                >
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <Space size={8} wrap>
                      <Tag color={getBarterStatusColor(record.status)} bordered={false}>
                        {getBarterStatusLabel(record.status)}
                      </Tag>
                      <Tag color={outgoing ? 'blue' : 'purple'} bordered={false}>
                        {outgoing ? '我发起的' : '我收到的'}
                      </Tag>
                      <Text type="secondary">换物 #{record.id}</Text>
                    </Space>

                    <Space size={8} wrap align="center">
                      <Text strong>
                        {outgoing ? '我提供' : '对方提供'}：物品 #{record.fromItemId}
                      </Text>
                      <SwapOutlined style={{ color: token.colorPrimary }} />
                      <Text strong>
                        {outgoing ? '我想换' : '对方想换'}：物品 #{record.toItemId}
                      </Text>
                    </Space>

                    <Text type="secondary" style={{ fontSize: 12 }}>
                      发起方 #{record.fromUserId} → 接收方 #{record.toUserId}
                    </Text>

                    {record.message?.trim() ? (
                      <Paragraph
                        ellipsis={{ rows: 2, tooltip: record.message }}
                        style={{ marginBottom: 0 }}
                      >
                        <Text type="secondary">留言：</Text>
                        {record.message}
                      </Paragraph>
                    ) : null}

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {formatBarterTime(record.createdAt)}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        查看详情 <RightOutlined />
                      </Text>
                    </div>
                  </Space>
                </Card>
              </List.Item>
            )
          }}
        />
      )}
    </div>
  )
}

export default Barters
