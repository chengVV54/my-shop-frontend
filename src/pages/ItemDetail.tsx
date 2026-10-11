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
  DesktopOutlined,
  MobileOutlined,
  PictureOutlined,
  SkinOutlined,
  StarOutlined,
  SwapOutlined,
  TagsOutlined,
  UserOutlined,
} from '@ant-design/icons'

import request from '@/api/request'
import type { ApiResult, Item, ItemCategory } from '@/types'
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

  /** md 以下视为手机 */
  const isMobile = !screens.md

  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
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
                    onClick={() => {
                      // 换物 / 下单流程尚未开发（见 docs/PROGRESS.md 待做），先给出明确反馈
                      messageApi.info(`${action.label}：功能开发中，敬请期待`)
                    }}
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
