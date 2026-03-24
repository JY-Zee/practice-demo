# RAG 文档知识库系统

从零搭建的 AI 文档知识库系统，用于学习 RAG（Retrieval-Augmented Generation）的完整链路：文档上传 -> 解析切块 -> 向量入库 -> 语义检索 -> LLM 问答。

## 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                    Layer 6: 前端                         │
│            Next.js + Ant Design + TypeScript             │
│         文档管理页 ｜ 文档上传页 ｜ 知识库问答页          │
├─────────────────────────────────────────────────────────┤
│                    Layer 5: Agent 服务层                  │
│  Query Rewrite → Retriever → Prompt Builder → LLM Call  │
├─────────────────────────────────────────────────────────┤
│                    Layer 4: 异步 Worker                   │
│    BullMQ + Redis：解析 → 切块 → Embedding → 入库        │
├─────────────────────────────────────────────────────────┤
│                    Layer 3: 后端 API                      │
│       Koa + TypeScript：文档管理 ｜ 任务状态 ｜ 问答      │
├─────────────────────────────────────────────────────────┤
│                    Layer 2: 数据模型                      │
│         Prisma ORM ｜ Zod Schemas ｜ dotenv Config       │
├─────────────────────────────────────────────────────────┤
│                    Layer 1: 基础设施                      │
│          PostgreSQL ｜ Redis ｜ Qdrant (向量库)           │
└─────────────────────────────────────────────────────────┘
```

## 技术选型


| 层级        | 技术                           | 说明                         |
| --------- | ---------------------------- | -------------------------- |
| 前端        | Next.js + React + TypeScript | 管理台与问答界面                   |
| UI        | Ant Design                   | 组件库                        |
| 后端 API    | Koa + TypeScript             | Node.js Web 框架             |
| ORM       | Prisma                       | 类型安全的数据库访问                 |
| 数据校验      | Zod                          | 请求/响应 Schema 校验            |
| 异步任务      | BullMQ + Redis               | 文档摄取管线                     |
| 关系数据库     | PostgreSQL 16                | 文档元数据、任务状态、聊天记录            |
| 向量数据库     | Qdrant                       | 语义检索                       |
| 缓存/队列     | Redis 7                      | BullMQ Broker + 缓存         |
| 文档解析      | pdf-parse / mammoth          | 支持 txt、md、pdf              |
| Embedding | OpenAI 兼容接口                  | text-embedding-3-small       |
| LLM       | OpenAI 兼容接口                  | gpt-4o-mini                  |


## 目录结构

```
rag-demo/
├── docker-compose.yml          # 基础设施编排
├── .env.example                # 环境变量模板
├── README.md                   # 项目说明
├── scripts/                    # 初始化与工具脚本
│   ├── init_db.sql             # PostgreSQL 建表脚本（自动执行）
│   └── init_qdrant.py          # Qdrant 集合初始化
├── backend/                    # 后端 API（Koa + TypeScript）
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   └── schema.prisma       # Prisma 数据模型定义
│   └── src/
│       ├── app.ts              # Koa 应用入口
│       ├── config/             # 配置（dotenv + Zod 校验）
│       ├── lib/                # Prisma Client 单例
│       ├── middlewares/        # 错误处理、请求校验中间件
│       ├── schemas/            # Zod 请求/响应 Schema
│       ├── routers/            # API 路由（@koa/router）
│       ├── services/           # 业务逻辑
│       └── repositories/       # 数据访问层（Prisma Client）
├── worker/                     # 异步任务（BullMQ）
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── worker.ts           # Worker 入口
│       ├── pipeline.ts         # 任务编排
│       └── processors/         # 各步骤处理器
├── agent/                      # Agent 服务层（TypeScript）
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── service.ts          # 统一入口
│       ├── retriever.ts        # Qdrant 检索
│       ├── promptBuilder.ts    # Prompt 组装
│       ├── llmClient.ts        # LLM 调用（openai SDK）
│       ├── answerFormatter.ts  # 答案与引用格式化
│       ├── queryRewriter.ts    # 查询改写（预留）
│       └── reranker.ts         # 重排序（预留）
├── frontend/                   # 前端（Next.js）
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── lib/api-client.ts   # API 请求封装
│       └── app/
│           ├── documents/      # 文档管理页
│           └── chat/           # 问答页
└── docs/                       # 项目文档
    └── architecture.md         # 架构详细说明
