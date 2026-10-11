import type { FC } from 'react'
import { useEffect } from 'react'
import { ConfigProvider } from 'antd'
import type { ThemeConfig } from 'antd'
import zhCN from 'antd/locale/zh_CN'

import AppRouter from '@/router'
import { useUserStore } from '@/store/useUserStore'

/**
 * 全局主题。
 *
 * 主色使用橙色 #fa8c16，贴合「换物」主题（换物标签也用 antd 的 orange）。
 * 这里是主题种子色，属于唯一允许硬编码色值的地方；
 * 组件内一律通过 `theme.useToken()` 取色，不要再写死颜色。
 */
const THEME_CONFIG: ThemeConfig = {
  token: {
    colorPrimary: '#fa8c16',
    colorLink: '#fa8c16',
    colorInfo: '#fa8c16',
    // 卡片 / 大容器圆角，ItemCard、详情页依赖此 token
    borderRadius: 8,
    borderRadiusLG: 12,
  },
  components: {
    // 内容区卡片不加额外边框厚度，视觉更轻
    Card: { headerBg: 'transparent' },
  },
}

const App: FC = () => {
  /**
   * 应用启动时从 localStorage 恢复登录态（token + 用户信息缓存）。
   *
   * init 是幂等的，缓存不存在或已损坏时保持未登录，不会抛错；
   * 之后请求会自动带上 Authorization，由后端判定 token 是否仍然有效
   * （失效时 request.ts 的响应拦截器会清掉本地登录态）。
   */
  useEffect(() => {
    useUserStore.getState().init()
  }, [])

  return (
    <ConfigProvider locale={zhCN} theme={THEME_CONFIG}>
      <AppRouter />
    </ConfigProvider>
  )
}

export default App
