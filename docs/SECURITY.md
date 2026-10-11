# 安全底线（SECURITY）

> 以下条款是**必须遵守**的硬性约束，任何功能开发都不得违反。
> 前端只负责体验与基础校验，**最终的安全判断永远在后端**。

## 1. 安全底线（必须遵守）

### 1.1 密码不存前端，登录后只存 token

- 绝不在 `localStorage` / `sessionStorage` / Zustand / 组件状态 / 日志中保存用户密码、
  密码哈希或任何可还原密码的信息。
- 注册/登录表单中的密码仅在提交请求时使用，提交完成后立即清除表单状态。
- 登录成功后前端只保存后端返回的 `token`；用户信息按需通过 `GET /api/auth/me` 获取。

**当前实现（用户系统，见 `pages/Login.tsx` / `pages/Register.tsx` / `store/useUserStore.ts`）**：

- 密码只作为 `POST /api/auth/login`、`POST /api/auth/register` 的请求体字段，
  不进入 Zustand、不写入 storage、不打印日志。
- 登录 / 注册成功后立即 `form.resetFields()` 清空表单，避免密码残留在组件状态中。
- `useUserStore` 只持久化两项：`token` 与 `user`（`id` / `username` / `avatar` /
  `credit` / `createdAt` 等展示字段，不含敏感信息）。
- `user` 缓存仅用于首屏渲染；需要权威数据时应调用 `getCurrentUser()`（`GET /api/auth/me`）
  重新拉取，后端始终是身份的唯一来源。

### 1.2 token 存 localStorage，请求时放 Authorization: Bearer xxx

- token 存放：`localStorage`（键名统一，如 `token`；新增键名需在此登记）。
- 所有需要鉴权的请求带请求头：

```
Authorization: Bearer <token>
```

- 注入位置：统一在 `src/api/request.ts` 的**请求拦截器**中完成，
  业务代码不得手写 `Authorization` 头。
- token 失效（后端返回未授权/401）：清除本地 token，回到未登录状态并提示重新登录。

**已登记的 localStorage 键名**：

| 键名 | 内容 | 说明 |
| --- | --- | --- |
| `token` | 后端签发的 token 字符串 | 唯一的凭证，请求时自动放到 `Authorization` 头 |
| `user` | 用户展示信息 JSON | 非敏感缓存（`id` / `username` / `avatar` / `credit` / `createdAt`），损坏时丢弃 |

**401 处理（已实现）**：`request.ts` 的响应拦截器发现 `error.response.status === 401`
即调用 `useUserStore.logout()` 清除上述两个键并回到未登录态。
拦截器**不自动跳转**（避免在登录页自身报错时被弹走），由页面决定后续引导：
登录/注册页就地提示错误，需要登录的操作应在页面内提示「请先登录」。

### 1.3 不在前端做权限判断

- 前端可以根据登录态/角色**隐藏入口、优化体验**（如隐藏「发布」按钮），
  但**不得**把前端的显示/隐藏当作权限控制。
- 所有涉及数据归属与权限的操作（改物品、接受换物、取消订单等）必须由后端校验
  请求者身份与资源归属；前端默认「后端可能拒绝」，并且必须处理被拒绝的返回。
- 任何「只在前端校验」的写操作都视为缺陷。

当前实现：`Layout` 的用户区（登录按钮 / 头像下拉菜单）与 `Profile` 页的用户信息
都根据 `useUserStore` 的登录态切换，这些仅属展示层；
后端仍必须对每个写操作独立校验 token 与资源归属，前端默认「可能被拒绝」并处理失败返回。

### 1.4 用户输入要校验

- **前端做基础校验**：必填、长度、格式、数值范围等，用于即时反馈、减少无效请求。
  - 统一使用 antd `Form` 的 `rules`（参考 `PublishItem.tsx`）。
  - 价格等数值字段用 `InputNumber` 并限制 `min` / `precision`。
- **后端做最终校验**：前端校验可被绕过，后端必须独立校验全部入参。
- 渲染用户输入内容时按文本渲染，不使用 `dangerouslySetInnerHTML`。

### 1.5 不把密钥、敏感信息写在前端代码里

- 严禁在前端代码、`.env`（提交到仓库的）、注释、mock 数据中出现：
  数据库连接串、私钥、第三方 SecretKey、短信/支付等服务的密钥、后端内部地址与账号。
- 前端可见的一切（打包产物、网络请求）都视为公开信息；需要密钥的操作必须由后端代理。
- 环境变量仅用于**非敏感**配置（如接口前缀）；`VITE_` 前缀变量会进入产物，同样不可放密钥。
- 不提交 `node_modules`、本地 `.env.local` 等文件（见 `.gitignore`）。

## 2. 待做（后期补）

以下为已知缺口，当前尚未实现，实现前不要假设已有防护。

- [ ] **XSS 防护**
  - 梳理所有渲染用户内容的位置，确保走 React 文本插值（默认转义）。
  - 若确需渲染富文本，引入成熟库（如 DOMPurify）做白名单清洗，禁止直接注入 HTML。
  - 后端返回的 `message`、物品描述等内容展示前同样按不可信数据处理。
- [ ] **CSRF 防护**
  - 明确鉴权方式：当前设计为 `Authorization: Bearer`（非 Cookie 自动携带），
    天生对传统 CSRF 免疫；若后续改用 Cookie 会话，必须补充 CSRF token 或
    `SameSite` + 自定义头校验。
- [ ] **敏感信息脱敏**
  - 手机号、收货地址、真实姓名等在列表/日志中脱敏展示（如 `138****8000`）。
  - 物品详情页的收货/联系方式按「仅交易相关方可见」由后端返回，前端不做兜底暴露。
  - 禁止在前端日志中打印 token、密码、完整地址等敏感字段。

补充待做（与安全相关）：

- [x] 401 统一处理（已在 `request.ts` 响应拦截器实现：清除本地登录态，不自动跳转）。
- [ ] 全局登录守卫：需要登录的页面/操作统一拦截并引导到 `/login?redirect=...`
      （当前仅由各页面自行处理，登录态只用于显示/隐藏入口）。
- [ ] 图片上传的类型/大小限制与后端校验（发布物品写库时一并处理）。
- [ ] 生产环境强制 HTTPS，接口走同域反向代理。

## 3. 自查清单（提交前）

- [ ] 没有把密码 / token / 密钥写进代码或日志。
- [ ] 新增的鉴权请求都通过 `request.ts` 自动带上了 `Authorization` 头。
- [ ] 没有用前端判断代替后端权限校验。
- [ ] 新增表单有基础校验，并且已确认后端会做最终校验。
- [ ] 没有引入 `dangerouslySetInnerHTML` 或明文密钥。

## 相关文档

- [ARCHITECTURE.md](./ARCHITECTURE.md) — 架构说明
- [PROGRESS.md](./PROGRESS.md) — 进度与待办
- [API.md](./API.md) — 接口约定
- [CONVENTIONS.md](./CONVENTIONS.md) — 编码规范