```

## 快速开始

### 前置条件

- Docker & Docker Compose
- Node.js >= 20（后端 + 前端开发）
- OpenAI 兼容的 API Key（Embedding + LLM）

### 1. 克隆并配置环境变量

```bash
cd rag-demo
cp .env.example .env
# 编辑 .env，填入你的 API Key
```

### 2. 启动基础设施

```bash
docker compose up -d
```

等待所有服务健康后，PostgreSQL 会自动执行建表脚本。

### 3. 初始化 Qdrant 集合

```bash
pip install httpx
python scripts/init_qdrant.py
```

### 4. 验证服务状态

```bash
# PostgreSQL
docker exec kb_postgres pg_isready -U kb_user

# Redis
docker exec kb_redis redis-cli ping

# Qdrant
curl http://localhost:6333/healthz
```

## 核心功能（最小闭环）

1. **文档上传** -- 支持 txt / md / pdf，上传后自动触发处理
2. **文档摄取** -- 解析 → 切块 → Embedding → 写入 Qdrant
3. **任务状态** -- 实时查看文档处理进度（待处理/处理中/已完成/失败）
4. **知识问答** -- 基于已入库文档的语义检索 + LLM 生成回答
5. **引用溯源** -- 答案附带引用片段和来源文档名

## 环境变量说明


| 变量名                   | 说明               | 默认值                      |
| --------------------- | ---------------- | ------------------------ |
| `POSTGRES_USER`       | 数据库用户名           | `kb_user`                |
| `POSTGRES_PASSWORD`   | 数据库密码            | `kb_password`            |
| `POSTGRES_DB`         | 数据库名             | `kb_db`                  |
| `REDIS_URL`           | Redis 连接地址       | `redis://redis:6379/0`   |
| `QDRANT_HOST`         | Qdrant 地址        | `qdrant`                 |
| `QDRANT_COLLECTION`   | 集合名称             | `kb_documents`           |
| `EMBEDDING_API_KEY`   | Embedding API 密钥 | -                        |
| `EMBEDDING_MODEL`     | Embedding 模型     | `text-embedding-3-small` |
| `EMBEDDING_DIMENSION` | 向量维度             | `1536`                   |
| `LLM_API_KEY`         | LLM API 密钥       | -                        |
| `LLM_MODEL`           | LLM 模型           | `gpt-4o-mini`            |


## 搭建进度

- [x] Step 1: 基础设施层（Docker Compose + 初始化脚本 + 环境变量）
- [x] Step 2: 数据模型与配置层（Prisma + Zod Schemas + dotenv Config）
- [x] Step 3: 后端 API 骨架（Koa + TypeScript + 路由 + 服务）
- [ ] Step 4: 异步 Worker 层（BullMQ 文档摄取管线）
- [ ] Step 5: Agent 服务层（检索 + Prompt + LLM + 引用）
- [ ] Step 6: 前端层（Next.js + 文档管理 + 问答页）
- [ ] Step 7: 收尾（完善文档 + 一键脚本）

---

## Step 2 详解：数据模型与配置层

> **聚焦模块**: `backend/prisma/` + `backend/src/config/` + `backend/src/schemas/`

本步骤为整个后端服务搭建数据基座——定义数据库模型、环境变量校验、以及请求/响应的类型约束。所有上层模块（API、Worker、Agent）都将依赖这一层提供的类型安全保障。

### 新增文件一览

```
backend/
├── package.json                 # Node.js 项目配置（pnpm 管理依赖）
├── tsconfig.json                # TypeScript 编译配置
├── prisma/
│   └── schema.prisma            # Prisma ORM 数据模型（4 张核心表）
└── src/
    ├── config/
    │   └── env.ts               # 环境变量加载与 Zod 校验
    └── schemas/
        ├── document.ts          # 文档相关 Schema
        ├── chunk.ts             # 文档切块 Schema
        ├── task.ts              # 摄取任务 Schema
        └── chat.ts              # 聊天消息 Schema
```

