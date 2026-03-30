---
name: rag-layered-build
overview: 将 rag-demo 项目计划重组为"逐层向上、每次只做一个模块"的搭建方式。严格按照 基础设施 -> 数据库模型 -> 后端API -> 异步Worker -> Agent层 -> 前端 的顺序，每个步骤只专注一个模块，完成并验证后再往上推进。
todos:
  - id: step1-infra
    content: "Step 1: 基础设施层 -- docker-compose增强 + .env.example + scripts/init_db.sql + scripts/init_qdrant.py + README第一版"
    status: completed
  - id: step2-models
    content: "Step 2: 数据模型与配置层 -- backend/prisma + src/config + src/schemas + package.json"
    status: completed
  - id: step3-backend
    content: "Step 3: 后端API骨架 -- Koa + TypeScript + routers + services + repositories + Dockerfile"
    status: completed
  - id: step4-worker
    content: "Step 4: 异步Worker层 -- BullMQ + 5个任务处理器 + pipeline + Dockerfile"
    status: pending
  - id: step5-agent
    content: "Step 5: Agent服务层 -- retriever + promptBuilder + llmClient + answerFormatter + service入口"
    status: pending
  - id: step6-frontend
    content: "Step 6: 前端层 -- Next.js + Ant Design + 3个页面 + api-client + Dockerfile"
    status: pending
  - id: step7-docs
    content: "Step 7: 收尾 -- 完善README + docs/architecture.md + 一键启动脚本"
    status: pending
isProject: false
---

# RAG 知识库 -- 逐层搭建计划（从底层到顶层）

## 分层架构总览

整个系统分 6 层，严格从下往上搭建，每次只做一层：

```mermaid
flowchart TB
  subgraph L1 [Layer1 -- 基础设施]
    Postgres[(PostgreSQL)]
    Redis[(Redis)]
    Qdrant[(Qdrant)]
  end

  subgraph L2 [Layer2 -- 数据模型与初始化]
    PrismaModels[Prisma ORM模型与迁移]
    QdrantInit[Qdrant集合初始化]
    EnvConfig[环境变量与配置]
  end

  subgraph L3 [Layer3 -- 后端API骨架]
    KoaApp[Koa + TypeScript应用]
    Routers[路由层]
    Services[服务层]
    Repos[数据访问层]
  end

  subgraph L4 [Layer4 -- 异步Worker]
    BullMQApp[BullMQ Worker]
    ParseTask[文档解析任务]
    ChunkTask[切块任务]
    EmbedTask[Embedding任务]
    UpsertTask[向量写入任务]
  end

  subgraph L5 [Layer5 -- Agent服务层]
    Retriever[检索器]
    PromptBuilder[Prompt构造]
    LLMClient[LLM调用]
    AnswerFormatter[答案格式化]
  end

  subgraph L6 [Layer6 -- 前端]
    NextApp[Next.js应用]
    DocPages[文档管理页]
    ChatPage[问答页]
    ApiClient[API请求层]
  end

  L1 --> L2
  L2 --> L3
  L3 --> L4
  L4 --> L5
  L5 --> L6
```



## 搭建顺序与每层详细内容

---

### Step 1: 基础设施层 (Infrastructure)

**聚焦模块**: `docker-compose.yml` + `.env.example` + `scripts/`

**做什么**:

- 在现有 [docker-compose.yml](rag-demo/docker-compose.yml) 基础上，补齐网络、健康检查、初始化脚本挂载
- 新增 Postgres 初始化 SQL 脚本（`scripts/init_db.sql`），挂载到容器 `docker-entrypoint-initdb.d`
- 新增 Qdrant 集合初始化脚本（`scripts/init_qdrant.py`），可独立运行
- 创建 `.env.example`，列出所有环境变量及默认值
- 创建 `README.md` 第一版，先写项目目标、技术选型、架构图

**新增/修改文件**:

- [docker-compose.yml](rag-demo/docker-compose.yml) -- 修改
- [.env.example](rag-demo/.env.example) -- 新增
- [scripts/init_db.sql](rag-demo/scripts/init_db.sql) -- 新增
- [scripts/init_qdrant.py](rag-demo/scripts/init_qdrant.py) -- 新增
- [README.md](rag-demo/README.md) -- 新增

