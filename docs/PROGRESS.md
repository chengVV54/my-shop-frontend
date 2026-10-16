# 项目进度（PROGRESS）

> 记录当前完成度与后续计划。每完成一项请更新本文档。

最后更新：前端「发起换物」完成——详情页入口 + `/barter/apply/:itemId` 页面 + `POST /api/barters`

## 已完成

- [x] **项目骨架**
  - Vite + React 18 + TypeScript 工程搭建
  - 别名 `@` → `src`，开发端口 5173，`/api` 代理到 `http://localhost:8080`
  - `BrowserRouter` + 路由表 + antd reset 样式接入
- [x] **全局 Layout**
  - 顶部导航（首页 / 换物 / 二手 / 发布 / 我的）、搜索框占位、用户区占位、购物车角标、消息入口、页脚
  - 子页面通过 `<Outlet />` 渲染，菜单高亮由当前路径推导
- [x] **物品列表（对接后端）**
  - `GET /api/items`，支持 `BARTER` / `SALE` / `BOTH` 模式筛选（`Segmented`）
  - 响应式栅格 + `ItemCard`，含 loading / 空态 / 错误提示
  - 用 `requestIdRef` 丢弃过期响应，避免快速切换筛选时的竞态
- [x] **物品详情**
  - `GET /api/items/{id}`，含图片、价格/换物诉求、状态标签、加购与发起换物按钮（入口占位）
- [x] **发布物品（表单占位）**
  - antd `Form` 完整字段：标题、分类、成色、描述、模式
  - 按模式条件显示「价格」与「想换什么」字段
  - 基础校验：必填、标题 `whitespace`（不能只有空格）、标题 ≤60、描述 ≤500、
    补充说明 ≤200、价格 >0 且 ≤9999999
  - **提交逻辑仅为提示「功能开发中」+ `console.log('TODO: 提交发布', payload)`，尚未写库**
- [x] **前端渲染优化（响应式、美化）**
  - `index.html` 增加 viewport（`width=device-width, initial-scale=1.0`），手机端按设备宽度渲染
  - `App.tsx` 接入 `ConfigProvider`：主色 `#fa8c16`（橙色，贴合换物主题）、圆角 token、中文 locale
  - 导航栏响应式：`Grid.useBreakpoint()` 判断断点，md 以下折叠为汉堡按钮 + antd `Drawer`
    （抽屉内含菜单、搜索、购物车、登录入口）；头部/内容区/页脚内边距随断点收窄
  - 物品详情页响应式：`Row` + `Col`，手机（`xs`）图文上下排列、图片高度 240，
    桌面（`md`）左右排列、图片高度 360；`Descriptions` 手机 1 列 / 桌面 2 列
  - 首页 Hero 区内边距、标题层级、卡片间距随断点调整
  - 卡片优化：hover 上浮 + 阴影加深 + 主色描边、圆角走 `borderRadiusLG` token、
    标签统一 `bordered={false}` 且颜色统一由 `utils/item.ts` 的 `getModeColor` / `getStatusColor` 提供
  - 列表卡片图片 `loading="lazy"`
  - 占位操作反馈：详情页「发起换物 / 立即购买」与发布页提交改用 antd `message` 提示，
    手机端没有控制台也能得到明确反馈；手机端详情页操作按钮 `block` 撑满一行
  - 安全基础（守 [SECURITY.md](./SECURITY.md) 底线）：新增输入均通过 `Form.rules` 基础校验、
    提交前清洗首尾空格、搜索框空输入直接忽略；未引入 `dangerouslySetInnerHTML`，
    前端不保存任何密码（当时登录功能尚未开发，现已由下方「用户系统」补齐）

