# 编码规范（CONVENTIONS）

> 目标：保持代码风格一致，降低后续 Agent 会话的沟通与返工成本。
> 新增代码请遵循本规范；确有必要的例外，请在提交说明中写清理由。

## 1. 文件命名

| 类型 | 规范 | 示例 |
| --- | --- | --- |
| 组件 | PascalCase | `ItemCard/index.tsx`、`Layout/index.tsx` |
| 页面 | PascalCase | `pages/ItemList.tsx`、`pages/ItemDetail.tsx` |
| 工具 / Hook / store | camelCase | `utils/item.ts`、`utils/cart.ts`、`store/useCartStore.ts` |
| 类型文件 | camelCase | `types/item.ts`、`types/index.ts` |
| 文档 | 大写 | `docs/ARCHITECTURE.md` |

约定：

- 组件一个目录一个组件，入口文件固定为 `index.tsx`（如 `components/ItemCard/index.tsx`）。
- 除组件外的模块直接使用文件名，不再建同名目录。

## 2. 目录组织

按**功能类型**分层，不按页面分文件夹：

```
src/
├── api/          # 请求封装（统一入口 request.ts）
├── components/   # 跨页面复用组件
├── pages/        # 路由级页面
├── router/       # 路由表
├── store/        # Zustand 全局状态
├── types/        # 类型定义
└── utils/        # 纯函数工具
```

新增文件的归属判断：

- 只服务单个页面的组件 → 先考虑留在该页面内；被第二个页面用到时再提取到 `components/`。
- 与后端字段/枚举相关的类型 → `types/`；派生逻辑（中文名、颜色、格式化）→ `utils/`。
- 接口调用 → 统一走 `api/request.ts`，不要直接在页面里 `axios.create`。

导入路径统一使用别名 `@/`，避免 `../../..`；导入分组顺序为：
第三方库 → 项目内部模块 → 类型导入（`import type`）。

## 3. 组件

- 一律使用**函数组件 + Hooks**，不使用 class 组件。
- 组件显式标注类型：`const ItemCard: FC<ItemCardProps> = ({ item }) => { ... }`。
- Props 用 `interface` 定义，紧跟组件定义之前。
- 副作用用 `useEffect`，回调用 `useCallback`，派生值用 `useMemo`；依赖数组必须完整。
- 用 `export default` 导出组件；工具函数用命名导出。
- 组件文件顶部可用简短中文注释说明职责（现有代码风格如此）。

示例：

```tsx
import type { FC } from 'react'

interface ItemCardProps {
  item: Item
}

/** 物品卡片：列表与首页复用 */
const ItemCard: FC<ItemCardProps> = ({ item }) => {
  return <Card title={item.title} />
}

export default ItemCard
```

## 4. 样式

- 只用 **antd 组件 + 内联 style + antd theme token**，不引入额外 CSS 方案
  （不新增 `.css` / `.less` / `styled-components` / tailwind）。
- 颜色、间距优先取主题 token，避免硬编码色值：

```tsx
const { token } = theme.useToken()
// 推荐：color: token.colorPrimaryBg
// 避免：color: '#1677ff'
```

- 全局样式仅 `antd/dist/reset.css`（在 `main.tsx` 引入）。
- 布局用 antd 的 `Row` / `Col` / `Space`，响应式用栅格断点对象：

```tsx
const COL_SPAN = { xs: 24, sm: 12, md: 8, lg: 6 }
```

## 5. 类型

- 所有接口返回统一用 `ApiResult<T>` 包装（定义在 `src/types/index.ts`）：

```ts
const res = await request.get<ApiResult<Item[]>>('/items')
```

- 业务实体与枚举定义在 `src/types/item.ts`，通过 `types/index.ts` 统一导出；
  页面从 `@/types` 导入，不要写深层路径（除非只需要单个枚举时可用 `@/types/item`）。
- 开启严格模式，避免 `any`；确实未知时用 `unknown` 并做收窄。
- 类型导入使用 `import type { ... }`。

## 6. 请求

- **统一使用 `src/api/request.ts` 导出的 `request`**，不要在页面里直接 import `axios`。
- `baseURL` 已经是 `/api`，所以写路径时**省略 `/api` 前缀**：

```ts
request.get<ApiResult<Item[]>>('/items')        // 正确
request.get<ApiResult<Item[]>>('/api/items')    // 错误
```

- 拦截器返回的是后端包装体，调用方需判断 `code`：

```ts
const res = await request.get<ApiResult<Item>>(`/items/${id}`)
if (!res || res.code !== 200 || !res.data) {
  throw new Error(res?.message || `接口返回异常：code=${res?.code}`)
}
```

- 请求失败要处理，不允许静默吞掉：
  - 主流程页面：`messageApi.error(...)` 提示，并展示空态/错误态。
  - 非关键信息（如首页「最新物品」）：可静默降级为空数组，但需注释说明理由。
  - 提示文案用 `utils/error.ts` 的 `getErrorMessage(error, fallback)` 提取：优先用后端
    `message`，网络异常 / 超时给固定中文文案，不要自己拼 `error.response.data.message`。
- 需要在拦截器上做的事（注入 token 等）集中放在 `request.ts`，不要在业务代码里手写请求头。
- HTTP 401（未登录 / token 过期）由 `request.ts` 统一清除本地登录态且**不自动跳转**；
  调用方照常 `catch` 并提示用户（需要登录的操作引导到 `/login`）。
- 并发/竞态：快速切换筛选项等场景用请求序号丢弃过期响应（参考 `ItemList.tsx` 的 `requestIdRef`）。

## 7. 其他

- 提交前确保 `npm run build`（含 `tsc`）通过，不允许留类型错误。
- 不留 `console.log` 调试代码；`PublishItem` 中的 `TODO` 占位在功能实现时一并清理。
- 注释与文档统一使用中文。

## 相关文档

- [ARCHITECTURE.md](./ARCHITECTURE.md) — 架构说明
- [PROGRESS.md](./PROGRESS.md) — 进度与待办
- [API.md](./API.md) — 接口约定
- [SECURITY.md](./SECURITY.md) — 安全底线