**验证标准**: `docker compose up -d` 能拉起 3 个依赖服务，Postgres 自动建表，README 能看到架构图。

---

### Step 2: 数据模型与配置层 (Models & Config)

**聚焦模块**: `backend/prisma/` + `backend/src/config/` + `backend/src/schemas/`

**做什么**:

- 初始化 `backend/` Node.js + TypeScript 项目，创建 `package.json` + `tsconfig.json`
- 实现配置管理 `src/config/env.ts`（用 dotenv + Zod 验证环境变量）
- 配置 Prisma ORM，连接 PostgreSQL
- 定义 4 张核心数据模型（在 `prisma/schema.prisma` 中）:
  - `Document` -- documents 表
  - `DocumentChunk` -- document_chunks 表
  - `IngestionTask` -- ingestion_tasks 表
  - `ChatMessage` -- chat_messages 表
- 用 Zod 定义请求/响应 schemas（替代 Pydantic）
- 通过 `prisma migrate dev` 执行数据库迁移建表

**新增文件**:

- [backend/package.json](rag-demo/backend/package.json)
- [backend/tsconfig.json](rag-demo/backend/tsconfig.json)
- [backend/prisma/schema.prisma](rag-demo/backend/prisma/schema.prisma)
- [backend/src/config/env.ts](rag-demo/backend/src/config/env.ts)
- [backend/src/schemas/document.ts](rag-demo/backend/src/schemas/document.ts)
- [backend/src/schemas/chunk.ts](rag-demo/backend/src/schemas/chunk.ts)
- [backend/src/schemas/task.ts](rag-demo/backend/src/schemas/task.ts)
- [backend/src/schemas/chat.ts](rag-demo/backend/src/schemas/chat.ts)

**验证标准**: 通过 `npx prisma migrate dev` 连接 Postgres 并成功建表，`env.ts` 能正确读取并校验 `.env`。

---

### Step 3: 后端 API 骨架 (Backend API)

**聚焦模块**: `backend/src/app.ts` + `backend/src/routers/` + `backend/src/services/` + `backend/src/repositories/`

**做什么**:

- 创建 Koa + TypeScript 应用入口 `src/app.ts`（含 CORS、错误处理中间件、graceful shutdown）
- 集成 swagger-jsdoc + koa2-swagger-ui 生成 API 文档
- 创建 `Dockerfile`（基于 Node.js 20-alpine 多阶段构建）
- 创建 Prisma Client 单例 `src/lib/prisma.ts`
- 创建全局中间件 `src/middlewares/`（errorHandler、validate）
- 实现数据访问层 `repositories/`（基于 Prisma Client 封装 CRUD）
- 实现业务服务层 `services/`（documentService, taskService, chatService）
- 实现路由层（基于 @koa/router）:
  - `routers/health.ts` -- `GET /api/health`
  - `routers/documents.ts` -- `POST /api/documents/upload`（用 @koa/multer 处理文件上传）, `GET /api/documents`, `GET /api/documents/:id`
  - `routers/tasks.ts` -- `GET /api/tasks/:id`
  - `routers/chat.ts` -- `POST /api/chat/ask`（此时先返回 mock 数据）
- 更新 `docker-compose.yml` 加入 backend 服务

**新增/修改文件**:

- [backend/src/app.ts](rag-demo/backend/src/app.ts)
- [backend/Dockerfile](rag-demo/backend/Dockerfile)
- [backend/src/lib/prisma.ts](rag-demo/backend/src/lib/prisma.ts)
- [backend/src/middlewares/errorHandler.ts](rag-demo/backend/src/middlewares/errorHandler.ts)
- [backend/src/middlewares/validate.ts](rag-demo/backend/src/middlewares/validate.ts)
- [backend/src/routers/health.ts](rag-demo/backend/src/routers/health.ts)
- [backend/src/routers/documents.ts](rag-demo/backend/src/routers/documents.ts)
- [backend/src/routers/tasks.ts](rag-demo/backend/src/routers/tasks.ts)
- [backend/src/routers/chat.ts](rag-demo/backend/src/routers/chat.ts)
- [backend/src/services/documentService.ts](rag-demo/backend/src/services/documentService.ts)
- [backend/src/services/taskService.ts](rag-demo/backend/src/services/taskService.ts)
- [backend/src/services/chatService.ts](rag-demo/backend/src/services/chatService.ts)
- [backend/src/repositories/documentRepository.ts](rag-demo/backend/src/repositories/documentRepository.ts)
- [backend/src/repositories/chunkRepository.ts](rag-demo/backend/src/repositories/chunkRepository.ts)
- [backend/src/repositories/taskRepository.ts](rag-demo/backend/src/repositories/taskRepository.ts)
- [backend/src/repositories/chatRepository.ts](rag-demo/backend/src/repositories/chatRepository.ts)
- [docker-compose.yml](rag-demo/docker-compose.yml) -- 修改