- [x] **PC 端导航与页面扩展（换物 / 二手入口分离）**
  - 导航菜单改为「首页 / 换物 / 二手 / 发布 / 我的」；右侧保留搜索框、购物车图标
    （角标取 `useCartStore`，点击提示占位）、消息图标（未读数先写死 `0`，>0 才显示红点）、
    用户区（未登录显示「登录」按钮，已登录显示头像下拉：个人中心 / 消息 / 我的订单 / 退出登录）
  - 手机端（md 以下）保持原有逻辑：菜单、搜索、购物车、消息、用户区收进 antd `Drawer`
  - **换物页 `/barter`**：标题「换物」/ 副标题「以物换物，不花钱」，请求 `GET /api/items`
    （全量）后前端过滤 `mode === 'BARTER' || 'BOTH'`，复用 `ItemCard` 网格，空态「暂无换物」
  - **二手页 `/second-hand`**：标题「二手」/ 副标题「闲置变现，低价好物」，前端过滤
    `mode === 'SALE' || 'BOTH'`，空态「暂无二手」
  - **占位页**：「我的」`/profile`（用户信息占位 + 我的物品/换物/订单三块 Card 空态）、
    「消息」`/messages`（`Row` + `Col`：左侧 3 条 mock 会话列表 + 右侧聊天区占位）、
    「视频」`/videos`（`Empty`「视频功能开发中」）
  - **首页**：保留 Hero（发布闲置 / 去逛逛），新增「热门分类」8 个入口
    （相机/书籍/乐器/游戏/手机/电脑/服饰/其他，点击带 `?category=XXX` 跳转列表页）
    与「最新发布」前 8 件卡片 + 底部「查看全部」按钮
  - **列表页**：新增分类 / 成色筛选与排序（最新 / 价格从低到高 / 价格从高到低，无价格的换物垫底），
    底部 antd `Pagination` 每页 12 条；筛选 + 排序 + 分页均在前端完成，全程只请求一次 `GET /api/items`；
    支持从首页分类入口带 `?category=XXX` 进入并预选分类
  - **详情页**：价格下方新增卖家信息区（头像占位 + `用户 {ownerId}` + 信用分占位 + 发布时间），
    新增「收藏」按钮（`message` 提示「收藏功能开发中」）；保留按 mode 显示的操作按钮、描述与换物要求
  - 新增公共组件 `components/ModeItemList`：换物页与二手页共用同一份「全量拉取 + 模式过滤 + 网格 + 空态」逻辑
  - 路由表新增 `/barter`、`/second-hand`、`/messages`、`/videos`、`/profile`
  - 安全（守 [SECURITY.md](./SECURITY.md) 底线）：新增页面无表单、无 `dangerouslySetInnerHTML`、
    不写死任何密钥；消息页 mock 数据不含真实用户信息；收藏 / 购物车等写操作仅给占位提示，
    不做「前端校验代替后端权限」的事

- [x] **用户系统（前端）**
  - 类型：`types/user.ts` 定义 `User`（后端 `UserVO`：id / username / avatar / credit / createdAt）
    与 `LoginResponse`，经 `types/index.ts` 统一导出
  - 接口：`api/auth.ts` 封装 `register()` / `login()` / `getCurrentUser()`，全部走统一的 `request`
  - 状态：`store/useUserStore.ts`（Zustand）持有 `user` / `token`，`init()` 从 localStorage 恢复；
    `login()` / `logout()` 同步写入与清除 `token`、`user` 两个键，**不保存密码**
  - 请求层：`api/request.ts` 请求拦截器统一注入 `Authorization: Bearer <token>`；
    响应拦截器捕获 HTTP 401 时调用 `logout()` 清除本地登录态，**不自动跳转**（交页面处理）
  - 页面：`pages/Login.tsx`（`/login`，成功保存登录态并跳首页）、
    `pages/Register.tsx`（`/register`，校验用户名 3~20 位、密码 ≥6 位、两次一致，成功跳登录页）；
    均为居中 `Card`（max-width 400）+ antd `Form`，成功后 `resetFields()` 清空表单
  - 导航栏：`Layout` 去掉模拟登录态，改为读取 `useUserStore`——未登录显示「登录」按钮（跳 `/login`），
    已登录显示头像 + 用户名 + 下拉菜单（我的 / 我的换物 / 退出登录），退出登录清态并刷新页面
  - 启动恢复：`App.tsx` 的 `useEffect` 调用 `useUserStore.getState().init()`
  - 「我的」页：`Profile` 顶部改为展示当前登录用户（头像 / 用户名 / 信用分 / 注册时间），
    未登录时提供「去登录」入口
  - 工具：新增 `utils/error.ts` 的 `getErrorMessage()`，从 AxiosError 中提取后端 `message`
    （网络异常 / 超时给固定中文提示）
  - 路由：新增 `/login`、`/register`；`/barters`（我的换物独立页未开发）暂重定向到 `/profile`，
    避免下拉菜单跳转后白屏
  - 安全（守 [SECURITY.md](./SECURITY.md) 底线）：密码只在提交时使用、不落任何存储与日志，
    成功后立即清空表单；token 存 localStorage 并在拦截器统一注入；前端登录态只用于显示/隐藏入口，
    权限最终判断仍在后端

