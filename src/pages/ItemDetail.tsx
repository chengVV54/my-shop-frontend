import type { FC, ReactElement } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Grid,
  Modal,
  Result,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
  message,
  theme,
} from 'antd'

import {
  ArrowLeftOutlined,
  BookOutlined,
  CameraOutlined,
  CheckCircleOutlined,
  CustomerServiceOutlined,
  DeleteOutlined,
  DesktopOutlined,
  MobileOutlined,
  PictureOutlined,
  SkinOutlined,
  StarOutlined,
  SwapOutlined,
  TagsOutlined,
  UserOutlined,
} from '@ant-design/icons'

import { deleteItem } from '@/api/item'
import request from '@/api/request'
import { useUserStore } from '@/store/useUserStore'
import type { ApiResult, Item, ItemCategory } from '@/types'
import { getErrorMessage } from '@/utils/error'
import {
  formatPrice,
  getCategoryLabel,
  getConditionLabel,
  getModeColor,
  getModeLabel,
  getStatusColor,
  getStatusLabel,
} from '@/utils/item'

const { Title, Text, Paragraph } = Typography

/** 大图占位高度（桌面）；手机端用 MOBILE_COVER_HEIGHT，避免占满整屏 */
const COVER_HEIGHT = 360
const MOBILE_COVER_HEIGHT = 240

/** 分类 → 占位图图标 */
const CATEGORY_ICON: Record<ItemCategory, ReactElement> = {
  CAMERA: <CameraOutlined />,
  BOOK: <BookOutlined />,
  INSTRUMENT: <CustomerServiceOutlined />,
  GAME: <TagsOutlined />,
  PHONE: <MobileOutlined />,
  COMPUTER: <DesktopOutlined />,
  CLOTHING: <SkinOutlined />,
  OTHER: <PictureOutlined />,
}

/** 详情页底部操作按钮 */
interface ActionButton {
  key: string
  label: string
  type: 'primary' | 'default'
  icon?: ReactElement
}

/** 按交易模式决定可执行的操作 */
const buildActions = (mode: Item['mode']): ActionButton[] => {
  const barter: ActionButton = {
    key: 'barter',
    label: '发起换物',
    type: 'primary',
    icon: <SwapOutlined />,
  }
  const buy: ActionButton = { key: 'buy', label: '立即购买', type: 'primary' }
  const contactForBarter: ActionButton = { key: 'contact-barter', label: '联系对方', type: 'default' }
  const contactForSale: ActionButton = { key: 'contact-sale', label: '联系卖家', type: 'default' }

  if (mode === 'BARTER') {
    return [barter, contactForBarter]
  }
  if (mode === 'SALE') {
    return [buy, contactForSale]
  }
  if (mode === 'BOTH') {
    return [barter, buy, contactForBarter]
  }
  return []
}

/**
 * 物品详情页。
 *
 * 桌面：左图右信息（Row + Col 左右排列）；
 * 手机（md 以下）：图文上下排列，图片高度与内边距同步收窄。
 */