**验证标准**: `docker compose up backend` 启动后，访问 `http://localhost:8000/api-docs` 能看到 Swagger 文档，`/api/health` 返回 200，文档上传接口能写入 Postgres。

---

### Step 4: 异步 Worker 层 (BullMQ Worker)

**聚焦模块**: `worker/`

**做什么**:

- 初始化 Node.js + TypeScript Worker 项目，使用 BullMQ 连接 Redis
- 实现文档摄取管线，拆成 5 个独立 processor:
  - `processors/parseDocument.ts` -- 读文件、抽取纯文本（支持 txt/md/pdf，用 pdf-parse）
  - `processors/splitChunks.ts` -- 按固定窗口+重叠切块
  - `processors/embedChunks.ts` -- 调用 Embedding API 生成向量
  - `processors/upsertVectors.ts` -- 写入 Qdrant
  - `processors/markComplete.ts` -- 更新 Postgres 任务/文档状态
- 实现管线编排 `pipeline.ts`（用 FlowProducer 串联上述 5 步）
- 创建 `Dockerfile`（基于 Node.js 20-alpine 多阶段构建）
- 更新 `docker-compose.yml` 加入 worker 服务
- 修改 backend 的 `documentService`，在上传完成后向 BullMQ 队列添加任务

**新增/修改文件**:

- [worker/package.json](rag-demo/worker/package.json)
- [worker/tsconfig.json](rag-demo/worker/tsconfig.json)
- [worker/src/worker.ts](rag-demo/worker/src/worker.ts)
- [worker/src/processors/parseDocument.ts](rag-demo/worker/src/processors/parseDocument.ts)
- [worker/src/processors/splitChunks.ts](rag-demo/worker/src/processors/splitChunks.ts)
- [worker/src/processors/embedChunks.ts](rag-demo/worker/src/processors/embedChunks.ts)
- [worker/src/processors/upsertVectors.ts](rag-demo/worker/src/processors/upsertVectors.ts)
- [worker/src/processors/markComplete.ts](rag-demo/worker/src/processors/markComplete.ts)
- [worker/src/pipeline.ts](rag-demo/worker/src/pipeline.ts)
- [worker/Dockerfile](rag-demo/worker/Dockerfile)
- [docker-compose.yml](rag-demo/docker-compose.yml) -- 修改
- [backend/src/services/documentService.ts](rag-demo/backend/src/services/documentService.ts) -- 修改

**验证标准**: 上传一个 txt/md 文件后，Worker 日志能看到 5 步依次执行，Postgres 中文档状态变为 `completed`，Qdrant 中能查到对应向量。

---

### Step 5: Agent 服务层 (Agent Service)

**聚焦模块**: `agent/`

**做什么**:

- 初始化 Node.js + TypeScript Agent 项目
- 创建 Agent 统一入口 `service.ts`，暴露 `runChat(question, sessionId)` 接口
- 实现检索模块 `retriever.ts` -- 调 Qdrant 搜索 TopK 片段
- 实现 Prompt 构造模块 `promptBuilder.ts` -- 组装系统提示词 + 检索上下文 + 用户问题
- 实现 LLM 调用模块 `llmClient.ts` -- 封装 OpenAI 兼容接口（用 openai SDK）
- 实现答案格式化 `answerFormatter.ts` -- 提取引用来源
- 预留接口位:
  - `queryRewriter.ts` -- 第一版直接返回原始问题
  - `reranker.ts` -- 第一版直接返回检索结果
