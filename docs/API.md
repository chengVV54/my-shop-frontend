# 接口约定（API）

> 后端地址：`http://localhost:8080`
> 前端统一请求前缀：`/api`（开发环境由 Vite 代理转发，见 [ARCHITECTURE.md](./ARCHITECTURE.md)）

## 1. 统一返回格式

所有接口返回统一包装体 `ApiResult<T>`：

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `code` | number | 业务状态码，`200` 表示成功 |
| `message` | string | 提示信息，失败时用于展示 |
| `data` | T | 业务数据，类型由具体接口决定 |

前端类型定义（`src/types/index.ts`）：

```ts
export interface ApiResult<T> {
  code: number
  message: string
  data: T
}
```

**重要**：`src/api/request.ts` 的响应拦截器直接返回 `res.data`，所以调用方拿到的是
**包装体本身**，需要自己判断 `code`，不要写 `res.data.data`：

```ts
const res = await request.get<ApiResult<Item[]>>('/items')
if (!res || res.code !== 200) throw new Error(res?.message)
const items = res.data
```

补充分层：业务失败通过包装体的 `code` / `message` 表达；
鉴权失败（未登录、token 过期或非法）后端返回 **HTTP 401**，此时响应体可能为空。
`src/api/request.ts` 的响应拦截器会捕获 401 并清除本地登录态，调用方仍需 `catch` 并给出提示。

## 2. 已有接口

| 方法 | 路径 | 说明 | 前端使用位置 |
| --- | --- | --- | --- |
| GET | `/api/health` | 健康检查，用于确认后端是否可用 | 暂无（可手工验证） |
| GET | `/api/items` | 物品列表，可选 `mode` 筛选 | `Home.tsx`、`ItemList.tsx` |
| GET | `/api/items/{id}` | 物品详情 | `ItemDetail.tsx` |
| POST | `/api/auth/register` | 用户注册 | `Register.tsx`（经 `api/auth.ts`） |
| POST | `/api/auth/login` | 用户登录，返回 token | `Login.tsx`（经 `api/auth.ts`） |
| GET | `/api/auth/me` | 获取当前登录用户 | 已封装（`api/auth.ts` 的 `getCurrentUser`），暂无页面调用 |
| GET | `/api/barters` | 换物申请列表，可选 `type=all/from/to` | `Barters.tsx`（经 `api/barter.ts`） |
| POST | `/api/barters` | 发起换物申请（需登录） | `BarterApply.tsx`（经 `api/barter.ts`） |
| GET | `/api/orders` | 二手订单列表 | 暂无 |

### GET /api/health

请求参数：无

响应 `data`：由后端定义（通常为状态字符串或对象）。

### GET /api/items

请求参数（query）：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `mode` | `BARTER` \| `SALE` \| `BOTH` | 否 | 不传表示全部 |

> 该接口**不支持 `ownerId` 参数**：需要「某人的物品」时前端全量拉取后自行过滤
> （见「发起换物」页的 `myItems`：`ownerId === 当前用户 && status === 'AVAILABLE'`）。
> 数据量大时应改为服务端筛选。

响应 `data`：`Item[]`

前端调用示例：

```ts
// 全部
await request.get<ApiResult<Item[]>>('/items')
// 指定模式
await request.get<ApiResult<Item[]>>('/items', { params: { mode: 'BARTER' } })
```

### GET /api/items/{id}

路径参数：`id`（number，物品 ID）

响应 `data`：`Item`

### POST /api/auth/register

请求体：

```json
{ "username": "string", "password": "string" }
```

响应 `data`：`User`（后端 `UserVO`）。

前端实现：`src/api/auth.ts` 的 `register()`，由 `Register.tsx` 调用；
前端只做基础校验（用户名 3~20 位、密码 ≥6 位、两次一致），唯一性等最终校验在后端。
**注册接口不返回登录态**，注册成功后前端跳转 `/login` 由用户换取 token。

### POST /api/auth/login

请求体：

```json
{ "username": "string", "password": "string" }
```

响应 `data`：`LoginResponse`，即 `{ "token": "string", "user": User }`。

前端实现：`src/api/auth.ts` 的 `login()`，由 `Login.tsx` 调用；
成功后经 `useUserStore.login(user, token)` 写入 Zustand 与 `localStorage`，
并跳转首页。密码不落任何存储，成功后立即清空表单。

### GET /api/auth/me

请求头：`Authorization: Bearer <token>`

响应 `data`：`User`（当前登录用户）。

