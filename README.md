# My Shop Frontend

## 简介

一个以换物为主、二手为辅的闲置流转平台。

> 早期版本叫「商品（Product）」，现已重构为「物品（Item）」：
> 去掉「新品」概念，把交易模式收敛为 **换物（BARTER）**、**二手（SALE）**、**都可（BOTH）** 三种。

## 技术栈

React 18 + TypeScript + Vite + React Router v6 + Zustand + Axios + Ant Design

| 技术 | 版本 | 说明 |
| --- | --- | --- |
| React | ^18.2.0 | UI 框架（函数组件 + Hooks） |
| TypeScript | ^5.3.0 | 类型系统 |
| Vite | ^5.0.0 | 构建工具 / 开发服务器 |
| React Router | ^6.22.0 | 前端路由 |
| Zustand | ^4.5.0 | 轻量状态管理（购物车） |
| Axios | ^1.6.0 | HTTP 请求 |
| Ant Design | ^5.14.0 | UI 组件库 |
| @ant-design/icons | ^5.6.1 | 图标组件 |

## 环境要求

- Node.js >= 18
- npm >= 9

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器（访问 http://localhost:5173）
npm run dev

# 3. 生产构建（tsc 类型检查 + vite 打包）
npm run build

# 4. 本地预览构建产物
npm run preview
```

如果 npm 官方源较慢，可切换镜像源：

```bash
npm config set registry https://registry.npmmirror.com
```

## 目录结构

```
my-shop-frontend/
├── src/
│   ├── api/              # 接口层
│   │   ├── request.ts    # axios 实例（baseURL: /api，请求拦截器注入 token，响应拦截器返回 data 并处理 401）
│   │   ├── auth.ts       # 用户鉴权接口（注册 / 登录 / 获取当前用户）
│   │   └── barter.ts     # 换物接口（发起换物申请 / 我的换物列表）
│   ├── components/       # 通用组件
│   │   ├── Layout/
│   │   │   └── index.tsx # 全局布局（导航栏 + 内容区 + 页脚，含登录态用户区）
│   │   ├── ItemCard/     # 物品卡片
│   │   │   └── index.tsx
│   │   └── ModeItemList/ # 按交易模式过滤的物品网格（换物页 / 二手页共用）
│   ├── pages/            # 页面
│   │   ├── Home.tsx          # 首页
│   │   ├── ItemList.tsx      # 物品列表（分类 / 成色筛选 + 排序 + 分页）
│   │   ├── ItemDetail.tsx    # 物品详情（发起换物入口）
│   │   ├── Barter.tsx        # 换物页
│   │   ├── BarterApply.tsx   # 发起换物（选我的物品 + 留言）
│   │   ├── Barters.tsx       # 我的换物（我发起 / 我收到，需登录）
│   │   ├── BarterDetail.tsx  # 换物详情（占位，下一步接入）
│   │   ├── SecondHand.tsx    # 二手页
│   │   ├── PublishItem.tsx   # 发布物品
│   │   ├── Messages.tsx      # 消息（占位）
│   │   ├── Videos.tsx        # 视频（占位）
│   │   ├── Profile.tsx       # 我的（展示当前登录用户）
│   │   ├── Login.tsx         # 登录
│   │   └── Register.tsx      # 注册
│   ├── router/           # 路由
│   │   └── index.tsx     # 嵌套路由：<Layout> 作为父级布局，子页面通过 <Outlet /> 渲染
│   ├── store/            # 全局状态
│   │   ├── useCartStore.ts  # 购物车（zustand）
│   │   └── useUserStore.ts  # 登录态（token + 用户信息，持久化到 localStorage）
│   ├── types/            # 类型定义
│   │   ├── item.ts       # Item / ItemMode / ItemCondition / ItemCategory / ItemStatus / Order
│   │   ├── barter.ts     # BarterStatus / BarterRequest（换物申请）
│   │   ├── user.ts       # User（UserVO）/ LoginResponse
│   │   └── index.ts      # 统一出口 + ApiResult<T> 响应包装体
│   ├── utils/            # 工具函数
│   │   ├── item.ts       # 模式 / 分类 / 成色文案与颜色、formatPrice
│   │   ├── barter.ts     # 换物状态文案与颜色、formatBarterTime
│   │   ├── cart.ts       # isPurchasable（是否支持二手下单）
│   │   └── error.ts      # getErrorMessage（从请求异常提取提示文案）
│   ├── App.tsx           # 根组件，渲染路由 + 启动时恢复登录态
│   └── main.tsx          # 入口，挂载 ReactDOM + BrowserRouter
├── docs/                 # 架构 / 接口 / 规范 / 安全 / 进度文档
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── .gitignore
└── README.md
```

## 页面路由

所有页面共用 `src/components/Layout`，路由表定义在 `src/router/index.tsx`：

| 路由 | 页面 | 说明 |
| --- | --- | --- |
| / | Home | 首页 |
| /items | ItemList | 物品列表 |
| /items/:id | ItemDetail | 物品详情（BARTER / BOTH 显示「发起换物」） |
| /barter | Barter | 换物入口 |
| /barter/apply/:itemId | BarterApply | 发起换物（需登录：选我的在架物品 + 留言） |
| /barters | Barters | 我的换物（需登录：全部 / 我发起的 / 我收到的） |
| /barters/:id | BarterDetail | 换物详情（占位，下一步接入真实数据） |
| /second-hand | SecondHand | 二手入口 |
| /publish | PublishItem | 发布物品 |
| /messages | Messages | 消息（占位） |
| /videos | Videos | 视频（占位） |
| /profile | Profile | 我的 |
| /login | Login | 登录 |
| /register | Register | 注册 |

## 用户系统

登录相关代码集中在 `src/api/auth.ts`、`src/store/useUserStore.ts`、`src/pages/Login.tsx`、
`src/pages/Register.tsx` 与 `src/components/Layout/index.tsx`：

- **注册** `/register`：用户名 3~20 位、密码至少 6 位、两次密码需一致；成功后跳转 `/login`。
- **登录** `/login`：成功后保存 token 与用户信息，跳转首页，导航栏显示头像 + 用户名。
- **登录态恢复**：`App.tsx` 启动时调用 `useUserStore.init()`，从 `localStorage` 还原登录态。
- **自动携带 token**：`src/api/request.ts` 的请求拦截器统一注入 `Authorization: Bearer <token>`，
  业务代码不手写该请求头。
- **401 处理**：响应拦截器捕获 HTTP 401（未登录 / token 过期）后清除本地登录态，
  但不自动跳转，由页面决定后续引导（登录页会就地提示错误）。
- **安全约束**：前端**不保存密码**，`localStorage` 只存 `token` 和用户展示信息；
  登录/注册成功后立即清空表单状态；前端的登录态只用于显示/隐藏入口，
  权限最终判断始终在后端（见 [docs/SECURITY.md](docs/SECURITY.md)）。

### 测试账号

| 用户名 | 密码 |
| --- | --- |
| `zhangsan` | `123456` |
| `lisi` | `123456` |

> 这两个账号由后端预置，仅供本地开发联调使用（需先启动后端 `http://localhost:8080`）。

