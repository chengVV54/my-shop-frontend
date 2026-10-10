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
│   │   └── request.ts    # axios 实例（baseURL: /api，响应拦截器直接返回 data）
│   ├── components/       # 通用组件
│   │   ├── Layout/
│   │   │   └── index.tsx # 全局布局（导航栏 + 内容区 + 页脚）
│   │   ├── ItemCard/     # 物品卡片
│   │   │   └── index.tsx
│   │   └── .gitkeep
│   ├── pages/            # 页面
│   │   ├── Home.tsx          # 首页
│   │   ├── ItemList.tsx      # 物品列表（换物 / 二手筛选 + 卡片网格）
│   │   ├── ItemDetail.tsx    # 物品详情
│   │   └── PublishItem.tsx   # 发布物品
│   ├── router/           # 路由
│   │   └── index.tsx     # 嵌套路由：<Layout> 作为父级布局，子页面通过 <Outlet /> 渲染
│   ├── store/            # 全局状态
│   │   └── useCartStore.ts # 购物车（zustand）
│   ├── types/            # 类型定义
│   │   ├── item.ts       # Item / ItemMode / ItemCondition / ItemCategory / ItemStatus / BarterRequest / Order
│   │   └── index.ts      # 统一出口 + ApiResult<T> 响应包装体
│   ├── utils/            # 工具函数
│   │   ├── item.ts       # 模式 / 分类 / 成色文案与颜色、formatPrice
│   │   └── cart.ts       # isPurchasable（是否支持二手下单）
│   ├── App.tsx           # 根组件，渲染路由
│   └── main.tsx          # 入口，挂载 ReactDOM + BrowserRouter
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
| /items/:id | ItemDetail | 物品详情 |
| /publish | PublishItem | 发布物品 |

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
| GET | `/api/barters` | 换物申请列表 | 待对接 |
| GET | `/api/orders` | 二手订单列表 | 待对接 |

> 「物品详情」页底部的操作按钮（发起换物 / 立即购买 / 联系对方）目前只在控制台打印 `TODO`，
> 「发布物品」页的提交同理，尚未写入后端。

## 开发进度

- [x] 项目骨架
- [x] 全局 Layout（导航栏 + 页脚）
- [x] 物品列表（对接后端）
- [x] 物品详情
- [x] 发布物品（表单占位）
- [ ] 用户登录
- [ ] 换物申请
- [ ] 二手下单
- [ ] 消息
- [ ] 个人中心

