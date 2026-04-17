# Frontend 模块 - 前端管理台

## 概述

基于 Next.js 15 App Router + React 19 + TypeScript + Ant Design 5 + TanStack Query v5 的学习版前端。负责文档上传、文档列表（含状态轮询）、知识库问答三个核心交互页面。

## 目录结构

```
frontend/
├── next.config.ts                  # /api/* 代理到后端 Koa
├── package.json
├── tsconfig.json
├── .env.local.example              # NEXT_PUBLIC_API_BASE
└── src/
    ├── app/
    │   ├── layout.tsx              # 根布局（Providers + AppShell）
    │   ├── page.tsx                # 根页重定向 /documents
    │   ├── providers.tsx           # 全局 Provider
    │   ├── documents/
    │   │   ├── page.tsx            # 文档列表
    │   │   └── upload/page.tsx     # 文档上传
    │   └── chat/page.tsx           # 问答
    ├── components/
    │   ├── AppShell.tsx            # 顶部导航壳
    │   ├── DocumentUploader.tsx    # 文件上传 UI
    │   ├── DocumentList.tsx        # 文档表格 + 轮询
    │   ├── ChatPanel.tsx           # 问答面板
    │   ├── MessageItem.tsx         # 单条消息气泡
    │   └── ReferenceList.tsx       # 引用来源折叠展示
    ├── lib/
    │   ├── apiClient.ts            # fetch 封装 + ApiError
    │   ├── queryClient.ts          # QueryClient 默认配置
    │   └── chatStream.ts           # 流式 UI 封装（当前一次性 fallback）
    ├── services/
    │   ├── documents.ts            # /api/documents*
    │   ├── tasks.ts                # /api/tasks/:id
    │   └── chat.ts                 # /api/chat*
    ├── hooks/
    │   ├── useDocuments.ts         # 列表 + 条件轮询
    │   ├── useUploadDocument.ts    # 上传 mutation
    │   └── useAskQuestion.ts       # 发问 mutation
    ├── types/api.ts                # 对齐后端 Zod schemas 的 TS 类型
    └── constants/status.ts         # 状态文案 / 颜色映射
```

## 路由

| 路径 | 说明 |
|------|------|
| `/` | Server Component 重定向到 `/documents` |
| `/documents` | 文档列表（分页 + 自动轮询） |
| `/documents/upload` | 文件拖拽上传 |
| `/chat` | 问答面板，多轮会话复用同一 `sessionId` |

## 分层架构

```
页面 (app/*) → 组件 (components/*) → Hooks (hooks/*) → Services (services/*) → apiClient (lib/apiClient.ts) → 后端 /api/*
```

- **页面**：极薄，只做布局与组件组合
- **组件**：承载交互与 UI 状态
- **Hooks**：React Query 包装 + queryKey 规范 + 失效策略
- **Services**：薄封装，只管 URL 与 body
- **apiClient**：统一错误结构、JSON 解析、Query 拼接

## 与后端契约对齐

`src/types/api.ts` 与 `backend/src/schemas/*.ts` 一一对应：

| 前端类型 | 后端 Zod Schema |
|---------|----------------|
| `DocumentResponse` | `DocumentResponseSchema` |
| `PaginatedDocuments` | `PaginatedDocumentsSchema` |
| `TaskResponse` | `TaskResponseSchema` |
| `ChatMessageResponse` | `ChatMessageResponseSchema` |
| `Reference` | `ReferenceSchema` |

变更 schemas 时必须同步更新前端类型。

## 跨域策略

前端代码中所有请求都写成 `/api/...` 相对路径，`next.config.ts` 的 `rewrites` 负责把请求代理到 `NEXT_PUBLIC_API_BASE`：

```ts
async rewrites() {
  return [{ source: '/api/:path*', destination: `${API_BASE}/api/:path*` }];
}
```

好处：

- 浏览器只访问同源路径，无 CORS 问题
- 生产部署（同域）无需修改任何业务代码
- 本地 dev 可随意切换后端地址，仅改 `.env.local`

## React Query 使用约定

- **queryKey 规范**：`[resource, params]`，例如 `['documents', { page, pageSize }]`
- **失效策略**：上传成功 → `invalidateQueries(['documents'])`
- **轮询策略**：`refetchInterval` 返回函数，读取上一次 `data` 判断是否还需要继续轮询
- **错误模型**：`ApiError`（包含 `status` 与 `payload`），UI 层用 `instanceof` 区分

## 流式 UI 适配

后端 `/api/chat/ask` 目前一次性返回 JSON，前端用 `chatStream.ts` 提前屏蔽这个差异：

```ts
askStream({
  question, sessionId,
  onDelta: (delta, full) => /* 逐步填充 UI */,
  onDone:  (finalMsg)    => /* 写入 references、结束 */,
});
```

后续后端切换到 `text/event-stream` 时，只需在 `chatStream.ts` 里补一个 SSE 解析分支，视图层无需改动。

## 关键依赖

- `next@15` / `react@19`：App Router + Server Components + 最新 hooks
- `antd@5` + `@ant-design/nextjs-registry`：UI 库 + SSR 兼容适配
- `@tanstack/react-query@5` + `react-query-devtools`：服务端状态管理与调试面板
- `dayjs`：时间格式化（AntD 内部也使用 dayjs，保持一致）

## 本地联调流程

1. 启动基础设施：`docker compose up -d postgres redis qdrant`
2. 启动后端：`cd backend && pnpm dev`
3. 启动 Worker：`cd worker && pnpm dev`
4. 启动前端：`cd frontend && pnpm dev`
5. 打开 `http://localhost:3000`，上传 → 观察轮询 → 提问

## 学习路径建议

1. 先读 `src/lib/apiClient.ts` 理解请求封装
2. 再读 `src/hooks/useDocuments.ts` 理解 React Query 与轮询
3. 再读 `src/components/DocumentUploader.tsx` 看 mutation 与缓存失效
4. 最后读 `src/components/ChatPanel.tsx` 理解乐观 UI + 流式适配

## 后续扩展方向

- SSE 流式问答（`chatStream.ts` 内部加 SSE 分支）
- 文档详情页 + 任务步骤可视化
- 会话历史持久化与多会话管理
- 单元测试（Vitest + React Testing Library）