### 本地联调

```bash
# 1. 启动后端（my-shop-backend，端口 8080）
# 2. 启动前端
npm run dev   # http://localhost:5173
# 3. 打开 http://localhost:5173/login 用上面的测试账号登录
```


## 发起换物

换物前端由三处组成：详情页入口 → 发起页 → 提交接口。

- **入口**：`src/pages/ItemDetail.tsx`。`mode` 为 `BARTER` / `BOTH` 时显示「发起换物」按钮；
  未登录点击会提示「请先登录」并跳到 `/login`，已登录则跳到 `/barter/apply/{itemId}`；
  自己的物品会提示「不能对自己发布的物品发起换物」（后端同样会校验）。
- **发起页**：`src/pages/BarterApply.tsx`（路由 `/barter/apply/:itemId`，需登录）。
  - 顶部展示目标物品（图 + 标题 + 模式标签 + 价格）；
  - 表单用 antd `Select` 选择「我提供的物品」，antd `TextArea` 填写留言（选填，≤500）；
  - 提交调用 `src/api/barter.ts` 的 `createBarter()`，成功提示「已发起换物申请」并回到 `/profile`，
    失败按后端 `message` 提示（401 / 403 / 400 / 404）；
  - 没有可用的在架物品时给出空态与「去发布物品」入口。
- **数据来源**：目标物品用 `GET /api/items/{itemId}`；「我的物品」用 `GET /api/items` 全量拉取后
  **前端过滤** `ownerId === 当前用户 && status === 'AVAILABLE'`（后端暂不支持 `ownerId` 参数），
  并剔除目标物品本身。
- **鉴权**：`request.ts` 拦截器自动带 `Authorization: Bearer <token>`，页面不手写请求头；
  登录态只用于引导与显示，物品归属等最终由后端判定（见 [docs/SECURITY.md](docs/SECURITY.md)）。


## 我的换物

`/barters` 是登录用户查看换物申请的主入口（导航栏用户下拉「我的换物」、`/profile` 的「我的换物」卡片都会跳到这里）。

- **入口与登录**：未登录直接访问 `/barters` 会提示「请先登录」并 `replace` 到 `/login`；
  页面内先幂等调用 `useUserStore.getState().init()`，避免刷新时父组件尚未恢复登录态而误跳登录页。
- **数据**：`GET /api/barters?type=all|from|to`，`type` 对应顶部 `Segmented` 的「全部 / 我发起的 / 我收到的」；
  token 由 `request.ts` 拦截器自动携带，方向由后端根据当前用户判定，前端不传 userId。
- **列表**：每条换物展示状态标签（待处理橙 / 已接受绿 / 已拒绝红…）、「我发起的 / 我收到的」标签、
  双方物品 ID（如 `物品 #1 换 物品 #2`）、留言、格式化时间；点击整卡进入 `/barters/:id`。
