# 前端最小交互框架 Implementation Plan

**Goal:** 为 `rag-demo` 搭建从零到一的前端最小交互骨架，完成「文档上传 / 文档列表（状态轮询） / 知识库问答（含引用）」3 个核心页面，配齐共用 API 请求层与服务端状态管理，打通端到端的用户可操作闭环。

**Architecture:** `Next.js 15 App Router + React 19 + TypeScript 5 + Ant Design 5 + @tanstack/react-query v5`，通过 `next.config` 的 `rewrites` 将 `/api/*` 代理到后端 Koa (`http://localhost:8000`) 规避 CORS。UI 采用 AntD 官方 App Router Registry 方案避免 SSR 样式闪烁。预留 SSE 流式消费接口，当前后端一次性返回时自动降级为一次性展示。

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Ant Design 5.22, `@ant-design/nextjs-registry`, `@tanstack/react-query` 5, `@tanstack/react-query-devtools`, Node ≥ 20, pnpm

---

## 文件变更一览

| 操作 | 文件 | 职责 |
|------|------|------|
| Create | `frontend/package.json` | 依赖、脚本、`"type": "module"` |
| Create | `frontend/pnpm-workspace.yaml` | 可选：跳过；由根决定 |
| Create | `frontend/tsconfig.json` | TS 配置（`paths` 别名 `@/*`） |
| Create | `frontend/next.config.ts` | `rewrites` 代理、standalone 输出 |
| Create | `frontend/next-env.d.ts` | Next TS 声明 |
| Create | `frontend/.gitignore` | Next 默认 ignore |
| Create | `frontend/.env.local.example` | `NEXT_PUBLIC_API_BASE` |
| Create | `frontend/README.md` | 启动说明与目录说明 |
| Create | `frontend/src/app/layout.tsx` | 根布局（HTML 骨架 + AppShell） |
| Create | `frontend/src/app/page.tsx` | 根页面重定向到 `/documents` |
| Create | `frontend/src/app/providers.tsx` | Client 端 Providers（AntdRegistry + QueryClient + ConfigProvider） |
| Create | `frontend/src/app/documents/page.tsx` | 文档列表页 |
| Create | `frontend/src/app/documents/upload/page.tsx` | 文档上传页 |
| Create | `frontend/src/app/chat/page.tsx` | 问答页 |
| Create | `frontend/src/components/AppShell.tsx` | 顶部导航 + 侧边栏骨架 |
| Create | `frontend/src/components/DocumentUploader.tsx` | 文件选择 / 拖拽上传 / 结果提示 |
| Create | `frontend/src/components/DocumentList.tsx` | 文档表格 + 状态轮询 |
| Create | `frontend/src/components/ChatPanel.tsx` | 问答输入 + 消息流 |
| Create | `frontend/src/components/MessageItem.tsx` | 单条消息气泡 |
| Create | `frontend/src/components/ReferenceList.tsx` | 引用片段展示 |
| Create | `frontend/src/lib/apiClient.ts` | fetch 封装：Base + JSON + 错误统一 |
| Create | `frontend/src/lib/queryClient.ts` | QueryClient 默认配置 |
| Create | `frontend/src/lib/chatStream.ts` | 流式消费 API（当前 fallback 一次性） |
| Create | `frontend/src/services/documents.ts` | documents upload / list / detail |
| Create | `frontend/src/services/tasks.ts` | tasks/:id |
| Create | `frontend/src/services/chat.ts` | chat/ask / chat/messages |
| Create | `frontend/src/hooks/useDocuments.ts` | 列表查询 + 轮询 |
| Create | `frontend/src/hooks/useUploadDocument.ts` | 上传 mutation |
| Create | `frontend/src/hooks/useAskQuestion.ts` | 发问 mutation |
| Create | `frontend/src/types/api.ts` | 与后端 schemas 对齐的类型 |
| Create | `frontend/src/constants/status.ts` | 状态文案与颜色映射 |
| Create | `docs/frontend.md` | 前端模块说明文档 |
| Modify | `PROJECT.md` | Layer 6 勾选完成，更新模块索引 |
| Modify | `.env.example` | 统一 `NEXT_PUBLIC_API_BASE` 默认值 |