- [x] **前端发起换物（`POST /api/barters`）**
  - 类型：新增 `types/barter.ts` 定义 `BarterStatus` / `BarterRequest`（`BarterRequestVO`）/
    `BarterApplyPayload`，经 `types/index.ts` 统一导出；原定义在 `types/item.ts` 的同名类型已迁出，避免重复导出
  - 接口：新增 `api/barter.ts`，封装 `createBarter()`（`POST /api/barters`）与
    `getBarters()`（`GET /api/barters`，页面待开发）；token 由 `request.ts` 拦截器自动携带
  - 入口：`ItemDetail` 的「发起换物」按钮（`BARTER` / `BOTH` 显示）改为真实流程——
    未登录提示「请先登录」并跳 `/login`；自己的物品提示「不能对自己发布的物品发起换物」；
    已登录跳 `/barter/apply/{itemId}`。「立即购买 / 联系对方 / 联系卖家」仍是占位提示
  - 页面：新增 `pages/BarterApply.tsx`（路由 `/barter/apply/:itemId`，需登录）
    - 目标物品用 `GET /api/items/{itemId}`，与「我的物品」列表（`GET /api/items`）并行请求
    - 「我的物品」= 全量物品中 `ownerId === 当前用户` 且 `status === 'AVAILABLE'`，
      并剔除目标物品本身（后端不支持 `ownerId` 参数，只能前端过滤）
    - 表单：antd `Select` 选「我提供的物品」（必填）+ `TextArea` 留言（选填，≤500，`maxLength` + `showCount`）
    - 提交：`createBarter({ toItemId, fromItemId, message })`，留言先 `trim()`、空串不发送；
      成功提示「已发起换物申请」并跳 `/profile`；失败用 `getErrorMessage()` 展示后端 `message`
      （401 / 403 / 400 / 404 都不自行编造原因）
    - 状态：加载中 `Spin`；物品不存在 / 加载失败用 `Result` 展示并提供「返回列表 / 重新加载」；
      没有可换物品时 `Empty` + 「去发布物品」入口
  - 路由：`router/index.tsx` 新增 `/barter/apply/:itemId`
  - 安全（守 [SECURITY.md](./SECURITY.md) 底线）：登录态只用于引导与显示，未手写 `Authorization`
    头，不做「前端校验代替后端权限」；表单只做必填与长度基础校验，注意
    `App.tsx` 的 `init()` 在父组件 effect 中执行，页面内先幂等调用一次 `init()` 再判断登录态
    （否则直接刷新本页会把已登录用户误弹去登录页）

## 进行中

- [ ] 无（当前迭代已收尾，下一步从「待做」取）

## 待做

- [ ] **用户系统后续**
  - 「我的换物」独立页 `/barters`（当前重定向到 `/profile`），依赖 `GET /api/barters`
  - 需要登录的页面/操作统一守卫与登录后回跳（当前只在导航栏控制入口显示）
  - 首屏可用 localStorage 缓存渲染，需要权威用户信息时调用 `GET /api/auth/me`（`getCurrentUser()` 已封装）
- [ ] **发布物品（真实写库）**
  - `PublishItem` 接入 `POST /api/items`，含图片上传、表单校验、提交后跳转