前端实现：`src/api/auth.ts` 的 `getCurrentUser()`。
token 失效时后端返回 **HTTP 401**，由 `request.ts` 的响应拦截器统一清除本地登录态。

### 鉴权约定（前端侧）

| 项目 | 约定 |
| --- | --- |
| token 存储 | `localStorage`，键名 `token`（见 `store/useUserStore.ts`） |
| 用户信息缓存 | `localStorage`，键名 `user`；只存 `id` / `username` / `avatar` / `credit` / `createdAt` 等展示字段，**不含密码** |
| 请求头注入 | `request.ts` 请求拦截器统一加 `Authorization: Bearer <token>`，业务代码不手写 |
| 登录态恢复 | `App.tsx` 启动时调用 `useUserStore.init()` 读取上述两个键 |
| 401 处理 | 响应拦截器执行 `useUserStore.logout()` 清除本地登录态，**不自动跳转**，由页面决定后续引导 |
| 登录前置页面 | `/barter/apply/:itemId`、`/barters` 在页面内判断登录态：未登录提示后 `replace` 到 `/login`（尚未做统一路由守卫） |
| 权限判断 | 前端登录态只用于显示/隐藏入口，权限最终判断一律在后端 |

> 注意：`user` 缓存只是「先渲染再校验」的显示优化；需要权威数据时调用 `GET /api/auth/me`。

### GET /api/barters

请求头：`Authorization: Bearer <token>`（**必须有**，未登录返回 HTTP 401）

请求参数（query）：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `type` | `from` \| `to` \| `all` | 否 | 视角筛选：`from` 我发起的、`to` 我收到的、`all` 全部；不传等于 `all` |

响应 `data`：`BarterRequest[]`，示例：

```json
{
  "code": 200,
  "data": [
    {
      "id": 3,
      "fromUserId": 1,
      "toUserId": 2,
      "fromItemId": 1,
      "toItemId": 2,
      "message": "换吗？",
      "priceDiff": 0,
      "status": "PENDING",
      "createdAt": "2026-10-16 23:59:44"
    }
  ]
}
```

前端实现（`src/api/barter.ts` + `src/pages/Barters.tsx`）：

```ts
// 统一走 request，token 由 request.ts 拦截器自动注入
const res = await getBarters({ type: 'all' }) // 'all' | 'from' | 'to'
if (!res || res.code !== 200) throw new Error(res?.message)
setBarters(Array.isArray(res.data) ? res.data : [])
```

- 页面 `/barters` 需登录：未登录先 `message.warning('请先登录')` 再 `navigate('/login', { replace: true })`；
  直接刷新时先幂等执行 `useUserStore.getState().init()` 恢复 localStorage 登录态，避免误跳登录页。
- 顶部 `Segmented` 切换「全部 / 我发起的 / 我收到的」，切换即按新的 `type` 重新请求；
  用 `requestIdRef` 丢弃过期响应（参考 `ItemList.tsx`）。
- 方向（我发起 / 我收到）以 `fromUserId === 当前用户 id` 判断；后端已按 token 过滤，
  `type` 只是视角参数，前端不传 userId。
- 列表暂未返回物品标题，页面用「物品 #fromItemId 换 物品 #toItemId」占位；
  状态标签文案与颜色统一来自 `src/utils/barter.ts`（`getBarterStatusLabel` / `getBarterStatusColor`）。
- 单条详情 `/barters/:id` 当前是占位页（`BarterDetail.tsx`），尚未调用单条详情接口。

### POST /api/barters（发起换物）

请求头：`Authorization: Bearer <token>`（**必须有**，未登录返回 HTTP 401）

请求体：