### 2.1 项目初始化（package.json + tsconfig.json）

使用 **pnpm** 作为包管理器，核心依赖：

| 依赖 | 用途 |
| --- | --- |
| `@prisma/client` | Prisma ORM 客户端，提供类型安全的数据库操作 |
| `dotenv` | 从 `.env` 文件加载环境变量到 `process.env` |
| `zod` | 运行时类型校验库，替代 Pydantic 的 TypeScript 方案 |
| `prisma` (dev) | Prisma CLI，用于 migrate / generate / studio |
| `tsx` (dev) | TypeScript 执行器，支持热重载开发 |
| `typescript` (dev) | TypeScript 编译器 |

```bash
cd backend
pnpm install
```

### 2.2 环境变量管理（src/config/env.ts）

**设计思路**：用 Zod Schema 定义所有环境变量的类型和默认值，程序启动时统一校验。校验失败会打印明确错误并退出，避免运行时因缺少配置而出现难以追查的 bug。

**核心逻辑**：

1. `dotenv` 加载项目根目录的 `.env` 文件
2. `envSchema` 定义了 PostgreSQL、Redis、Qdrant、Embedding、LLM 等全部配置项
3. `safeParse` 校验通过后导出类型安全的 `env` 对象
4. 额外导出 `DATABASE_URL`，供 Prisma 连接数据库使用

```typescript
import { env, DATABASE_URL } from './config/env';

// 类型安全，IDE 自动补全
console.log(env.POSTGRES_HOST); // string
console.log(env.BACKEND_PORT);  // number
```

### 2.3 Prisma 数据模型（prisma/schema.prisma）

定义了 4 张核心表，与 `scripts/init_db.sql` 中的建表语句完全对齐：

| 模型 | 数据库表名 | 说明 |
| --- | --- | --- |
| `Document` | `documents` | 上传文档的元数据（文件名、类型、大小、状态等） |
| `DocumentChunk` | `document_chunks` | 文档切块，与 Qdrant 中的向量一一对应 |
| `IngestionTask` | `ingestion_tasks` | 文档摄取管线的任务状态跟踪 |
| `ChatMessage` | `chat_messages` | 用户与 AI 的问答会话记录 |

**关联关系**：

- `Document` 1:N `DocumentChunk`（级联删除）
- `Document` 1:N `IngestionTask`（级联删除）

**字段映射**：使用 `@map` 将 camelCase 的 TypeScript 字段映射到 snake_case 的数据库列名，兼顾代码风格与 SQL 惯例。

```bash
# 生成 Prisma Client（类型安全的查询构建器）
cd backend
npx prisma generate

# 连接数据库执行迁移（需要先启动 PostgreSQL）
npx prisma migrate dev --name init
```

### 2.4 Zod 请求/响应 Schema（src/schemas/）

为每个业务模块定义了请求输入和响应输出的 Schema，后续在 API 路由层作为入参校验和响应类型的单一数据源：

- **document.ts** — 文档上传输入、列表查询参数、分页响应、状态枚举
- **chunk.ts** — 切块创建输入、切块响应、按文档查询参数
- **task.ts** — 任务创建/更新输入、任务响应、状态与步骤枚举
- **chat.ts** — 提问请求体、消息响应、引用来源结构、会话历史查询

**Zod 的优势**：一份 Schema 同时提供运行时校验 + TypeScript 类型推导，无需手动维护 interface：

```typescript
import { AskQuestionSchema, type AskQuestionInput } from './schemas/chat';

// 运行时校验请求体
const result = AskQuestionSchema.safeParse(req.body);
if (!result.success) return res.status(400).json(result.error);

// result.data 自动获得正确类型
const { question, sessionId } = result.data;
```

### 2.5 验证方式

```bash
# 1. 安装依赖
cd backend && pnpm install

# 2. 生成 Prisma Client
npx prisma generate

# 3. TypeScript 类型检查（应无报错）
npx tsc --noEmit

# 4.（可选）连接数据库执行迁移
DATABASE_URL="postgresql://user:pass@host:5432/db" npx prisma migrate dev --name init
```

## Step 3 详解：后端 API 骨架

