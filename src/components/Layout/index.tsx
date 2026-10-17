import type { FC, ReactElement } from 'react'
import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Avatar,
  Badge,
  Button,
  Divider,
  Drawer,
  Dropdown,
  Grid,
  Input,
  Layout as AntLayout,
  Menu,
  Space,
  Tooltip,
  theme,
  Typography,
  message,
} from 'antd'
import type { MenuProps } from 'antd'
import {
  MenuOutlined,
  MessageOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from '@ant-design/icons'

import { useCartStore } from '@/store/useCartStore'
import { useUserStore } from '@/store/useUserStore'

const { Header, Content, Footer } = AntLayout
const { Search } = Input
const { Text } = Typography

/**
 * 未读消息数。
 *
 * 消息接口与页面尚未开发（见 docs/PROGRESS.md 待做），这里先写死 0，
 * 接入后改为由后端未读数驱动。
 */
const UNREAD_MESSAGE_COUNT = 0

/** 顶部导航菜单项（PC 与手机抽屉共用同一份） */
const NAV_ITEMS: MenuProps['items'] = [
  { key: '/', label: <Link to="/">首页</Link> },
  { key: '/barter', label: <Link to="/barter">换物</Link> },
  { key: '/second-hand', label: <Link to="/second-hand">二手</Link> },
  { key: '/publish', label: <Link to="/publish">发布</Link> },
  { key: '/profile', label: <Link to="/profile">我的</Link> },
]

/** 页脚链接（占位） */
const FOOTER_LINKS: string[] = ['关于', '帮助', '联系']

/**
 * 由当前地址推导需要高亮的菜单项。
 *
 * `pathname.startsWith` 让 `/items/1` 这类子路径也能归属到顶层入口；
 * `/items`（不区分换物/二手的全部列表）不属于任何菜单项，返回空串表示不高亮。
 */
const resolveSelectedKey = (pathname: string): string => {
  if (pathname === '/') {
    return '/'
  }
  // 「我的换物」/barters 属于用户中心，先于 /barter 判断，避免被「换物」入口抢走高亮
  if (pathname === '/barters' || pathname.startsWith('/barters/')) {
    return '/profile'
  }
  if (pathname.startsWith('/barter')) {
    return '/barter'
  }
  if (pathname.startsWith('/second-hand')) {
    return '/second-hand'
  }
  if (pathname.startsWith('/publish')) {
    return '/publish'
  }
  if (pathname.startsWith('/profile')) {
    return '/profile'
  }
  return ''
}

/**
 * 顶部搜索：暂未接入搜索接口。
 *
 * 前端只做基础校验——去掉首尾空格后为空则直接忽略，不发无效请求。
 * 接后端后再跳转 `/items?keyword=...`。
 */
const handleSearch = (value: string): void => {
  const keyword = value.trim()
  if (!keyword) {
    return
  }
  // TODO: 搜索接口待开发（见 docs/API.md 待开发接口）
}

/**
 * 全局布局：顶部导航栏 + 内容区 + 页脚。
 *
 * 响应式策略：`Grid.useBreakpoint()` 判断断点，md（≥768px）以下视为手机，
 * 导航菜单折叠进 antd `Drawer`（汉堡按钮唤起），内容区左右内边距同步收窄。
 * 子页面通过 react-router 的 <Outlet /> 渲染在内容区。
 */
const Layout: FC = () => {
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const screens = Grid.useBreakpoint()
  const cartCount = useCartStore((state) => state.items.length)
  const user = useUserStore((state) => state.user)
  const logout = useUserStore((state) => state.logout)
  const [messageApi, contextHolder] = message.useMessage()

  // 登录态来自 useUserStore（启动时由 App.tsx 的 init() 从 localStorage 恢复）
  const loggedIn = user !== null
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false)

  /** md 以下视为手机：导航收进抽屉 */
  const isMobile = !screens.md
  const selectedKey = resolveSelectedKey(pathname)
  const selectedKeys = selectedKey ? [selectedKey] : []

  // 从手机切回桌面时关掉抽屉，避免遮罩残留
  useEffect(() => {
    if (!isMobile) {
      setDrawerOpen(false)
    }
  }, [isMobile])

  const closeDrawer = (): void => setDrawerOpen(false)

  /** 退出登录：清空本地登录态后整页刷新，顺带清掉各页面基于登录态的内存状态 */
  const handleLogout = (): void => {
    logout()
    closeDrawer()
    messageApi.success('已退出登录')
    // 留一点时间让提示可见，再整页刷新
    window.setTimeout(() => window.location.reload(), 300)
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: '我的',
      onClick: () => {
        navigate('/profile')
        // 手机端下拉菜单在抽屉里，跳转后一并收起抽屉
        closeDrawer()
      },
    },
    {
      key: 'barters',
      label: '我的换物',
      onClick: () => {
        navigate('/barters')
        closeDrawer()
      },
    },
    { type: 'divider' },
    { key: 'logout', label: '退出登录', onClick: handleLogout },
  ]

  /** 购物车入口（桌面头部与手机抽屉共用）：购物车页尚未开发，先给出明确反馈 */
  const cartEntry = (
    <Badge count={cartCount} size="small">
      <Tooltip title="购物车">
        <Button
          type="text"
          aria-label="购物车"
          icon={<ShoppingCartOutlined style={{ fontSize: 18 }} />}
          onClick={() => messageApi.info('购物车功能开发中，敬请期待')}
        />
      </Tooltip>
    </Badge>
  )

  /** 消息入口：未读数为 0 时 Badge 不显示红点 */
  const messageEntry = (
    <Badge count={UNREAD_MESSAGE_COUNT} size="small">
      <Tooltip title="消息">
        <Button
          type="text"
          aria-label="消息"
          icon={<MessageOutlined style={{ fontSize: 18 }} />}
          onClick={() => {
            navigate('/messages')
            // 手机端从抽屉跳转后需要收起抽屉，桌面端这里是无副作用的空操作
            closeDrawer()
          }}
        />
      </Tooltip>
    </Badge>
  )

  /**
   * 用户区。
   *
   * 注意：这里的登录态只用于「显示/隐藏入口」的体验优化，
   * 真正的权限判断一律由后端完成（见 docs/SECURITY.md 1.3）。
   */
  const renderUserArea = (block: boolean): ReactElement =>
    loggedIn && user ? (
      <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
        <Space size={8} style={{ cursor: 'pointer', width: block ? '100%' : undefined }}>
          <Avatar
            size="small"
            src={user.avatar || undefined}
            icon={<UserOutlined />}
            style={{ backgroundColor: token.colorPrimary, flexShrink: 0 }}
          />
          <Text ellipsis style={{ maxWidth: 96 }}>
            {user.username}
          </Text>
        </Space>
      </Dropdown>
    ) : (
      <Button
        type="primary"
        block={block}
        onClick={() => {
          navigate('/login')
          closeDrawer()
        }}
      >
        登录
      </Button>
    )

  return (
    <AntLayout style={{ minHeight: '100vh', background: token.colorBgLayout }}>
      {contextHolder}
      <Header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          height: 64,
          padding: isMobile ? '0 12px' : '0 24px',
          lineHeight: 1.5,
          background: token.colorBgContainer,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 8 : 24,
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
              fontSize: isMobile ? 18 : 20,
              fontWeight: 600,
              color: token.colorPrimary,
              whiteSpace: 'nowrap',
            }}
          >
            My Shop
          </Link>

          {/* 桌面：横向菜单占满中间区域 */}
          {!isMobile && (
            <Menu
              mode="horizontal"
              selectedKeys={selectedKeys}
              items={NAV_ITEMS}
              style={{
                flex: 1,
                minWidth: 0,
                background: 'transparent',
                borderBottom: 'none',
              }}
            />
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            {isMobile ? (
              <>
                {cartEntry}
                <Button
                  type="text"
                  aria-label="打开导航菜单"
                  icon={<MenuOutlined style={{ fontSize: 18 }} />}
                  onClick={() => setDrawerOpen(true)}
                />
              </>
            ) : (
              <Space size="middle" align="center" style={{ flexShrink: 0 }}>
                <Search
                  placeholder="搜索物品"
                  allowClear
                  // md～lg 之间宽度收窄，给 5 个导航项留出空间
                  style={{ width: screens.lg ? 200 : 140 }}
                  onSearch={handleSearch}
                />
                {cartEntry}
                {messageEntry}
                {renderUserArea(false)}
              </Space>
            )}
          </div>
        </div>
      </Header>

      {/* 手机端导航抽屉：菜单 + 搜索 + 购物车 + 登录 */}
      {isMobile && (
        <Drawer
          title="My Shop"
          placement="right"
          width={280}
          open={drawerOpen}
          onClose={closeDrawer}
          styles={{ body: { padding: 16 } }}
        >
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Search
              placeholder="搜索物品"
              allowClear
              onSearch={handleSearch}
              enterButton={false}
            />

            <Menu
              mode="inline"
              selectedKeys={selectedKeys}
              items={NAV_ITEMS}
              onClick={closeDrawer}
              style={{ borderInlineEnd: 'none', background: 'transparent' }}
            />

            <Divider style={{ margin: 0 }} />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text type="secondary">购物车</Text>
              {cartEntry}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text type="secondary">消息</Text>
              {messageEntry}
            </div>

            {renderUserArea(true)}
          </Space>
        </Drawer>
      )}

      <Content
        style={{
          width: '100%',
          maxWidth: 1200,
          margin: '0 auto',
          padding: isMobile ? 16 : 24,
        }}
      >
        <Outlet />
      </Content>

      <Footer
        style={{
          padding: isMobile ? '16px 12px' : '24px 16px',
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