- [ ] **换物流程**
  - [x] 发起换物申请（前端，`/barter/apply/:itemId` → `POST /api/barters`）
  - [ ] 我的换物列表（`GET /api/barters` 已封装，`/barters` 仍重定向到 `/profile`）
  - [ ] 接受 / 拒绝 / 完成（依赖后端的换物状态流转接口）
- [ ] **二手下单**
  - 购物车 → 下单 → 订单列表/详情/状态流转
  - 依赖 `GET /api/orders` 及后续下单接口
- [ ] **消息**
  - 交易双方站内消息 / 通知（接口与页面均未开始，当前仅 `/messages` 占位页 + 导航消息入口）
- [ ] **列表服务端筛选与分页**
  - 把分类 / 成色 / 排序 / 分页下沉到后端，替换当前的前端全量过滤
- [ ] **我的 / 收藏**
  - `/profile` 顶部用户信息已接入，剩余「我的物品 / 我的换物 / 我的订单」三块卡片与收藏接口、列表
- [ ] **视频**
  - `/videos` 接入视频内容（接口与页面均未开始）
- [ ] **部署**
  - 生产构建、`/api` 反向代理、环境变量区分开发/生产

## 已知限制

- `PublishItem` 提交不生效：校验通过后提示「发布功能开发中」并打印清洗后的数据
  （待接入 `POST /api/items`）。
- `Layout` 的搜索框（空输入忽略，接口未接入）、页脚链接仍为占位；导航消息图标的未读数写死为 `0`。
  登录态与用户下拉菜单已接入 `useUserStore`，不再是模拟状态。
- 列表页 / 换物页 / 二手页都是「一次拉全量 + 前端过滤 + 前端分页」，物品量大时会有性能与
  流量问题，后续应改为服务端分页与筛选。
- 换物页 / 二手页为了同时包含 `BOTH`，只能请求全量后在本地过滤（后端 `mode` 参数不支持多值）。
- `/profile`、`/messages`、`/videos` 为占位页：`/profile` 顶部已接入真实登录用户信息，
  但「我的物品 / 我的换物 / 我的订单」三块卡片仍无接口、为空态；
  `/messages`、`/videos` 无接口，消息页的 3 条会话是 mock 数据。
- 详情页「收藏」按钮只提示开发中，未落库；卖家信用分字段后端暂无，界面显示 `--`。
- 发起换物：`BarterApply` 的「我的物品」是 `GET /api/items` 全量拉取后前端过滤
  （后端 `GET /api/items` 不支持 `ownerId`），物品多时会浪费流量，后续应改为服务端筛选；
  页面只在**进入时**校验登录态，申请提交过程中若 token 失效应以后端 401 为准（拦截器会清登录态）。
- `POST /api/barters` 成功后跳 `/profile`，而 `/profile` 的「我的换物」卡片仍是空态，
  看不到刚提交的申请（`GET /api/barters` 已封装，页面待开发）。
- `useCartStore` 只有本地状态，未持久化、未与后端同步；购物车页面尚未开发（点击仅提示占位）。
- 用户系统：登录态只用于显示/隐藏入口，**没有**统一路由守卫——未登录也能打开 `/profile` 等页面
  （`/barter/apply/:itemId` 是唯一在页面内自带登录前置判断的路由）；
  `/barters` 暂重定向到 `/profile`；登录后固定跳首页，不支持回跳登录前的地址；
  首屏用 localStorage 里的 `user` 缓存渲染，尚未调用 `GET /api/auth/me` 做权威刷新。
- 401 已在 `request.ts` 统一处理（清除本地登录态），但**不自动跳转**，也尚未统一各页面的
  错误提示文案（见 [SECURITY.md](./SECURITY.md)）。
- 路由未做代码分割，构建产物单包约 1 MB（gzip 336 kB），后续可考虑 `React.lazy` + 分包。

## 相关文档

- [ARCHITECTURE.md](./ARCHITECTURE.md) — 架构说明
- [API.md](./API.md) — 接口约定
- [CONVENTIONS.md](./CONVENTIONS.md) — 编码规范
- [SECURITY.md](./SECURITY.md) — 安全底线