- **状态处理**：加载中 `Spin`、空态 `Empty`「暂无换物记录」、请求失败 `message.error`；
  用 `requestIdRef` 丢弃过期响应，快速切换筛选也不会串数据。
- **详情占位**：`/barters/:id` 目前由 `BarterDetail.tsx` 渲染「换物详情 #id（开发中）」+「返回列表」按钮，
  下一步接入双方物品、留言、状态流转与接受 / 拒绝操作。
- **展示限制**：后端列表暂未返回物品标题，先用物品 ID 占位；接口补充标题后只需替换 `Barters.tsx` 的展示字段。

## 核心数据模型

`src/types/item.ts` 定义了物品相关的全部类型：

| 类型 | 取值 |
| --- | --- |
| `ItemMode` | `BARTER`（换物） / `SALE`（二手） / `BOTH`（都可） |
| `ItemCondition` | `NEW` / `LIKE_NEW` / `GOOD` / `FAIR` / `POOR` |
| `ItemCategory` | `CAMERA` / `BOOK` / `INSTRUMENT` / `GAME` / `PHONE` / `COMPUTER` / `CLOTHING` / `OTHER` |
| `ItemStatus` | `AVAILABLE` / `LOCKED` / `DONE` / `REMOVED` |

- `mode` 为 `SALE` 或 `BOTH` 时才有 `price`，也是唯一能加入购物车 / 下单的情况（见 `isPurchasable`）。
- `mode` 为 `BARTER` 或 `BOTH` 时才有 `wantCategories` / `wantDescription` / `allowPriceDiff`。


## 后端接口说明

- 后端地址：http://localhost:8080
- 前端请求统一使用 `/api` 前缀（见 `src/api/request.ts` 中的 `baseURL`），开发环境由 Vite 代理转发，`/api` 代理配置见 `vite.config.ts`：

```ts
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
    },
  },
}
```

- 配套后端仓库：https://github.com/chengVV54/my-shop-backend

### 后端统一响应格式

所有接口都返回同一层包装体，`code === 200` 表示成功：

```json
{ "code": 200, "message": "success", "data": [] }
```

`request.ts` 的响应拦截器返回的是 axios 的 `res.data`，也就是这个包装体本身，因此调用方需要自己判断 `code` 并取 `data`：

```ts
const res = await request.get<ApiResult<Item[]>>('/items', { params: { mode } })
if (res.code !== 200) throw new Error(res.message)
setItems(res.data)
```

### 已对接 / 待对接接口

| 方法 | 路径 | 说明 | 状态 |
| --- | --- | --- | --- |
| GET | `/api/items` | 物品列表，支持 `?mode=BARTER/SALE/BOTH` | 已对接（ItemList / Home） |
| GET | `/api/items/{id}` | 物品详情 | 已对接（ItemDetail） |
| POST | `/api/auth/register` | 用户注册，Body `{ username, password }` | 已对接（Register） |
| POST | `/api/auth/login` | 用户登录，返回 `{ token, user }` | 已对接（Login） |
| GET | `/api/auth/me` | 获取当前登录用户，需 `Authorization: Bearer <token>` | 已封装（`api/auth.ts` 的 `getCurrentUser`，暂无页面调用） |
| POST | `/api/barters` | 发起换物申请，Body `{ toItemId, fromItemId, message? }`，需登录 | 已对接（BarterApply） |
| GET | `/api/barters` | 换物申请列表，支持 `?type=all/from/to`，需登录 | 已对接（Barters） |
| GET | `/api/orders` | 二手订单列表 | 待对接 |

> 「物品详情」页的「立即购买 / 联系对方 / 联系卖家」按钮目前只提示「功能开发中」，
> 「发布物品」页的提交同理，尚未写入后端；「发起换物」已接入 `POST /api/barters`。

## 开发进度

- [x] 项目骨架
- [x] 全局 Layout（导航栏 + 页脚）
- [x] 物品列表（对接后端）
- [x] 物品详情（含发起换物入口）
- [x] 发布物品（表单占位）
- [x] 用户系统（注册 / 登录 / 登录态 + 测试账号）
- [x] 发起换物（详情页入口 + `/barter/apply/:itemId` + `POST /api/barters`）
- [x] 我的换物列表（`/barters`：全部 / 我发起的 / 我收到的 + 登录守卫）
- [x] 换物详情占位页（`/barters/:id`）
- [ ] 接受与拒绝换物（依赖后端状态流转接口）
- [ ] 二手下单
- [ ] 消息
- [ ] 个人中心（我的物品 / 我的订单接入真实数据）

## 相关文档

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — 架构说明
- [docs/API.md](docs/API.md) — 接口约定
- [docs/CONVENTIONS.md](docs/CONVENTIONS.md) — 编码规范
- [docs/SECURITY.md](docs/SECURITY.md) — 安全底线
- [docs/PROGRESS.md](docs/PROGRESS.md) — 进度与待办

