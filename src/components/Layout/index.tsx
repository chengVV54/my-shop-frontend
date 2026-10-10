import type { FC } from 'react'
import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import {
  Avatar,
  Badge,
  Button,
  Divider,
  Dropdown,
  Input,
  Layout as AntLayout,
  Menu,
  Space,
  theme,
  Typography,
} from 'antd'
import type { MenuProps } from 'antd'
import { ShoppingCartOutlined, UserOutlined } from '@ant-design/icons'

import { useCartStore } from '@/store/useCartStore'

const { Header, Content, Footer } = AntLayout
const { Search } = Input
const { Text } = Typography

/** 顶部导航菜单项 */
const NAV_ITEMS: MenuProps['items'] = [
  { key: '/', label: <Link to="/">首页</Link> },
  { key: '/items', label: <Link to="/items">物品</Link> },
  { key: '/publish', label: <Link to="/publish">发布</Link> },
]

/** 页脚链接（占位） */
const FOOTER_LINKS: string[] = ['关于', '帮助', '联系']

/** 由当前地址推导需要高亮的菜单项，/items/1 这类子路径也归属 /items */
const resolveSelectedKey = (pathname: string): string => {
  if (pathname.startsWith('/items')) {
    return '/items'
  }
  if (pathname.startsWith('/publish')) {
    return '/publish'
  }
  return '/'
}

/**
 * 全局布局：顶部导航栏 + 内容区 + 页脚。
 *
 * 子页面通过 react-router 的 <Outlet /> 渲染在内容区。
 */
const Layout: FC = () => {
  const { token } = theme.useToken()
  const { pathname } = useLocation()
  const cartCount = useCartStore((state) => state.items.length)

  // 登录状态暂用本地静态状态模拟，后续接入真实用户体系后替换
  const [loggedIn, setLoggedIn] = useState<boolean>(false)

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', label: '个人中心' },
    { key: 'orders', label: '我的订单' },
    { type: 'divider' },
    { key: 'logout', label: '退出登录', onClick: () => setLoggedIn(false) },
  ]

  return (
    <AntLayout style={{ minHeight: '100vh', background: token.colorBgLayout }}>
      <Header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          height: 64,
          padding: '0 24px',
          lineHeight: 1.5,
          background: token.colorBgContainer,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            width: '100%',
            maxWidth: 1200,
            height: '100%',
            margin: '0 auto',
          }}
        >
          <Link
            to="/"
            style={{
              flexShrink: 0,
              fontSize: 20,
              fontWeight: 600,
              color: token.colorPrimary,
              whiteSpace: 'nowrap',
            }}
          >
            My Shop
          </Link>

          <Menu
            mode="horizontal"
            selectedKeys={[resolveSelectedKey(pathname)]}
            items={NAV_ITEMS}
            style={{
              flex: 1,
              minWidth: 0,
              background: 'transparent',
              borderBottom: 'none',
            }}
          />

          <Space size="middle" align="center" style={{ flexShrink: 0 }}>
            <Search placeholder="搜索物品" allowClear style={{ width: 200 }} />

            <Badge count={cartCount} size="small">
              <Button
                type="text"
                aria-label="购物车"
                icon={<ShoppingCartOutlined style={{ fontSize: 18 }} />}
              />
            </Badge>

            {loggedIn ? (
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
                <Space size={8} style={{ cursor: 'pointer' }}>
                  <Avatar size="small" style={{ backgroundColor: token.colorPrimary }}>
                    <UserOutlined />
                  </Avatar>
                  <Text>用户</Text>
                </Space>
              </Dropdown>
            ) : (
              <Button type="primary" onClick={() => setLoggedIn(true)}>
                登录
              </Button>
            )}
          </Space>
        </div>
      </Header>

      <Content
        style={{
          width: '100%',
          maxWidth: 1200,
          margin: '0 auto',
          padding: 24,
        }}
      >
        <Outlet />
      </Content>

      <Footer
        style={{
          padding: '24px 16px',
          textAlign: 'center',
          background: 'transparent',
        }}
      >
        <Space direction="vertical" size={8}>
          <Text type="secondary">My Shop ©2026</Text>
          <Space split={<Divider type="vertical" />} size={4}>
            {FOOTER_LINKS.map((link) => (
              <a key={link} href="#">
                {link}
              </a>
            ))}
          </Space>
        </Space>
      </Footer>
    </AntLayout>
  )
}

export default Layout
