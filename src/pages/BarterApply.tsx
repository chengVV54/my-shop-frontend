import type { FC } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Result,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  message,
  theme,
} from 'antd'
import { ArrowLeftOutlined, PictureOutlined, SwapOutlined } from '@ant-design/icons'

import { createBarter } from '@/api/barter'
import request from '@/api/request'
import { useUserStore } from '@/store/useUserStore'
import type { ApiResult, Item } from '@/types'
import { getErrorMessage } from '@/utils/error'
import { formatPrice, getModeColor, getModeLabel } from '@/utils/item'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

/** 封面占位尺寸（正方形），移动端与桌面统一，够用且不喧宾夺主 */
const COVER_SIZE = 120

/** 留言长度上限，与后端约束保持一致（后端仍会独立校验） */
const MESSAGE_MAX_LENGTH = 500

/** 发起换物表单字段 */
interface BarterApplyFormValues {
  /** 我提供的物品 ID（必填） */
  fromItemId: number
  /** 给对方的留言（选填） */
  message?: string
}

/** 下拉选项：在标题后带上交易模式，方便一眼区分 */
interface ItemOption {
  value: number
  label: string
}

/**
 * 发起换物页（路由 `/barter/apply/:itemId`）。
 *
 * 流程：目标物品（`itemId`，我想换的）+ 我的一件在架物品（我提供的）+ 留言
 * → `POST /api/barters` → 成功后回到 `/profile` 查看。
 *
 * 数据来源：
 * - 目标物品：`GET /api/items/{itemId}`
 * - 我的物品：`GET /api/items` 全量拉取后**前端过滤**（后端暂不支持 `ownerId` 参数），
 *   只保留 `ownerId === 当前用户` 且 `status === 'AVAILABLE'` 的物品，
 *   并剔除目标物品本身（自己的物品不能和自己换）。
 *
 * 安全约定（见 docs/SECURITY.md）：
 * - 登录态只用于显示与引导，token 由 `request.ts` 拦截器自动注入，页面不手写请求头；
 * - 这里的登录判断与前端校验都只是体验优化，物品归属、可否换物、是否重复申请
 *   一律由后端判定，页面照常处理 401 / 403 / 400 / 404 返回。
 */
