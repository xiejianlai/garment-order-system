# 外贸服装订单操作小程序

> 微信小程序 + H5 网页双端发布，支持跟单员、工厂、客户三方协同

## 项目结构

```
garment-order-system/
├── backend/                 # NestJS 后端
│   ├── prisma/
│   │   ├── schema.prisma    # 数据库 Schema (9张表)
│   │   └── seed.ts          # 种子数据
│   ├── src/
│   │   ├── main.ts          # 入口 (Swagger + CORS + 全局管道)
│   │   ├── app.module.ts    # 根模块
│   │   ├── prisma/          # Prisma 服务
│   │   ├── auth/            # 认证模块 (双端登录)
│   │   ├── orders/          # 订单模块 (CRUD + T&A + 下拉选项)
│   │   ├── trims/           # 辅料模块 (齐套判定)
│   │   ├── ta-stages/       # T&A 定时任务 (延误检查)
│   │   ├── logs/            # 操作日志
│   │   ├── files/           # 文件上传
│   │   ├── websocket/       # WebSocket 网关 (实时推送)
│   │   └── common/          # 公共设施
│   │       ├── guards/      # JWT守卫 + RBAC守卫
│   │       ├── interceptors/# 响应格式拦截器
│   │       ├── filters/     # 全局异常过滤器
│   │       └── decorators/  # @CurrentUser @Roles
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/                # uni-app 前端 (小程序+H5双端)
│   ├── src/
│   │   ├── main.ts          # 入口
│   │   ├── App.vue          # 根组件 (登录状态恢复)
│   │   ├── manifest.json    # uni-app配置 (微信+H5)
│   │   ├── pages.json       # 页面路由 + TabBar
│   │   ├── pages/
│   │   │   ├── login/       # 登录页 (条件编译双端UI)
│   │   │   ├── orders/      # 订单列表 (含新建按钮)
│   │   │   ├── order-detail/# 订单详情 (矩阵+辅料+T&A+日志+实时更新)
│   │   │   ├── order-create/# 订单创建 (颜色尺码矩阵动态录入)
│   │   │   └── trim-manage/ # 辅料管理 (增删改+打样/大货状态更新)
│   │   ├── api/             # API 封装
│   │   │   ├── auth.ts      # 认证API (双端登录)
│   │   │   └── orders.ts    # 订单+辅料+选项API
│   │   ├── stores/          # Pinia 状态管理
│   │   │   └── user.ts      # 用户状态
│   │   ├── utils/
│   │   │   ├── request.ts   # HTTP请求封装 (双端统一)
│   │   │   ├── auth.ts      # Token管理 (双端统一)
│   │   │   └── realtime.ts  # 实时日志推送 (HTTP轮询)
│   │   └── types/           # 类型定义
│   ├── tsconfig.json
│   ├── vite.config.ts       # Vite配置 (H5 proxy代理)
│   ├── index.html           # H5入口
│   └── package.json
│
├── docker-compose.yml       # 本地开发环境 (MySQL+Redis)
└── README.md
```

## 功能模块

### 已实现页面

| 页面 | 路径 | 功能 | 权限 |
|------|------|------|------|
| 登录页 | `/pages/login/index` | 微信登录(小程序) + 密码登录(H5) | 公开 |
| 订单列表 | `/pages/orders/index` | 状态筛选、分页、下拉刷新、新建入口 | 全部角色 |
| 订单详情 | `/pages/order-detail/index` | 4Tab(基础信息/辅料/T&A/日志)、实时日志更新 | 全部角色(数据按角色过滤) |
| 订单创建 | `/pages/order-create/index` | 基本信息表单 + 颜色尺码矩阵动态录入 + 图片上传 | admin/merchandiser |
| 辅料管理 | `/pages/trim-manage/index` | 辅料增删、打样状态更新、大货状态更新、齐套检查 | admin/merchandiser可编辑，factory只读 |

