# 架构说明（ARCHITECTURE）

> 本文档描述 `my-shop-frontend` 的整体架构，供后续 Agent 会话快速建立上下文。
> 内容如与代码不一致，以代码为准，并请同步更新本文档。

## 1. 项目定位

`my-shop` 是一个「换物为主、二手为辅」的闲置交易平台。本仓库是**前端**部分，
后端独立运行在 `http://localhost:8080`。

## 2. 技术栈

| 领域 | 选型 | 版本 |
| --- | --- | --- |
| 框架 | React | ^18.2.0 |
| 语言 | TypeScript | ^5.3.0 |
| 构建 | Vite | ^5.0.0 |
| 路由 | React Router | ^6.22.0（`react-router-dom`） |
| 状态管理 | Zustand | ^4.5.0 |
| HTTP | Axios | ^1.6.0 |
| UI 组件库 | Ant Design | ^5.14.0（`antd` + `@ant-design/icons`） |

补充：

- 包管理器使用 npm（仓库内有 `package-lock.json`）。
- 模块别名 `@` 指向 `src`（见 `vite.config.ts` 的 `resolve.alias`）。
- 入口 `index.html` → `src/main.tsx`，`main.tsx` 中挂载 `<BrowserRouter>` 并引入 `antd/dist/reset.css`。

常用命令：

```bash
npm run dev      # 开发服务器，端口 5173
npm run build    # tsc && vite build
npm run preview  # 预览构建产物
```

## 3. 目录结构

```
my-shop-frontend/
├── index.html              # HTML 模板，含 #root 挂载点与 viewport（响应式前提）
├── vite.config.ts          # 别名 @ -> src、开发端口、/api 代理
├── tsconfig.json           # TS 配置
└── src/
    ├── main.tsx            # 应用入口：ReactDOM + BrowserRouter
    ├── App.tsx             # 根组件：ConfigProvider（主题/中文 locale）+ 路由 + 启动时恢复登录态
    ├── api/                # HTTP 层，统一封装 axios
    │   ├── request.ts      # axios 实例 + 拦截器（注入 token / 返回 data / 401 清登录态）+ Request 类型
    │   ├── auth.ts         # 鉴权接口：register / login / getCurrentUser
    │   └── barter.ts       # 换物接口：createBarter / getBarters
    ├── components/         # 可复用展示型组件，一个组件一个目录
    │   ├── Layout/         # 全局布局：顶部导航(响应式，含登录态用户区) + 内容区(Outlet) + 页脚
    │   ├── ItemCard/       # 物品卡片（hover 阴影/圆角/标签）
    │   └── ModeItemList/   # 按交易模式过滤的物品网格（换物页 / 二手页共用）
    ├── pages/              # 路由级页面组件
    │   ├── Home.tsx        # 首页：Hero + 热门分类 + 最新发布
    │   ├── ItemList.tsx    # 物品列表：模式/分类/成色筛选 + 排序 + 分页
    │   ├── ItemDetail.tsx  # 物品详情（含卖家信息区 + 发起换物入口）
    │   ├── Barter.tsx      # 换物页（BARTER / BOTH）
    │   ├── BarterApply.tsx # 发起换物（选我的在架物品 + 留言，提交 POST /api/barters）
    │   ├── Barters.tsx     # 我的换物（GET /api/barters?type=all|from|to，需登录）
    │   ├── BarterDetail.tsx # 换物详情占位页（/barters/:id，开发中）
    │   ├── SecondHand.tsx  # 二手页（SALE / BOTH）
    │   ├── PublishItem.tsx # 发布物品（表单占位，未写库）
    │   ├── Messages.tsx    # 消息页（占位：会话列表 + 聊天区）
    │   ├── Videos.tsx      # 视频页（占位）
    │   ├── Profile.tsx     # 我的页（登录用户信息 + 三块卡片）
    │   ├── Login.tsx       # 登录页
    │   └── Register.tsx    # 注册页
    ├── router/             # 路由表
    │   └── index.tsx       # AppRouter：嵌套在 <Layout> 下的路由（含 /login、/register）
    ├── store/              # Zustand 全局状态
    │   ├── useCartStore.ts # 购物车（仅 SALE / BOTH 物品可加入）
    │   └── useUserStore.ts # 登录态：user / token + init / login / logout（持久化 localStorage）
    ├── types/              # 类型定义
    │   ├── index.ts        # 统一出口 + ApiResult<T>
    │   ├── item.ts         # Item / Order 及枚举
    │   ├── barter.ts       # BarterStatus / BarterRequest / BarterApplyPayload
    │   └── user.ts         # User（后端 UserVO）/ LoginResponse
    └── utils/              # 纯函数工具
        ├── item.ts         # 枚举中文名、Tag 颜色、价格格式化
        ├── barter.ts       # 换物状态中文名 / Tag 颜色、换物时间格式化
        ├── cart.ts         # isPurchasable 等购物车相关判断
        └── error.ts        # getErrorMessage：从请求异常提取提示文案
```

