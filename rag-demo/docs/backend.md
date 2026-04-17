# Backend 模块 - 后端 API 服务

## 概述

基于 Koa + TypeScript 的 HTTP API 服务，负责文档管理、摄取任务查询和知识库问答。采用三层架构：Router → Service → Repository。

## 目录结构

```
backend/
├── Dockerfile
├── package.json
├── tsconfig.json
├── prisma/
│   └── schema.prisma         # 数据模型定义（4 张表）
└── src/
    ├── app.ts                 # Koa 应用入口
    ├── config/
    │   └── env.ts             # Zod 环境变量校验
    ├── lib/
    │   ├── prisma.ts          # Prisma Client 单例
    │   ├── openai.ts          # embeddingClient / llmClient 单例
    │   └── ingestionQueue.ts  # BullMQ 队列连接（向 Worker 投递任务）
    ├── middlewares/
    │   ├── errorHandler.ts    # 全局错误处理
    │   └── validate.ts        # Zod 请求校验中间件
    ├── schemas/
    │   ├── document.ts        # 文档相关 Schema
    │   ├── chunk.ts           # 切块 Schema
    │   ├── task.ts            # 任务 Schema
    │   └── chat.ts            # 聊天 Schema
    ├── routers/
    │   ├── health.ts          # GET /api/health
    │   ├── documents.ts       # 文档管理路由
    │   ├── tasks.ts           # 任务查询路由
    │   └── chat.ts            # 问答路由
    ├── services/
    │   ├── documentService.ts # 文档上传 + 列表 + 详情
    │   ├── taskService.ts     # 任务查询
    │   └── chatService.ts     # 问答（调用 Agent）
    ├── agent/                 # Agent 服务层（检索 + Prompt + LLM）
    │   ├── service.ts         # 统一入口 runChat
    │   ├── retriever.ts       # Qdrant 语义检索（真实）
    │   ├── promptBuilder.ts   # Prompt 组装（真实）
    │   ├── llmClient.ts       # LLM 调用（真实）
    │   ├── answerFormatter.ts # 答案格式化（真实）
    │   ├── queryRewriter.ts   # 查询改写（占位）
    │   ├── reranker.ts        # 重排序（占位）
    │   └── types.ts           # Agent 内部类型
    └── repositories/
        ├── documentRepository.ts
        ├── chunkRepository.ts
        ├── taskRepository.ts
        └── chatRepository.ts
```

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查（含数据库连通性） |
| POST | `/api/documents/upload` | 文件上传（multipart/form-data） |
| GET | `/api/documents` | 分页查询文档列表 |
| GET | `/api/documents/:id` | 文档详情 |
| GET | `/api/tasks/:id` | 摄取任务详情 |
| POST | `/api/chat/ask` | 提问（接入 Agent，真实检索 + LLM 回答） |
| GET | `/api/chat/messages` | 会话历史 |

## 三层架构

- **Router 层**: 定义 HTTP 端点，使用 `validate()` 中间件做 Zod 入参校验，调用 Service
- **Service 层**: 业务逻辑编排（如上传时创建 Document + IngestionTask + 投递 BullMQ）
- **Repository 层**: 封装 Prisma 查询，Service 不直接操作数据库

## 数据模型（Prisma）

| 模型 | 表名 | 说明 |
|------|------|------|
| Document | documents | 文档元数据（文件名、类型、大小、状态） |
| DocumentChunk | document_chunks | 文档切块，与 Qdrant 向量一一对应 |
| IngestionTask | ingestion_tasks | 摄取流水线任务状态跟踪 |
| ChatMessage | chat_messages | 用户与 AI 的问答记录 |

关联关系：Document 1:N DocumentChunk（级联删除），Document 1:N IngestionTask（级联删除）。

## Agent 子模块

`backend/src/agent/` 实现了完整的 RAG 问答链路。`chatService` 通过调用 `agent/service.ts` 的 `runChat` 接入问答能力：

```
POST /api/chat/ask
  → chatService.askQuestion
      → agent/service.ts: runChat
          → queryRewriter (占位)
          → retriever     (真实 · Qdrant)
          → reranker      (占位)
          → promptBuilder (真实 · 含字符裁剪)
          → llmClient     (真实 · OpenAI 兼容)
          → answerFormatter (真实)
      → 持久化 ChatMessage
  ← { id, sessionId, content, referencesJson, meta }
```

详细的 Agent 分层设计、模块实现状态与扩展点，参见 [docs/agent.md](./agent.md)。

## 关键设计

- **环境变量管理**: 使用 Zod Schema 统一校验所有环境变量，启动时校验失败会打印明确错误并退出
- **Swagger 文档**: 路由文件中使用 `@openapi` JSDoc 注解，自动生成 OpenAPI 3.0 文档，访问 `/api-docs`
- **优雅关闭**: 监听 SIGTERM/SIGINT，依次关闭 HTTP 服务、断开 Prisma 连接、关闭 BullMQ 队列
- **BigInt 序列化**: Prisma 的 `fileSize` 字段为 BigInt，在 Service 层转为 number 后返回
- **文件上传**: 使用 `@koa/multer` 将上传文件存储到磁盘，上传后自动触发 BullMQ 摄取任务

## 依赖

- `koa` / `@koa/router` / `@koa/cors` / `koa-bodyparser` -- Web 框架
- `@koa/multer` + `multer` -- 文件上传
- `@prisma/client` -- ORM
- `zod` -- 运行时类型校验
- `swagger-jsdoc` + `koa2-swagger-ui` -- API 文档
- `bullmq` + `ioredis` -- 任务队列
- `openai` -- Embedding + LLM 调用（OpenAI 兼容接口）
- `@qdrant/js-client-rest` -- Qdrant 向量检索
