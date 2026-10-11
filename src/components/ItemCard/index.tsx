import type { CSSProperties, FC, ReactElement } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Space, Tag, Typography, theme } from 'antd'
import {
  BookOutlined,
  CameraOutlined,
  CustomerServiceOutlined,
  DesktopOutlined,
  MobileOutlined,
  PictureOutlined,
  SkinOutlined,
  TagsOutlined,
} from '@ant-design/icons'

import type { Item, ItemCategory } from '@/types/item'
import {
  formatPrice,
  getCategoryLabel,
  getConditionLabel,
  getModeColor,
  getModeLabel,
} from '@/utils/item'

const { Text, Paragraph } = Typography

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

/** 占位图高度 */
const COVER_HEIGHT = 160

/**
 * 标签统一样式。
 *
 * 颜色一律由 `utils/item.ts` 的 getModeColor / getStatusColor 决定，
 * 卡片与详情页共用同一套映射，避免同一模式在不同页面颜色不一致。
 */
const TAG_STYLE: CSSProperties = { marginInlineEnd: 0 }

interface ItemCardProps {
  item: Item
}

/**
 * 物品卡片。
 *
 * 顶部为图片（没有图片时用灰色占位块 + 分类图标），
 * 中部为标题、模式标签、价格 / 想换什么，底部为分类 + 成色。
 * hover 时轻微上浮 + 阴影加深；点击整张卡片跳转到 `/items/{id}`。
 */
const ItemCard: FC<ItemCardProps> = ({ item }) => {
  const navigate = useNavigate()
  const { token } = theme.useToken()

  const [hovered, setHovered] = useState<boolean>(false)

  const cover = item.images?.[0]
  const modeLabel = getModeLabel(item.mode)
  const categoryLabel = getCategoryLabel(item.category)
  const conditionLabel = getConditionLabel(item.condition)
  const priceText = formatPrice(item.price)

  /** 换物 / 都可：优先展示补充说明，其次展示想换的分类标签 */
  const showWant = item.mode === 'BARTER' || item.mode === 'BOTH'
  const wantCategoryLabels = (item.wantCategories ?? []).map(getCategoryLabel)
  const wantText = item.wantDescription?.trim()
    ? item.wantDescription.trim()
    : wantCategoryLabels.join('、')

  /** 二手 / 都可：有价格才展示价格行 */
  const showPrice = (item.mode === 'SALE' || item.mode === 'BOTH') && priceText !== ''

  return (
    <Card
      hoverable
      onClick={() => navigate(`/items/${item.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        height: '100%',
        cursor: 'pointer',
        overflow: 'hidden',
        borderRadius: token.borderRadiusLG,
        borderColor: hovered ? token.colorPrimaryBorder : token.colorBorderSecondary,
        boxShadow: hovered ? token.boxShadowSecondary : token.boxShadowTertiary,
        transform: hovered ? 'translateY(-2px)' : 'none',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
      }}
      styles={{ body: { padding: 16 } }}
      cover={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: COVER_HEIGHT,
            overflow: 'hidden',
            fontSize: 40,
            color: token.colorTextQuaternary,
            background: token.colorFillSecondary,
          }}
        >
          {cover ? (
            <img
              src={cover}
              alt={item.title}
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            (CATEGORY_ICON[item.category] ?? <PictureOutlined />)
          )}
        </div>
      }
    >
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <Paragraph
          ellipsis={{ rows: 2, tooltip: item.title }}
          style={{ marginBottom: 0, minHeight: 44, fontSize: 16, fontWeight: 600 }}
        >
          {item.title}
        </Paragraph>

        <Space size={4} wrap>
          <Tag color={getModeColor(item.mode)} bordered={false} style={TAG_STYLE}>
            {modeLabel}
          </Tag>
          <Tag bordered={false} style={TAG_STYLE}>
            {categoryLabel}
          </Tag>
        </Space>

        {showWant && (
          <Text type="secondary" ellipsis={{ tooltip: wantText }} style={{ fontSize: 13 }}>
            想要：{wantText || '不限'}
          </Text>
        )}

        {showPrice && (
          <Text strong style={{ fontSize: 18, color: token.colorError }}>
            {priceText}
          </Text>
        )}

        <Text type="secondary" style={{ fontSize: 12 }}>
          {categoryLabel} · {conditionLabel}
        </Text>
      </Space>
    </Card>
  )
}

export default ItemCard