const BarterApply: FC = () => {
  const { itemId } = useParams<{ itemId: string }>()
  const navigate = useNavigate()
  const { token } = theme.useToken()

  const [form] = Form.useForm<BarterApplyFormValues>()
  const [messageApi, contextHolder] = message.useMessage()

  const [target, setTarget] = useState<Item | null>(null)
  const [myItems, setMyItems] = useState<Item[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [errorText, setErrorText] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)

  // 只接受最后一次请求的结果，避免快速切换 / 组件卸载后旧响应覆盖新数据
  const requestIdRef = useRef<number>(0)

  /** 拉取目标物品与我的物品；两个请求互不依赖，用 Promise.all 并行 */
  const fetchData = useCallback(async (id: string, userId: number): Promise<void> => {
    requestIdRef.current += 1
    const requestId = requestIdRef.current

    setLoading(true)
    setErrorText('')

    try {
      const [targetRes, listRes] = await Promise.all([
        request.get<ApiResult<Item>>(`/items/${id}`),
        request.get<ApiResult<Item[]>>('/items'),
      ])

      if (requestId !== requestIdRef.current) {
        return
      }

      const targetItem = targetRes?.data
      if (!targetRes || targetRes.code !== 200 || !targetItem) {
        throw new Error(targetRes?.message || `接口返回异常：code=${targetRes?.code}`)
      }

      if (!listRes || listRes.code !== 200) {
        throw new Error(listRes?.message || `接口返回异常：code=${listRes?.code}`)
      }

      const allItems = Array.isArray(listRes.data) ? listRes.data : []

      setTarget(targetItem)
      setMyItems(
        allItems.filter(
          (item) =>
            item.ownerId === userId &&
            item.status === 'AVAILABLE' &&
            item.id !== targetItem.id,
        ),
      )
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return
      }

      setTarget(null)
      setMyItems([])
      setErrorText(getErrorMessage(error, '加载失败，请稍后重试'))
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    // App.tsx 在**父组件** effect 里恢复登录态，而子组件 effect 先执行：
    // 直接刷新本页时 store 里的 user 还是 null。init() 是幂等的，
    // 这里先恢复一次，避免误把已登录用户弹去登录页。
    useUserStore.getState().init()
    const currentUser = useUserStore.getState().user

    if (!currentUser) {
      messageApi.warning('请先登录')
      navigate('/login', { replace: true })
      return
    }

    if (!itemId || !/^\d+$/.test(itemId)) {
      setTarget(null)
      setMyItems([])
      setErrorText('物品不存在或已下架')
      setLoading(false)
      return
    }

    void fetchData(itemId, currentUser.id)
  }, [fetchData, itemId, messageApi, navigate])

  /** 错误态「重新加载」：先确认登录态仍然有效（可能已被 401 清掉），再重新拉取 */
  const handleRetry = (): void => {
    const currentUser = useUserStore.getState().user

    if (!currentUser || !itemId) {
      messageApi.warning('请先登录')
      navigate('/login', { replace: true })
      return
    }

    void fetchData(itemId, currentUser.id)
  }

  /** 下拉选项：我的在架物品 */
  const myItemOptions = useMemo<ItemOption[]>(
    () =>
      myItems.map((item) => ({
        value: item.id,
        label: `${item.title}（${getModeLabel(item.mode)}）`,
      })),
    [myItems],
  )

  const handleFinish = async (values: BarterApplyFormValues): Promise<void> => {
    if (!target) {
      return
    }

    setSubmitting(true)
    try {
      const res = await createBarter({
        toItemId: target.id,
        fromItemId: values.fromItemId,
        // 留言选填：只有非空内容才提交，避免发送空字符串
        message: values.message?.trim() ? values.message.trim() : undefined,
      })

      if (!res || res.code !== 200 || !res.data) {
        throw new Error(res?.message || `发起换物失败：code=${res?.code}`)
      }

      messageApi.success('已发起换物申请')
      navigate('/profile')
    } catch (error) {
      // 401（未登录）/ 403（不是自己的物品）/ 400（不可换、重复申请）/ 404（物品不存在）
      // 都靠后端 message 提示，前端不自己编造原因
      messageApi.error(getErrorMessage(error, '发起换物失败，请稍后重试'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '96px 0' }}>
        {contextHolder}
        <Spin size="large" />
      </div>
    )
  }

  if (!target) {
    return (
      <>
        {contextHolder}
        <Result
          status="404"
          title="物品不存在"
          subTitle={errorText || '该物品可能已被删除或下架'}
          extra={
            <Space>
              <Button type="primary" onClick={() => navigate('/items')}>
                返回列表
              </Button>
              <Button onClick={handleRetry}>重新加载</Button>
            </Space>
          }
        />
      </>
    )
  }

  const cover = target.images?.[0]

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {contextHolder}

      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/items/${target.id}`)}>
          返回物品详情
        </Button>

        <Title level={3} style={{ margin: 0 }}>
          发起换物
        </Title>
        <Text type="secondary">
          用你的一件在架物品，换对方的这件物品；对方同意后会收到你的申请。
        </Text>

        {/* 目标物品：我想换的那件 */}
        <Card title="我想换的物品" styles={{ body: { padding: 16 } }}>
          <Row gutter={16} align="middle" wrap={false}>
            <Col flex={`0 0 ${COVER_SIZE}px`}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: COVER_SIZE,
                  height: COVER_SIZE,
                  overflow: 'hidden',
                  fontSize: 36,
                  color: token.colorTextQuaternary,
                  background: token.colorFillSecondary,
                  borderRadius: token.borderRadius,
                }}
              >
                {cover ? (
                  <img
                    src={cover}
                    alt={target.title}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <PictureOutlined />
                )}
              </div>
            </Col>

            <Col flex="auto" style={{ minWidth: 0 }}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Space size={8} wrap>
                  <Tag color={getModeColor(target.mode)} bordered={false}>
                    {getModeLabel(target.mode)}
                  </Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    物品编号 {target.id} · 发布者 {target.ownerId}
                  </Text>
                </Space>

                <Paragraph
                  ellipsis={{ rows: 2, tooltip: target.title }}
                  style={{ marginBottom: 0, fontSize: 16, fontWeight: 600 }}
                >
                  {target.title}
                </Paragraph>

                {formatPrice(target.price) !== '' &&
                  (target.mode === 'SALE' || target.mode === 'BOTH') && (
                    <Text strong style={{ color: token.colorError }}>
                      {formatPrice(target.price)}
                    </Text>
                  )}
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 换物表单：选我的物品 + 留言 */}
        <Card title="换物申请" styles={{ body: { padding: 16 } }}>
          {myItems.length === 0 ? (
            <Empty description="你还没有可用于换物的在架物品" style={{ padding: '16px 0' }}>
              <Button type="primary" onClick={() => navigate('/publish')}>
                去发布物品
              </Button>
            </Empty>
          ) : (
            <Form<BarterApplyFormValues>
              form={form}
              layout="vertical"
              requiredMark={false}
              disabled={submitting}
              onFinish={handleFinish}
            >
              <Form.Item
                name="fromItemId"
                label="我提供的物品"
                rules={[{ required: true, message: '请选择一件你的物品' }]}
              >
                <Select<number>
                  options={myItemOptions}
                  placeholder="请选择一件你的在架物品"
                  showSearch
                  optionFilterProp="label"
                  allowClear
                />
              </Form.Item>

              <Form.Item
                name="message"
                label="留言"
                rules={[
                  { max: MESSAGE_MAX_LENGTH, message: `留言不能超过 ${MESSAGE_MAX_LENGTH} 字` },
                ]}
              >
                <TextArea
                  rows={4}
                  maxLength={MESSAGE_MAX_LENGTH}
                  showCount
                  placeholder="介绍一下你的物品成色，或想说给对方的话（选填）"
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Space size={12} wrap>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SwapOutlined />}
                    loading={submitting}
                  >
                    发起换物
                  </Button>
                  <Button onClick={() => navigate(`/items/${target.id}`)}>取消</Button>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    申请提交后可在 <Link to="/profile">我的</Link> 中查看
                  </Text>
                </Space>
              </Form.Item>
            </Form>
          )}
        </Card>
      </Space>
    </div>
  )
}

export default BarterApply