- 修改 backend 的 `chatService.ts`，把 mock 替换为调用 Agent
- 修改 backend 的 `routers/chat.ts`，支持流式返回（SSE）

**新增/修改文件**:

- [agent/package.json](rag-demo/agent/package.json)
- [agent/tsconfig.json](rag-demo/agent/tsconfig.json)
- [agent/src/service.ts](rag-demo/agent/src/service.ts)
- [agent/src/retriever.ts](rag-demo/agent/src/retriever.ts)
- [agent/src/promptBuilder.ts](rag-demo/agent/src/promptBuilder.ts)
- [agent/src/llmClient.ts](rag-demo/agent/src/llmClient.ts)
- [agent/src/answerFormatter.ts](rag-demo/agent/src/answerFormatter.ts)
- [agent/src/queryRewriter.ts](rag-demo/agent/src/queryRewriter.ts)
- [agent/src/reranker.ts](rag-demo/agent/src/reranker.ts)
- [backend/src/services/chatService.ts](rag-demo/backend/src/services/chatService.ts) -- 修改
- [backend/src/routers/chat.ts](rag-demo/backend/src/routers/chat.ts) -- 修改

**验证标准**: 通过 curl 或 Swagger 调用 `POST /api/chat/ask`，能基于已入库的文档内容返回答案并带引用来源。

---

### Step 6: 前端层 (Frontend)

**聚焦模块**: `frontend/`

**做什么**:

- 用 Next.js + TypeScript 初始化项目
- 引入 Ant Design 作为 UI 组件库
- 封装 API 请求层 `lib/api-client.ts`
- 实现 3 个核心页面:
  - `/documents` -- 文档列表，展示状态，支持轮询
  - `/documents/upload` -- 文件上传，展示上传进度和处理状态
  - `/chat` -- 问答对话，展示引用片段和来源
- 创建 `Dockerfile` 用于前端容器化
- 更新 `docker-compose.yml` 加入 frontend 服务

**新增/修改文件**:

- [frontend/package.json](rag-demo/frontend/package.json)
- [frontend/Dockerfile](rag-demo/frontend/Dockerfile)
- [frontend/src/lib/api-client.ts](rag-demo/frontend/src/lib/api-client.ts)
- [frontend/src/app/documents/page.tsx](rag-demo/frontend/src/app/documents/page.tsx)
- [frontend/src/app/documents/upload/page.tsx](rag-demo/frontend/src/app/documents/upload/page.tsx)
- [frontend/src/app/chat/page.tsx](rag-demo/frontend/src/app/chat/page.tsx)
- [docker-compose.yml](rag-demo/docker-compose.yml) -- 修改

**验证标准**: 浏览器访问 `http://localhost:3000`，能上传文档、看到处理状态、在问答页提问并得到带引用的回答。

---

### Step 7: 收尾 -- 文档与脚本

**聚焦模块**: `README.md` + `docs/` + `scripts/`

**做什么**:

- 完善 README：补齐完整启动步骤、环境变量说明、最小演示流程、迭代路线图
- 创建 `docs/architecture.md`：完整架构说明和数据流图
- 补齐一键启动/重置脚本:
  - `scripts/dev_start.sh` -- 一键拉起全部服务
  - `scripts/dev_reset.sh` -- 清除数据重新初始化
- 更新 plan 文件标记所有步骤已完成

**修改文件**:

- [README.md](rag-demo/README.md) -- 完善
- [docs/architecture.md](rag-demo/docs/architecture.md) -- 新增
- [scripts/dev_start.sh](rag-demo/scripts/dev_start.sh) -- 新增
- [scripts/dev_reset.sh](rag-demo/scripts/dev_reset.sh) -- 新增

**验证标准**: 另一个人克隆仓库后，照着 README 执行 3 条命令就能跑通完整链路。

---

## 执行原则

- 每个 Step 完成并验证后，再开始下一个 Step
- 每个 Step 做完后更新 README 中对应部分
- 不跨层引入依赖（例如 Step 2 不写路由，Step 3 不写 Worker）
- 所有配置通过 `.env` 注入，不硬编码密钥
- 先跑通再抽象，先单机再容器化