---

## 核心设计要点

### 1. API 契约对齐

严格按后端 Zod schema 生成 TS 类型（见 `backend/src/schemas/*.ts`）：

- `DocumentResponse`、`PaginatedDocuments`、`DocumentStatus`
- `TaskResponse`、`TaskStatus`、`TaskStep`
- `ChatMessageResponse`、`Reference`、`AskQuestionInput`

### 2. 代理策略

`next.config.ts` 里：

```ts
async rewrites() {
  return [
    { source: '/api/:path*', destination: `${process.env.NEXT_PUBLIC_API_BASE}/api/:path*` },
  ];
}
```

前端无需关心 CORS；生产环境同域部署时也统一走 `/api/*`。

### 3. React Query 使用约定

- 列表轮询：`useQuery` + `refetchInterval`，只有存在 `pending/processing` 文档时才继续轮询，避免空转。
- 上传：`useMutation`，`onSuccess` 里 `invalidateQueries(['documents'])`。
- 问答：`useMutation`，结果追加到本地 state 列表；`sessionId` 放 `useRef` 维持多轮。

### 4. 流式 UI 预留

`chatStream.ts` 暴露 `askStream({question, sessionId, onDelta, onDone})`，内部尝试 `Accept: text/event-stream`；若响应 `Content-Type` 非 `text/event-stream`，降级为一次性 JSON 解析并一次性 `onDelta(fullContent)` + `onDone(fullResult)`。前端视图层只消费这两个回调，未来后端切换 SSE 无需改 UI。

### 5. AntD App Router 兼容

- 使用 `@ant-design/nextjs-registry` 的 `AntdRegistry` 包裹 children，避免 SSR 样式闪烁。
- `layout.tsx` 是 Server Component，`providers.tsx` 标 `'use client'` 再引入 `ConfigProvider` / `QueryClientProvider`。

---

## 页面设计

### /documents/upload（上传页）

- AntD `Upload.Dragger`，仅接受 `.txt/.md/.pdf`，单文件 ≤ 50MB（与后端一致）。
- 上传成功：展示返回的 `document.id`、`task.id`，提供按钮跳转 `/documents`。
- 错误：顶部 `Alert` 或 `message.error`。

### /documents（列表页）

- 表格列：文件名 / 类型 / 大小（KB/MB 格式化）/ 状态（`Tag` 颜色）/ Chunks / 创建时间 / 操作。
- 分页：AntD `Table` 分页，`pageSize` 默认 20。
- 轮询：当当前页存在 `pending/processing` 时，每 3 秒 refetch；全部终态则停止。
- 顶部按钮：`上传文档`（跳 `/documents/upload`）。

### /chat（问答页）

- 左侧：消息列表（用户 / 助手气泡，助手消息下方展开引用列表）。
- 底部：`Input.TextArea` + 发送按钮（`Enter` 发送，`Shift+Enter` 换行）。
- 发送后：UI 立刻插入用户消息与一个"助手占位"消息，`askStream` 回调逐步填充内容；`onDone` 补全 `references`。
- `sessionId` 首次调用时由后端生成并写入前端 `useRef`，后续复用。

---

## Task 拆分

### Task 1: 搭建 Next.js 工程骨架

**Files:**
- Create: `frontend/package.json`, `frontend/tsconfig.json`, `frontend/next.config.ts`, `frontend/next-env.d.ts`, `frontend/.gitignore`, `frontend/.env.local.example`

**Steps:**
- 写 `package.json`（next/react/antd/react-query/ts/eslint）
- 写 `tsconfig.json`，`baseUrl=.`，`paths: { "@/*": ["src/*"] }`
- 写 `next.config.ts`，`rewrites` 代理到 `NEXT_PUBLIC_API_BASE`
- 写 `.env.local.example`: `NEXT_PUBLIC_API_BASE=http://localhost:8000`

Verify: `cd frontend && pnpm install && pnpm typecheck` 通过。

### Task 2: Providers 与根布局

**Files:**
- Create: `frontend/src/app/layout.tsx`, `frontend/src/app/providers.tsx`, `frontend/src/app/page.tsx`, `frontend/src/lib/queryClient.ts`, `frontend/src/components/AppShell.tsx`

