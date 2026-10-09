# My Shop Frontend

## 简介

个人电商项目前端，支持**新品购买**、**二手买卖**、**以物换物**三种交易模式。

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
│   ├── components/       # 通用组件（暂为空，保留目录结构）
│   │   └── .gitkeep
│   ├── pages/            # 页面
│   │   ├── Home.tsx      # 首页
│   │   └── ProductList.tsx # 商品列表
│   ├── router/           # 路由
│   │   └── index.tsx     # "/" → Home，"/products" → ProductList
│   ├── store/            # 全局状态
│   │   └── useCartStore.ts # 购物车（zustand）
│   ├── types/            # 类型定义
│   │   └── product.ts    # Product / ProductType
│   ├── utils/            # 工具函数（暂为空，保留目录结构）
│   │   └── .gitkeep
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

## 开发进度清单

- [x] 项目骨架
- [ ] 商品列表（假数据）
- [ ] 对接后端接口
- [ ] 用户登录
- [ ] 购物车
- [ ] 二手交易
- [ ] 以物换物