```json
{
  "toItemId": 2,
  "fromItemId": 1,
  "message": "换吗？"
}
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `toItemId` | number | 是 | 我想换的物品（目标物品） |
| `fromItemId` | number | 是 | 我提供的物品，必须是本人的在架物品 |
| `message` | string | 否 | 留言，≤500 字 |

响应 `data`：`BarterRequest`（后端 `BarterRequestVO`）。

错误码（前端只负责按后端 `message` 提示，最终判断在后端）：

| 状态 | 含义 |
| --- | --- |
| 401 | 未登录 / token 失效（`request.ts` 拦截器清除本地登录态） |
| 404 | 物品不存在 |
| 400 | 物品不可换 / 不能和自己换 / 已发起过换物申请 |
| 403 | 只能用自己的物品发起换物 |

前端接入（`src/api/barter.ts` + `src/pages/BarterApply.tsx`）：

- 页面「目标物品」来自 `GET /api/items/{itemId}`，「我的物品」来自 `GET /api/items` 前端过滤；
- 表单校验只做「必须选一件物品」与留言长度，提交时把留言 `trim()`，空串不发送；
- 未登录直接跳 `/login`；提交成功后提示「已发起换物申请」并跳 `/profile`；
- 失败用 `utils/error.ts` 的 `getErrorMessage()` 取后端 `message`，不自行编造原因。

### GET /api/orders

请求参数：无

响应 `data`：`Order[]`

## 3. 待开发接口（预留）

以下接口尚未实现，前端相关页面也未接入；路径与字段为约定草案，实现时以本文档更新为准。

| 方法 | 路径 | 说明 | 对应待办 |
| --- | --- | --- | --- |
| POST | `/api/items` | 发布物品（真实写库） | 发布物品 |

### POST /api/items

请求头：`Authorization: Bearer <token>`

请求体（草案，对应 `PublishItem` 表单字段）：

```json
{
  "title": "string",
  "category": "CAMERA",
  "condition": "LIKE_NEW",
  "description": "string",
  "mode": "BARTER",
  "price": 399,
  "wantCategories": ["BOOK"],
  "wantDescription": "string",
  "allowPriceDiff": true
}
```

响应 `data`：新建的 `Item`。

## 4. 核心数据模型

定义位置：`src/types/item.ts`（物品、订单）、`src/types/barter.ts`（换物申请）、
`src/types/user.ts`（用户），由 `src/types/index.ts` 统一导出。

### User（后端 `UserVO`）

```ts
interface User {
  id: number
  username: string
  avatar?: string
  credit: number
  createdAt?: string
}

interface LoginResponse {
  token: string
  user: User
}
```

### Item

```ts
interface Item {
  id: number
  title: string
  images: string[]
  description: string
  category: ItemCategory
  condition: ItemCondition
  ownerId: number
  mode: ItemMode
  price?: number              // 仅 SALE / BOTH
  wantCategories?: ItemCategory[]  // 仅 BARTER / BOTH
  wantDescription?: string    // 仅 BARTER / BOTH
  allowPriceDiff?: boolean
  status: ItemStatus
  createdAt: string
}
```

### 枚举

| 枚举 | 取值 |
| --- | --- |
| `ItemMode` | `BARTER`（换物）/ `SALE`（二手）/ `BOTH`（都可） |
| `ItemCondition` | `NEW` / `LIKE_NEW` / `GOOD` / `FAIR` / `POOR` |
| `ItemCategory` | `CAMERA` / `BOOK` / `INSTRUMENT` / `GAME` / `PHONE` / `COMPUTER` / `CLOTHING` / `OTHER` |
| `ItemStatus` | `AVAILABLE`（在架）/ `LOCKED`（交易中）/ `DONE`（已完成）/ `REMOVED`（已下架） |
| `BarterStatus` | `PENDING` / `ACCEPTED` / `REJECTED` / `DONE` / `CANCELLED` |
| `OrderStatus` | `PENDING` / `PAID` / `SHIPPED` / `DONE` / `CANCELLED` |

### BarterRequest（`src/types/barter.ts`）

```ts
type BarterStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'DONE' | 'CANCELLED'

interface BarterRequest {
  id: number
  fromUserId: number
  toUserId: number
  fromItemId: number
  toItemId: number
  message?: string      // 选填留言
  priceDiff: number     // 差价，由后端计算
  status: BarterStatus
  createdAt: string
}

/** POST /api/barters 的请求体 */
interface BarterApplyPayload {
  toItemId: number
  fromItemId: number
  message?: string
}
```

> 方向约定：`from*` 是**我提供的**，`to*` 是**我想换的**，与请求体字段保持一致。

### Order

```ts
interface Order {
  id: number
  buyerId: number
  sellerId: number
  itemId: number
  price: number
  address: string
  status: OrderStatus
  createdAt: string
}
```

枚举 → 中文文案由 `src/utils/item.ts` 统一提供（`getModeLabel` / `getConditionLabel` /
`getCategoryLabel` / `getStatusLabel` 等），换物状态由 `src/utils/barter.ts` 的
`getBarterStatusLabel` / `getBarterStatusColor` 提供，不要在各页面重复写映射表。

## 相关文档

- [ARCHITECTURE.md](./ARCHITECTURE.md) — 架构说明
- [PROGRESS.md](./PROGRESS.md) — 进度与待办
- [CONVENTIONS.md](./CONVENTIONS.md) — 编码规范
- [SECURITY.md](./SECURITY.md) — 安全底线