> **聚焦模块**: `backend/src/app.ts` + `backend/src/routers/` + `backend/src/services/` + `backend/src/repositories/`

本步骤为系统搭建 HTTP API 层——基于 Koa 框架实现文档管理、任务查询、问答接口。采用 **路由 → 服务 → 数据访问** 三层架构，复用 Step 2 定义的 Prisma 模型和 Zod Schema。

### 新增文件一览

```
backend/
├── Dockerfile                          # 多阶段 Docker 构建
└── src/
    ├── app.ts                          # Koa 应用入口（CORS、Swagger、Graceful Shutdown）
    ├── lib/
    │   └── prisma.ts                   # Prisma Client 单例
    ├── middlewares/
    │   ├── errorHandler.ts             # 全局错误处理中间件
    │   └── validate.ts                 # Zod 请求校验中间件
    ├── repositories/
    │   ├── documentRepository.ts       # 文档 CRUD
    │   ├── chunkRepository.ts          # 切块 CRUD
    │   ├── taskRepository.ts           # 任务 CRUD
    │   └── chatRepository.ts           # 消息 CRUD
    ├── services/
    │   ├── documentService.ts          # 文档上传 + 列表 + 详情
    │   ├── taskService.ts              # 任务查询
    │   └── chatService.ts              # 问答（当前 mock 实现）
    └── routers/
        ├── health.ts                   # GET /api/health
        ├── documents.ts                # POST /upload · GET / · GET /:id
        ├── tasks.ts                    # GET /:id
        └── chat.ts                     # POST /ask · GET /messages
```

### 3.1 技术选型

| 依赖 | 用途 |
| --- | --- |
| `koa` | 核心框架，基于中间件洋葱模型 |
| `@koa/router` | 路由管理 |
| `@koa/cors` | 跨域处理 |
| `@koa/multer` + `multer` | 文件上传（磁盘存储） |
| `koa-bodyparser` | JSON 请求体解析 |
| `swagger-jsdoc` + `koa2-swagger-ui` | 自动生成 Swagger API 文档 |

### 3.2 三层架构

```
Router（路由层）
  ↓ 入参校验（Zod validate 中间件）
Service（服务层）
  ↓ 业务编排
Repository（数据访问层）
  ↓ Prisma Client
PostgreSQL
```

- **Router**：定义 HTTP 端点，使用 `validate()` 中间件校验入参，调用 Service
- **Service**：处理业务逻辑（如上传时同步创建摄取任务），返回序列化后的响应
- **Repository**：封装 Prisma 查询，Service 不直接操作数据库

### 3.3 API 端点

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/health` | 健康检查（含数据库连通性） |
| `POST` | `/api/documents/upload` | 文件上传（multipart/form-data） |
| `GET` | `/api/documents` | 分页查询文档列表 |
| `GET` | `/api/documents/:id` | 查询文档详情 |
| `GET` | `/api/tasks/:id` | 查询摄取任务详情 |
| `POST` | `/api/chat/ask` | 提问（当前 mock，Step 5 接入 Agent） |
| `GET` | `/api/chat/messages` | 查询会话历史 |

### 3.4 Swagger 文档

路由文件中使用 JSDoc `@openapi` 注释定义接口规范，由 `swagger-jsdoc` 自动收集生成 OpenAPI 3.0 spec，`koa2-swagger-ui` 提供可交互的文档页面。

### 3.5 验证方式

```bash
# 1. 安装依赖
cd backend && pnpm install

# 2. 本地开发启动（需先启动基础设施 docker compose up -d）
pnpm dev

# 3. 验证健康检查
curl http://localhost:8000/api/health

# 4. 访问 Swagger 文档
# 浏览器打开 http://localhost:8000/api-docs

# 5. 上传文件测试
curl -X POST http://localhost:8000/api/documents/upload \
  -F "file=@test.md"

# 6. Docker 方式启动
docker compose up backend
```

---

## 后续迭代路线

- 查询改写（Query Rewrite）
- 重排序（Rerank）
- 多轮对话记忆
- Tool Use / Function Calling
- LangGraph Agent 编排
- 批量文档导入
- 文档版本管理
- 用户权限系统