**Steps:**
- `providers.tsx`：AntdRegistry + ConfigProvider(中文 + 主题 token) + QueryClientProvider
- `layout.tsx`：根 HTML + `<Providers><AppShell>{children}</AppShell></Providers>`
- `AppShell.tsx`：顶部 Header（标题 + 导航 Menu）+ Content 容器
- 根 `page.tsx`：`redirect('/documents')`

### Task 3: API 层 + 服务 + Hooks

**Files:**
- Create: `frontend/src/lib/apiClient.ts`, `frontend/src/lib/chatStream.ts`, `frontend/src/types/api.ts`, `frontend/src/constants/status.ts`, `frontend/src/services/documents.ts`, `frontend/src/services/tasks.ts`, `frontend/src/services/chat.ts`, `frontend/src/hooks/useDocuments.ts`, `frontend/src/hooks/useUploadDocument.ts`, `frontend/src/hooks/useAskQuestion.ts`

**Steps:**
- `apiClient.ts`：`request<T>(input, init)`，封装 JSON 解析与错误抛出（提取后端 `error.message`）
- `types/api.ts`：与后端 schemas 对齐
- `services/*`：薄封装，只拼 URL 与 body
- Hooks：React Query 包装，包含 `queryKey` 规范与失效策略

### Task 4: 文档上传页

**Files:**
- Create: `frontend/src/app/documents/upload/page.tsx`, `frontend/src/components/DocumentUploader.tsx`

**Steps:**
- `Upload.Dragger` + 单文件限制 + 扩展名校验
- 上传后显示结果卡片 + 跳转按钮

### Task 5: 文档列表页

**Files:**
- Create: `frontend/src/app/documents/page.tsx`, `frontend/src/components/DocumentList.tsx`

**Steps:**
- `useDocuments({ page, pageSize })` + 轮询条件
- AntD `Table` + 状态 `Tag` + 文件大小格式化
- 顶部操作区：`上传文档` 按钮 + `刷新` 按钮

### Task 6: 问答页

**Files:**
- Create: `frontend/src/app/chat/page.tsx`, `frontend/src/components/ChatPanel.tsx`, `frontend/src/components/MessageItem.tsx`, `frontend/src/components/ReferenceList.tsx`

**Steps:**
- 消息结构：`{ id, role, content, references?, pending? }`
- 发送逻辑：乐观插入用户消息 + 占位助手消息；`useAskQuestion` 调 `askStream`
- 引用块：文件名 + chunkIndex + 相似度 + 折叠全文

### Task 7: 文档与根配置

**Files:**
- Create: `frontend/README.md`, `docs/frontend.md`
- Modify: `PROJECT.md`, `.env.example`

**Steps:**
- `docs/frontend.md`：架构、目录、数据流、接口对齐表
- `PROJECT.md`：Layer 6 勾选，模块索引补链接
- `.env.example`：前端变量注释

### Task 8: 验证

**Steps:**
- `cd frontend && pnpm typecheck && pnpm lint && pnpm build`
- 若本地启动后端 + worker，再 `pnpm dev`，走一遍：上传 → 列表轮询 → 发问

---

## 风险与降级

| 风险 | 处置 |
|------|------|
| 后端未启动时轮询产生大量 500 | React Query `retry: 1`，页面 `Alert` 提示后端不可达 |
| 后端不支持 SSE | `chatStream` 自动降级一次性返回；UI 不感知 |
| AntD SSR 样式闪烁 | `@ant-design/nextjs-registry` 包裹 |
| 文件上传内存占用 | 直接走浏览器 `FormData` → `/api/documents/upload`，不经 Next API 路由 |

---

## 交付定义

- `pnpm dev` 能启动 `http://localhost:3000`
- 根路径自动跳 `/documents`
- 上传页可上传 `.txt/.md/.pdf`，上传后 `/documents` 能看到新文档并观察到状态从 `pending → processing → completed`
- 问答页能发问，返回答案与引用；多轮会话在同一 `sessionId` 下
- `pnpm build` 无错误；`pnpm typecheck` 无错误
