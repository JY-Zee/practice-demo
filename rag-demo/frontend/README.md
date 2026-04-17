# RAG 知识库 - 前端

基于 **Next.js 15 App Router + React 19 + TypeScript + Ant Design 5 + TanStack Query** 的最小学习版前端。对应后端服务见 [../backend](../backend)。

## 快速启动

> 需要 Node.js ≥ 20 与 pnpm。

```bash
# 1. 安装依赖
pnpm install

# 2. 配置环境变量（将 .env.local.example 复制为 .env.local）
cp .env.local.example .env.local

# 3. 启动开发服务器（默认端口 3000）
pnpm dev
```

首次访问 [http://localhost:3000](http://localhost:3000) 会自动跳转到文档列表页。

## 前置依赖

- 后端 Koa 服务：默认 `http://localhost:8000`
- Worker + Redis + PostgreSQL + Qdrant：根目录 `docker compose up -d`

## 环境变量

| 变量 | 默认 | 说明 |
|------|------|------|
| `NEXT_PUBLIC_API_BASE` | `http://localhost:8000` | 后端 API 根地址，Next.js `rewrites` 会把 `/api/*` 代理到这里，浏览器侧无 CORS |

## 可用脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 开发服务器（热重载） |
| `pnpm build` | 生产构建 |
| `pnpm start` | 启动生产服务器 |
| `pnpm lint` | ESLint 检查 |
| `pnpm typecheck` | TypeScript 类型检查 |

## 目录结构

```
frontend/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx       # 根布局（接入 Providers + AppShell）
│   │   ├── page.tsx         # 根路径（重定向 /documents）
│   │   ├── providers.tsx    # AntdRegistry + ConfigProvider + QueryClient
│   │   ├── documents/
│   │   │   ├── page.tsx     # 文档列表页
│   │   │   └── upload/page.tsx  # 文档上传页
│   │   └── chat/page.tsx    # 问答页
│   ├── components/          # UI 组件
│   ├── hooks/               # React Query 封装
│   ├── lib/                 # apiClient、queryClient、chatStream
│   ├── services/            # 后端 API 薄封装
│   ├── types/               # 与后端 schemas 对齐的 TS 类型
│   └── constants/           # 状态文案 / 颜色映射
├── next.config.ts           # 含 /api/* 代理规则
└── tsconfig.json
```

## 核心设计

- **统一 API 调用**：`src/lib/apiClient.ts` 封装 `fetch`，支持 `json` / `formData` / `query`，统一错误结构 `ApiError`
- **服务端状态管理**：TanStack Query，列表页根据状态自动轮询（`pending/processing` 时 3s 一次，完成后自动停止）
- **流式 UI 预留**：`src/lib/chatStream.ts` 暴露 `askStream({ onDelta, onDone })`，当前后端为一次性返回，未来切换 SSE 无需改 UI
- **CORS 规避**：通过 Next.js `rewrites` 代理请求，前端任何地方只写 `/api/...`
- **AntD SSR 兼容**：使用 `@ant-design/nextjs-registry` 官方方案，消除 App Router 场景下的样式闪烁

## 页面清单

| 路径 | 功能 |
|------|------|
| `/` | 重定向到 `/documents` |
| `/documents` | 文档列表 + 状态轮询 |
| `/documents/upload` | 文件拖拽上传（`.txt` / `.md` / `.pdf`，≤ 50MB） |
| `/chat` | 知识问答，含消息气泡与引用来源展示 |

## 后续扩展点

- 问答页接入后端 SSE（只需扩展 `chatStream.ts` 中 SSE 解析分支）
- 文档详情页展示 `ingestion_tasks` 步骤历史
- 会话历史持久化：接入 `/api/chat/messages`
- 登录与多用户权限（当前为单用户学习版）
