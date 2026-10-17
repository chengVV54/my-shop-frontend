import type { FC, ReactNode } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Button,
  Card,
  Descriptions,
  Divider,
  Modal,
  Result,
  Space,
  Spin,
  Tag,
  Typography,
  message,
  theme,
} from 'antd'
import type { DescriptionsProps } from 'antd'
import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  MessageOutlined,
  SwapOutlined,
} from '@ant-design/icons'

import { acceptBarter, getBarterDetail, rejectBarter } from '@/api/barter'
import { useUserStore } from '@/store/useUserStore'
import type { BarterRequest } from '@/types'
import { formatBarterTime, getBarterStatusColor, getBarterStatusLabel } from '@/utils/barter'
import { getErrorMessage, getHttpStatus } from '@/utils/error'
import { formatPrice } from '@/utils/item'

const { Title, Text, Paragraph } = Typography

/**
 * 页面级错误：决定展示哪一个 `Result`。
 *
 * - `not-found`：HTTP 404，申请不存在
 * - `forbidden`：HTTP 403，当前用户不是申请双方
 * - `failed`：其他失败（网络异常 / 超时 / 业务 code 非 200）
 */
type PageError = 'not-found' | 'forbidden' | 'failed'

/** 正在提交的操作；`null` 表示空闲，用来给对应按钮加 loading 并禁用另一个 */
type SubmittingAction = 'accept' | 'reject' | null

/** 错误态文案表：新增错误类型时在这里补齐，避免页面里散落 if/else */
const PAGE_ERROR_RESULT: Record<
  PageError,
  { status: '404' | '403' | 'error'; title: string; subTitle: string }
> = {
  'not-found': {
    status: '404',
    title: '换物申请不存在',
    subTitle: '该换物申请可能已被删除，或链接不正确',
  },
  forbidden: {
    status: '403',
    title: '无权查看',
    subTitle: '只有换物申请的双方（发起方与接收方）可以查看该申请',
  },
  failed: {
    status: 'error',
    title: '加载失败',
    subTitle: '换物详情暂时无法加载，请稍后重试',
  },
}

/**
 * 换物详情页（路由 `/barters/:id`，需登录）。
 *
 * 数据来源：`GET /api/barters/{id}`（只有申请双方可看，非当事人 403、不存在 404）。
 * 操作：
 * - 接收方（`user.id === toUserId`）且状态为 `PENDING` 时，展示「拒绝 / 同意」；
 * - `PUT /api/barters/{id}/reject`、`PUT /api/barters/{id}/accept` 成功后重新拉取详情，
 *   让页面状态始终以后端为准；
 * - 「联系对方」尚未开发，只给占位提示。
 *
 * 安全约定（见 docs/SECURITY.md）：
 * - 登录态只用于显示 / 隐藏操作入口，权限最终由后端判定，前端照常处理 401 / 403 / 404；
 * - token 由 `request.ts` 拦截器自动注入，页面不手写 `Authorization`；
 * - 真正调用接口前仍有 403 / 400 的可能（比如另一个标签页已处理、用户缓存过期），
 *   失败一律按后端 `message` 提示，不假设前端判断一定正确。
 */