### 已实现后端接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/auth/login` | H5 密码登录 | 公开 |
| POST | `/api/auth/wx-login` | 小程序 code 登录 | 公开 |
| GET | `/api/auth/me` | 获取当前用户信息 | 已登录 |
| POST | `/api/orders` | 创建订单(含矩阵+T&A初始化) | admin/merchandiser |
| GET | `/api/orders` | 订单列表(角色过滤) | 已登录 |
| GET | `/api/orders/:id` | 订单详情(全量关联) | 已登录(数据过滤) |
| PATCH | `/api/orders/:id/status` | 更新订单状态 | admin/merchandiser |
| PATCH | `/api/orders/:id/ta-stages/:stageCode` | 更新T&A阶段 | admin/merchandiser/factory |
| GET | `/api/orders/options/customers` | 客户下拉选项 | admin/merchandiser |
| GET | `/api/orders/options/factories` | 工厂下拉选项 | admin/merchandiser |
| POST | `/api/trims/:orderId` | 添加辅料 | admin/merchandiser |
| PATCH | `/api/trims/:trimId/status` | 更新辅料进度(自动判定齐套) | admin/merchandiser |
| GET | `/api/trims/check/:orderId` | 一键检查辅料齐套 | 已登录 |
| GET | `/api/logs/:orderId` | 操作日志流 | 已登录 |
| POST | `/api/files/upload/:type` | 文件上传 | 已登录 |
| WS | `/ws` | WebSocket 实时日志推送 | 已登录 |

## 双端兼容设计要点

### 1. 登录方式

| 平台 | 登录方式 | 前端调用 | 后端接口 |
|------|---------|---------|---------|
| 微信小程序 | 微信一键登录 | `uni.login()` → code | `POST /api/auth/wx-login` |
| H5 网页 | 用户名+密码 | 表单提交 | `POST /api/auth/login` |

两端登录成功后都返回统一格式 JWT，后续请求逻辑完全一致。

### 2. 条件编译

```vue
<!-- 微信小程序: 显示微信登录按钮 -->
<!-- #ifdef MP-WEIXIN -->
<button @tap="handleWxLogin">微信一键登录</button>
<!-- #endif -->

<!-- H5: 显示用户名密码表单 -->
<!-- #ifdef H5 -->
<input v-model="username" placeholder="用户名" />
<input v-model="password" type="password" />
<button @tap="handleLogin">登录</button>
<!-- #endif -->
```

### 3. API 请求

- 统一使用 `uni.request` (uni-app已抽象，两端一致)
- 小程序直连后端 (需在微信后台配置合法域名)
- H5 开发时走 vite proxy 代理，生产环境直连

### 4. Token 存储

- 统一使用 `uni.setStorageSync` / `uni.getStorageSync`
- 小程序底层: `wx.setStorageSync`
- H5 底层: `localStorage`

### 5. 文件上传

- 统一使用 `uni.uploadFile` (uni-app已抽象)
- 小程序底层: `wx.uploadFile`
- H5 底层: `FormData + XMLHttpRequest`

### 6. 实时日志推送

- 后端使用 Socket.io WebSocket 网关，操作变更时自动推送
- 前端使用 HTTP 轮询(5秒间隔)兼容双端，无需额外依赖
- 订单详情页打开时自动订阅，页面关闭时自动取消

## 快速开始

### 后端

```bash
cd backend
cp .env.example .env        # 配置环境变量
npm install
npx prisma generate          # 生成 Prisma Client
npx prisma migrate dev       # 创建数据库表
npx prisma db seed           # 写入种子数据
npm run start:dev            # 启动开发服务器 → localhost:3000
```

### 前端

```bash
cd frontend
npm install
npm run dev:h5               # H5开发 → localhost:8080
npm run dev:mp-weixin        # 小程序开发 → 用微信开发者工具打开 dist/dev/mp-weixin
```

### 本地环境 (Docker)

```bash
docker-compose up -d         # 启动 MySQL + Redis
```

## 测试账号

| 角色 | 用户名 | 密码 | 权限 |
|------|--------|------|------|
| 管理员 | admin | 123456 | 全功能 |
| 跟单员 | zhanggen | 123456 | 全功能 |
| 工厂端 | chenchang | 123456 | 仅本厂订单，可更新大货进度 |
| 客户端 | john | 123456 | 仅自己订单，只看进度 |