## 4. 路由结构

`src/router/index.tsx` 使用嵌套路由，所有页面共用 `Layout`：

| 路径 | 页面 | 说明 |
| --- | --- | --- |
| `/` | `Home` | 首页：Hero + 热门分类 8 个入口 + 最新 8 件物品 |
| `/items` | `ItemList` | 物品列表：模式 / 分类 / 成色筛选 + 排序 + 分页（每页 12 条，前端计算） |
| `/items/:id` | `ItemDetail` | 物品详情（卖家信息区 + 收藏占位；BARTER / BOTH 显示「发起换物」入口） |
| `/barter` | `Barter` | 换物入口：只展示 `BARTER` / `BOTH` |
| `/barter/apply/:itemId` | `BarterApply` | 发起换物：用「我的在架物品」换 `:itemId` 这件物品（需登录，未登录跳 `/login`） |
| `/barters` | `Barters` | 我的换物：全部 / 我发起的 / 我收到的（需登录，未登录跳 `/login`） |
| `/barters/:id` | `BarterDetail` | 换物详情占位页：显示「换物详情 #id（开发中）」+ 返回列表 |
| `/second-hand` | `SecondHand` | 二手入口：只展示 `SALE` / `BOTH` |
| `/publish` | `PublishItem` | 发布表单（当前仅 `console.log`，未提交后端） |
| `/messages` | `Messages` | 消息（占位）：左侧 mock 会话列表 + 右侧聊天区 |
| `/videos` | `Videos` | 视频（占位，仅空态） |
| `/profile` | `Profile` | 我的：当前登录用户信息 + 我的物品 / 换物 / 订单（换物卡片已链接 `/barters`，其余仍为空态） |
| `/login` | `Login` | 登录（居中 Card，成功后保存登录态并跳首页） |
| `/register` | `Register` | 注册（成功后跳 `/login`） |

补充：

- 顶部导航只有「首页 / 换物 / 二手 / 发布 / 我的」五个入口；`/items` 属于不分模式的
  「逛一逛」列表，不在导航中，因此 `resolveSelectedKey` 对它返回空串（不高亮任何菜单）。
- `/messages`、`/videos` 通过导航右侧消息图标与直接访问进入，不占用主导航项。
- `/login`、`/register` 也挂在 `<Layout>` 下（共用顶部导航与页脚）。
- 「换物」「二手」两个入口都需要包含 `BOTH`，而后端 `GET /api/items` 的 `mode` 参数只支持单值，
  因此 `ModeItemList` 请求一次全量后在**前端**过滤（`modes.includes(item.mode)`）；
  同理列表页的筛选 / 排序 / 分页也都在前端完成，数据量大时应改为服务端分页与筛选。
- `/barter/apply/:itemId` 与 `/barters` 是**两个带登录前置判断的页面**：
  `BarterApply` 由 `ItemDetail` 的「发起换物」按钮在未登录时提示并跳 `/login`，
  页面自身在 `useEffect` 里再判断一次，未登录直接 `replace` 到 `/login`；
  `Barters` 同样在 `useEffect` 里先判断登录态，未登录 `message.warning('请先登录')` 后 `replace`。
  注意顺序问题：`App.tsx` 的 `useUserStore.init()`（恢复 localStorage 登录态）写在**父组件**的
  `useEffect` 里，而子组件 effect 先执行，所以直接刷新 `/barter/apply/1` 或 `/barters` 时 store 里的
  `user` 仍是 `null`。这两个页面因此都先调用一次幂等的 `useUserStore.getState().init()` 再读登录态，
  否则会把已登录用户误弹到登录页。这是当前「没有全局路由守卫」的临时处理，
  后续做统一守卫时（见 docs/SECURITY.md 待做）应一并收敛。
- 导航高亮：`Layout` 的 `resolveSelectedKey` 先把 `/barters` 与 `/barters/:id` 归到「我的」（`/profile`），
  再判断 `/barter`，否则 `pathname.startsWith('/barter')` 会把「我的换物」误归到「换物」入口。
- 「我的物品」列表用 `GET /api/items` 全量拉取后前端过滤
  （`ownerId === 当前用户 && status === 'AVAILABLE'`，并剔除目标物品本身），
  因为后端 `GET /api/items` 不支持 `ownerId` 参数。

## 5. 数据流

```
浏览器 UI (pages/components)
        │  调用 request.get / post ...
        ▼
src/api/request.ts    axios 实例 (baseURL: "/api", timeout: 10000)
        │  请求拦截器：从 useUserStore 取 token，注入 Authorization: Bearer <token>
        │  响应拦截器：直接返回 res.data（后端包装体）；HTTP 401 时清除本地登录态
        ▼
开发代理 vite server.proxy: /api -> http://localhost:8080
        │
        ▼
后端服务 (localhost:8080)  ──►  数据库
        │
        ▼
返回包装体 { code, message, data }
        │  调用方判断 code === 200 后取 data
        ▼
setState / Zustand 更新  →  React 重新渲染
```