const ItemDetail: FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { token } = theme.useToken()
  const screens = Grid.useBreakpoint()

  /** 当前登录用户；null 表示未登录（只用于显示与引导，权限最终判断在后端） */
  const user = useUserStore((state) => state.user)

  /** md 以下视为手机 */
  const isMobile = !screens.md

  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  /** 下架请求进行中：给「下架物品」按钮加 loading 并禁用，防止重复提交 */
  const [removing, setRemoving] = useState<boolean>(false)
  const [errorText, setErrorText] = useState<string>('')
  const [messageApi, contextHolder] = message.useMessage()

  const fetchItem = useCallback(async (itemId: string): Promise<void> => {
    setLoading(true)
    setErrorText('')

    try {
      const res = await request.get<ApiResult<Item>>(`/items/${itemId}`)

      if (!res || res.code !== 200 || !res.data) {
        throw new Error(res?.message || `接口返回异常：code=${res?.code}`)
      }

      setItem(res.data)
    } catch (error) {
      setItem(null)
      setErrorText(error instanceof Error ? error.message : String(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!id || !/^\d+$/.test(id)) {
      setItem(null)
      setErrorText('物品不存在或已下架')
      setLoading(false)
      return
    }

    void fetchItem(id)
  }, [fetchItem, id])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '96px 0' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!item) {
    return (
      <Result
        status="404"
        title="物品不存在"
        subTitle={errorText || '该物品可能已被删除或下架'}
        extra={
          <Space>
            <Button type="primary" onClick={() => navigate('/items')}>
              返回列表
            </Button>
            <Button onClick={() => void fetchItem(id ?? '')}>重新加载</Button>
          </Space>
        }
      />
    )
  }

  const cover = item.images?.[0]
  const priceText = formatPrice(item.price)
  const showWant = item.mode === 'BARTER' || item.mode === 'BOTH'
  const wantCategoryLabels = (item.wantCategories ?? []).map(getCategoryLabel)
  const wantText = item.wantDescription?.trim()
    ? item.wantDescription.trim()
    : wantCategoryLabels.join('、')
  const actions = buildActions(item.mode)

  /**
   * 是否显示「下架物品」按钮。
   *
   * 三个条件缺一不可：**已登录** + **是自己的物品**（`user.id === item.ownerId`）
   * + **状态为在架**（`AVAILABLE`）。锁定 / 完成 / 已下架的物品不允许再下架，
   * 否则会破坏进行中的交易。
   *
   * 注意：这只是**显示层**判断（见 docs/SECURITY.md 1.3），用来少给用户无效入口；
   * 真正的归属与状态校验在后端 `DELETE /api/items/{id}`，前端照常处理被拒绝的返回。
   */
  const canRemove = Boolean(user && user.id === item.ownerId && item.status === 'AVAILABLE')

  /**
   * 下架物品（软删除）。
   *
   * 流程：`Modal.confirm` 二次确认 → 确认后 `onOk` 发 `DELETE /api/items/{id}`
   * → 成功提示「已下架」并回个人中心；失败按后端 `message` 提示。
   *
   * `onOk` 返回 Promise 时，antd 会让确认框保持 loading 直到请求结束，
   * 用户不会「点完没反应」而重复点击。
   */
  const handleRemove = (): void => {
    // 幂等保护：请求进行中不再弹出第二个确认框（按钮此时也已 loading / disabled，双保险）
    if (removing) {
      return
    }

    Modal.confirm({
      title: '下架物品',
      content: '确定要下架该物品吗？下架后将无法被其他人看到。',
      okText: '确认下架',
      cancelText: '再想想',
      // 危险操作：确认按钮用红色，降低误触
      okButtonProps: { danger: true },
      onOk: async () => {
        setRemoving(true)

        try {
          const res = await deleteItem(item.id)

          // 除 401 外的业务失败（403 越权 / 400 状态锁定 / 404 不存在）也是 HTTP 200，
          // 必须判断包装体的 code，否则会把失败当成功
          if (!res || res.code !== 200) {
            throw new Error(res?.message || `下架失败：code=${res?.code}`)
          }

          messageApi.success('已下架')

          // replace：不保留这条已失效的详情页，返回时不会又回到「已下架」的物品
          navigate('/profile', { replace: true })
        } catch (error) {
          // 401 时 request.ts 已清除登录态：引导重新登录，而不是展示业务错误
          if (!useUserStore.getState().user) {
            messageApi.warning('登录已失效，请重新登录')
            navigate('/login', { replace: true })
            return
          }

          // 403 / 400 / 404 一律优先展示后端 message（如「只能删除自己的物品」），不自己编造原因
          messageApi.error(getErrorMessage(error, '下架失败，请稍后重试'))
        } finally {
          setRemoving(false)
        }
      },
    })
  }

  /**
   * 底部操作按钮的点击行为。
   *
   * 「发起换物」已接入真实流程：未登录先引导登录，已登录跳转 `/barter/apply/{itemId}` 选物品 + 填留言；
   * 「立即购买 / 联系对方 / 联系卖家」尚未开发，仍给占位提示（见 docs/PROGRESS.md 待做）。
   * 这里的判断只做体验优化，后端仍会独立校验（见 docs/SECURITY.md 1.3）。
   */
  const handleAction = (action: ActionButton): void => {
    if (action.key !== 'barter') {
      messageApi.info(`${action.label}：功能开发中，敬请期待`)
      return
    }

    if (!user) {
      messageApi.warning('请先登录')
      navigate('/login')
      return
    }

    // 不能和自己换：后端同样会返回 400「不能和自己换」，这里提前拦住，减少无效请求
    if (item.ownerId === user.id) {
      messageApi.warning('不能对自己发布的物品发起换物')
      return
    }

    navigate(`/barter/apply/${item.id}`)
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {contextHolder}

      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/items')}>
        返回列表
      </Button>

      <Card styles={{ body: { padding: isMobile ? 16 : 24 } }}>
        <Row gutter={[isMobile ? 16 : 24, 24]}>
          <Col xs={24} md={10}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: isMobile ? MOBILE_COVER_HEIGHT : COVER_HEIGHT,
                overflow: 'hidden',
                fontSize: isMobile ? 56 : 72,
                color: token.colorTextQuaternary,
                background: token.colorFillSecondary,
                borderRadius: token.borderRadiusLG,
              }}
            >
              {cover ? (
                <img
                  src={cover}
                  alt={item.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                (CATEGORY_ICON[item.category] ?? <PictureOutlined />)
              )}
            </div>
          </Col>

          <Col xs={24} md={14}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Space size={8} wrap>
                <Tag color={getModeColor(item.mode)} bordered={false}>
                  {getModeLabel(item.mode)}
                </Tag>
                <Tag color={getStatusColor(item.status)} bordered={false}>
                  {getStatusLabel(item.status)}
                </Tag>
              </Space>

              <Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>
                {item.title}
              </Title>

              {priceText !== '' && (item.mode === 'SALE' || item.mode === 'BOTH') && (
                <Text strong style={{ fontSize: isMobile ? 20 : 24, color: token.colorError }}>
                  {priceText}
                </Text>
              )}

              {showWant && (
                <Text type="secondary">
                  想要：{wantText || '不限'}
                  {item.allowPriceDiff ? '（可补差价）' : ''}
                </Text>
              )}

              {/* 卖家信息：用户体系尚未接入（见 docs/PROGRESS.md 待做），头像与信用分先占位 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  background: token.colorFillQuaternary,
                  borderRadius: token.borderRadius,
                }}
              >
                <Avatar size={40} style={{ backgroundColor: token.colorPrimary }}>
                  <UserOutlined />
                </Avatar>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.6 }}>
                  <Text strong>用户 {item.ownerId}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    信用分 --（待接入） · 发布于 {item.createdAt}
                  </Text>
                </div>
              </div>

              <Descriptions
                column={{ xs: 1, sm: 2 }}
                size="small"
                colon={false}
                items={[
                  { key: 'category', label: '分类', children: getCategoryLabel(item.category) },
                  { key: 'condition', label: '成色', children: getConditionLabel(item.condition) },
                ]}
              />

              <div>
                <Text strong>描述</Text>
                <Paragraph type="secondary" style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                  {item.description?.trim() ? item.description : '卖家很懒，什么都没写'}
                </Paragraph>
              </div>

              <Space size={12} wrap style={{ marginTop: 8 }}>
                {actions.map((action) => (
                  <Button
                    key={action.key}
                    type={action.type}
                    icon={action.icon}
                    block={isMobile}
                    onClick={() => handleAction(action)}
                  >
                    {action.label}
                  </Button>
                ))}
                <Button
                  icon={<StarOutlined />}
                  block={isMobile}
                  onClick={() => messageApi.info('收藏功能开发中')}
                >
                  收藏
                </Button>
                {/* 只有「本人 + 在架」才出现：Space 自带 wrap，按钮与其它操作并排且不会被遮挡 */}
                {canRemove && (
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    block={isMobile}
                    loading={removing}
                    disabled={removing}
                    onClick={handleRemove}
                  >
                    下架物品
                  </Button>
                )}
                {actions.length === 0 && (
                  <Text type="secondary">
                    <CheckCircleOutlined /> 该物品暂不支持线上操作
                  </Text>
                )}
              </Space>
            </Space>
          </Col>
        </Row>
      </Card>
    </Space>
  )
}

export default ItemDetail