const BarterDetail: FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { token } = theme.useToken()

  /** 当前登录用户；null 表示未登录（只用于显示与引导，权限判断在后端） */
  const user = useUserStore((state) => state.user)

  const [messageApi, contextHolder] = message.useMessage()

  const [barter, setBarter] = useState<BarterRequest | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [pageError, setPageError] = useState<PageError | null>(null)
  const [submitting, setSubmitting] = useState<SubmittingAction>(null)

  // 只接受最后一次请求的结果：处理完申请后刷新详情时，旧响应不会覆盖新数据
  const requestIdRef = useRef<number>(0)

  /** 拉取换物详情，并按 HTTP 状态码归类错误 */
  const fetchDetail = useCallback(
    async (barterId: string): Promise<void> => {
      requestIdRef.current += 1
      const requestId = requestIdRef.current

      setLoading(true)
      setPageError(null)

      try {
        const res = await getBarterDetail(Number(barterId))

        // 已有更新的请求（例如连续点「重新加载」）时，丢弃这次过期响应
        if (requestId !== requestIdRef.current) {
          return
        }

        if (!res || res.code !== 200 || !res.data) {
          throw new Error(res?.message || `接口返回异常：code=${res?.code}`)
        }

        setBarter(res.data)
      } catch (error) {
        if (requestId !== requestIdRef.current) {
          return
        }

        // 401 时 request.ts 已清除本地登录态：引导重新登录，而不是展示「加载失败」
        if (!useUserStore.getState().user) {
          messageApi.warning('登录已失效，请重新登录')
          navigate('/login', { replace: true })
          return
        }

        const status = getHttpStatus(error)
        if (status === 404) {
          setPageError('not-found')
        } else if (status === 403) {
          setPageError('forbidden')
        } else {
          setPageError('failed')
          messageApi.error(getErrorMessage(error, '换物详情加载失败，请稍后重试'))
        }

        setBarter(null)
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false)
        }
      }
    },
    [messageApi, navigate],
  )

  useEffect(() => {
    // App.tsx 在**父组件** effect 里恢复登录态，而子组件 effect 先执行：
    // 直接刷新本页时 store 里的 user 还是 null。init() 是幂等的，
    // 这里先恢复一次，避免把已登录用户误弹去登录页（同 BarterApply）。
    useUserStore.getState().init()

    if (!useUserStore.getState().user) {
      messageApi.warning('请先登录')
      navigate('/login', { replace: true })
      return
    }

    // 路由参数只接受纯数字，非法 id 直接按「不存在」处理，不发请求
    if (!id || !/^\d+$/.test(id)) {
      setBarter(null)
      setPageError('not-found')
      setLoading(false)
      return
    }

    void fetchDetail(id)
  }, [fetchDetail, id, messageApi, navigate])

  /** 错误态「重新加载」：先确认登录态仍然有效（可能已被 401 清掉），再重新拉取 */
  const handleRetry = (): void => {
    const currentUser = useUserStore.getState().user

    if (!currentUser) {
      messageApi.warning('请先登录')
      navigate('/login', { replace: true })
      return
    }

    if (!id || !/^\d+$/.test(id)) {
      setBarter(null)
      setPageError('not-found')
      return
    }

    void fetchDetail(id)
  }

  /**
   * 同意 / 拒绝换物。
   *
   * 先 `Modal.confirm` 二次确认（防误触），确认后才发请求；
   * `onOk` 返回 Promise，antd 会让确认框保持 loading 直到请求结束。
   * 成功后重新拉详情（状态以后端为准），失败按后端 message 提示。
   */
  const handleAction = (action: 'accept' | 'reject'): void => {
    if (!barter || submitting !== null) {
      return
    }

    const isAccept = action === 'accept'
    const actionLabel = isAccept ? '同意' : '拒绝'

    Modal.confirm({
      title: `确认${actionLabel}这次换物吗？`,
      content: isAccept
        ? '同意后该申请会进入「已接受」状态，请及时与对方沟通物品交接。'
        : '拒绝后该申请会被关闭，对方会看到「已拒绝」状态。',
      okText: `确认${actionLabel}`,
      cancelText: '再想想',
      okButtonProps: { danger: !isAccept },
      onOk: async () => {
        setSubmitting(action)

        try {
          const res = isAccept ? await acceptBarter(barter.id) : await rejectBarter(barter.id)

          if (!res || res.code !== 200) {
            throw new Error(res?.message || `${actionLabel}换物失败：code=${res?.code}`)
          }

          messageApi.success(isAccept ? '已同意换物申请' : '已拒绝换物申请')

          // 不直接改本地 status，而是重新拉一次详情：以后端状态为准，避免两边不一致
          await fetchDetail(String(barter.id))
        } catch (error) {
          // 401（登录失效）时拦截器已清空登录态：引导重新登录
          if (!useUserStore.getState().user) {
            messageApi.warning('登录已失效，请重新登录')
            navigate('/login', { replace: true })
            return
          }

          // 403（不是接收方）/ 400（状态已不是 PENDING）
          // 都优先展示后端 message，前端不自己编造原因
          messageApi.error(getErrorMessage(error, `${actionLabel}换物失败，请稍后重试`))
        } finally {
          setSubmitting(null)
        }
      },
    })
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '96px 0' }}>
        {contextHolder}
        <Spin size="large" />
      </div>
    )
  }

  // 未登录（或 token 刚失效）时 effect 正在跳转，先占位避免闪出错误态
  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '96px 0' }}>
        {contextHolder}
        <Spin size="large" />
      </div>
    )
  }

  if (pageError) {
    const errorResult = PAGE_ERROR_RESULT[pageError]

    return (
      <>
        {contextHolder}
        <Result
          status={errorResult.status}
          title={errorResult.title}
          subTitle={errorResult.subTitle}
          extra={
            <Space>
              <Button type="primary" onClick={() => navigate('/barters')}>
                返回我的换物
              </Button>
              {pageError !== 'not-found' && <Button onClick={handleRetry}>重新加载</Button>}
            </Space>
          }
        />
      </>
    )
  }

  // 正常流程下不会走到这里（loading=false 且无 error 时 barter 必有值），兜底防止白屏
  if (!barter) {
    return (
      <>
        {contextHolder}
        <Result
          status="error"
          title="加载失败"
          subTitle="换物详情暂时无法加载，请稍后重试"
          extra={
            <Button type="primary" onClick={handleRetry}>
              重新加载
            </Button>
          }
        />
      </>
    )
  }

  /** 当前用户是否是发起方 / 接收方 */
  const isInitiator = barter.fromUserId === user.id
  const isReceiver = barter.toUserId === user.id

  /** 只有「接收方」且状态为「待处理」才显示同意 / 拒绝按钮 */
  const canHandle = isReceiver && barter.status === 'PENDING'

  /** 没有操作按钮时给一句解释，避免用户以为页面坏了 */
  const statusHint =
    barter.status === 'PENDING'
      ? '等待对方处理'
      : '该申请已处理完毕'

  const footerHint = canHandle
    ? '同意或拒绝后，状态会立即同步给双方。'
    : barter.status === 'PENDING'
      ? '对方处理前你无需操作，可先联系对方沟通细节。'
      : '该申请已处理完毕，如有疑问可联系对方。'

  /** 双方身份：展示「我 / 对方」，具体用户 ID 仍然保留，便于排查问题 */
  const renderParty = (partyId: number, isMe: boolean): ReactNode => (
    <Space size={6} wrap>
      <Text>用户 #{partyId}</Text>
      <Tag color={isMe ? 'blue' : 'default'} bordered={false}>
        {isMe ? '我' : '对方'}
      </Tag>
    </Space>
  )

  const descriptionItems: NonNullable<DescriptionsProps['items']> = [
    { key: 'from', label: '发起方', children: renderParty(barter.fromUserId, isInitiator) },
    { key: 'to', label: '接收方', children: renderParty(barter.toUserId, isReceiver) },
    {
      key: 'items',
      label: '换物内容',
      children: (
        <Space size={8} wrap>
          <Text strong>物品 #{barter.fromItemId}</Text>
          <SwapOutlined style={{ color: token.colorPrimary }} />
          <Text strong>物品 #{barter.toItemId}</Text>
        </Space>
      ),
    },
  ]

  // 差价只在非 0 时展示：0 表示双方等价交换，不必占一行
  if (barter.priceDiff !== 0) {
    descriptionItems.push({
      key: 'priceDiff',
      label: '差价',
      children: (
        <Space size={6} wrap>
          <Text strong style={{ color: token.colorError }}>
            {formatPrice(Math.abs(barter.priceDiff))}
          </Text>
          <Text type="secondary">
            {barter.priceDiff > 0 ? '发起方需补差价' : '接收方需补差价'}
          </Text>
        </Space>
      ),
    })
  }

  descriptionItems.push({
    key: 'createdAt',
    label: '申请时间',
    children: formatBarterTime(barter.createdAt),
  })

  const messageText = barter.message?.trim() ?? ''

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {contextHolder}

      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/barters')}>
          返回我的换物
        </Button>

        <Card>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Space size={12} wrap align="center">
              <Title level={3} style={{ margin: 0 }}>
                换物详情
              </Title>
              <Tag color={getBarterStatusColor(barter.status)} bordered={false}>
                {getBarterStatusLabel(barter.status)}
              </Tag>
              <Text type="secondary">换物编号 #{barter.id}</Text>
            </Space>

            <Descriptions
              column={{ xs: 1, sm: 2 }}
              size="small"
              colon={false}
              bordered
              items={descriptionItems}
            />

            {/* 留言用「引用块」呈现，和普通字段区分开 */}
            {messageText !== '' && (
              <div
                style={{
                  padding: '12px 16px',
                  background: token.colorFillQuaternary,
                  borderLeft: `3px solid ${token.colorPrimary}`,
                  borderRadius: token.borderRadius,
                }}
              >
                <Text type="secondary" style={{ fontSize: 12 }}>
                  留言
                </Text>
                <Paragraph style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>
                  {messageText}
                </Paragraph>
              </div>
            )}

            <Divider style={{ margin: 0 }} />

            {/* 操作区：接收方 + 待处理才给按钮，否则给状态说明 */}
            <Space size={12} wrap>
              {canHandle ? (
                <>
                  <Button
                    danger
                    icon={<CloseOutlined />}
                    loading={submitting === 'reject'}
                    disabled={submitting !== null}
                    onClick={() => handleAction('reject')}
                  >
                    拒绝换物
                  </Button>
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    loading={submitting === 'accept'}
                    disabled={submitting !== null}
                    onClick={() => handleAction('accept')}
                  >
                    同意换物
                  </Button>
                </>
              ) : (
                <Text type="secondary">{statusHint}</Text>
              )}

              <Button
                icon={<MessageOutlined />}
                onClick={() => messageApi.info('聊天功能开发中')}
              >
                联系对方
              </Button>
            </Space>

            <Text type="secondary" style={{ fontSize: 12 }}>
              {footerHint}
            </Text>
          </Space>
        </Card>
      </Space>
    </div>
  )
}

export default BarterDetail