关键约定：**响应拦截器已经把 `AxiosResponse` 换成了 `res.data`**，因此调用方拿到的是
后端包装体本身，需要自己判断 `code` 并取 `data`，不要写 `res.data.data`。

鉴权链路：登录成功后 `useUserStore.login()` 把 `token` 写入 `localStorage`；
之后所有经 `request` 发出的请求自动带上 `Authorization` 头。若后端返回 **HTTP 401**
（未登录 / token 过期），响应拦截器调用 `useUserStore.logout()` 清除本地登录态并继续抛出错误，
**不自动跳转**，由页面决定提示与引导（见 docs/SECURITY.md 1.2）。

页面典型写法（以 `ItemList.tsx` 为例，`mode` 参数可选、不传表示全部）：

```ts
const res = await request.get<ApiResult<Item[]>>('/items')

if (!res || res.code !== 200) {
  throw new Error(res?.message || `接口返回异常：code=${res?.code}`)
}
setItems(Array.isArray(res.data) ? res.data : [])
```

## 6. 状态管理

- **全局状态**：Zustand，两个 store：
  - `useCartStore`（购物车：`items` / `add` / `remove` / `clear`），只有 `SALE` / `BOTH` 物品能加入；
  - `useUserStore`（登录态：`user` / `token` + `init` / `login` / `logout`），
    `login` / `logout` 同步读写 `localStorage` 的 `token`、`user` 两个键，
    `init` 供 `App.tsx` 启动时恢复登录态。只存 token 与非敏感展示信息，**不存密码**。
- **局部状态**：页面内 `useState` / `useEffect`；导航消息未读数是 `Layout` 内的模块级常量
  （`UNREAD_MESSAGE_COUNT = 0`），接入消息接口后改为后端未读数。
- **登录态的使用**：`Layout` 的用户区、`Profile` 页的用户信息都订阅 `useUserStore`；
  只有 `src/api/request.ts` 通过 `useUserStore.getState()` 读取 token 注入请求头。
  登录态仅用于显示/隐藏入口，权限判断在后端（见 docs/SECURITY.md 1.3）。

## 7. 后端与代理

- 后端地址：`http://localhost:8080`
- 前端统一以 `/api` 为前缀请求，由 Vite 开发代理转发（`changeOrigin: true`）。
- 生产环境没有该代理，需要由 Nginx 等反向代理或网关把 `/api` 转发到后端。

配置位置：`vite.config.ts`

```ts
server: {
  port: 5173,
  proxy: {
    '/api': { target: 'http://localhost:8080', changeOrigin: true },
  },
}
```

接口清单见 [API.md](./API.md)。

## 8. 主题与响应式

### 主题

`src/App.tsx` 用 antd `ConfigProvider` 统一配置主题与中文 locale：

- 主色 `colorPrimary` / `colorLink` / `colorInfo` = `#fa8c16`（橙色，贴合换物主题）
- 圆角 `borderRadius` 8 / `borderRadiusLG` 12
- `locale={zhCN}`，让 antd 内置文案（分页、空态、弹窗按钮等）为中文

约定：`App.tsx` 是唯一允许写死色值的地方（主题种子色）；组件内一律 `theme.useToken()` 取色。
标签颜色统一由 `src/utils/item.ts` 的 `getModeColor` / `getStatusColor` 提供，
卡片与详情页共用同一映射，避免同一模式在不同页面颜色不一致。

### 响应式

- `index.html` 已声明 `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`。
- 断点判断统一用 antd `Grid.useBreakpoint()`；本项目的约定是 **`md`（≥768px）以下视为手机**：

```tsx
const screens = Grid.useBreakpoint()
const isMobile = !screens.md
```

- 导航栏：桌面为 Logo + 横向菜单（首页 / 换物 / 二手 / 发布 / 我的）+ 搜索 + 购物车 + 消息 + 用户区；
  手机为 Logo + 购物车 + 汉堡按钮，菜单/搜索/购物车/消息/用户区收进 antd `Drawer`。
- 列表/首页：`Row` + `Col` 栅格 `{ xs: 24, sm: 12, md: 8, lg: 6 }`；
  首页「热门分类」用 `{ xs: 12, sm: 8, md: 6, lg: 3 }`（桌面一行 8 个）。
- 消息页：`Col xs={24} md={9}`（会话列表）+ `Col xs={24} md={15}`（聊天区），手机上下排列。
- 详情页：`Col xs={24} md={10}`（左图）+ `Col xs={24} md={14}`（右信息），
  手机上下排列（图片 240 高），桌面左右排列（图片 360 高）。

## 9. 相关文档

- [PROGRESS.md](./PROGRESS.md) — 进度与待办
- [API.md](./API.md) — 接口约定
- [CONVENTIONS.md](./CONVENTIONS.md) — 编码规范
- [SECURITY.md](./SECURITY.md) — 安全底线
