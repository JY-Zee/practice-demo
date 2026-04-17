# RAG 文档知识库系统 - 项目概述

## 项目定位

一个从零搭建的 AI 文档知识库系统，用于学习 RAG（Retrieval-Augmented Generation）完整链路。覆盖从文档上传、解析切块、向量化入库，到语义检索和 LLM 问答的全流程。

## 技术栈

| 类别 | 技术 |
|------|------|
| 后端框架 | Koa + TypeScript |
| ORM | Prisma |
| 数据校验 | Zod |
| 异步任务 | BullMQ + Redis |
| 关系数据库 | PostgreSQL 18 |
| 向量数据库 | Qdrant |
| Embedding | OpenAI 兼容接口 |
| LLM | OpenAI 兼容接口 (gpt-4o-mini) |
| 前端框架 | Next.js 15 (App Router) + React 19 + TypeScript |
| 前端 UI | Ant Design 5 + TanStack Query v5 |
| 容器编排 | Docker Compose |

## 架构概览

系统采用分层架构，共 6 层：

```
前端 (Next.js)  →  后端 API (Koa)  →  异步 Worker (BullMQ)
                        ↓                     ↓
                   PostgreSQL            Qdrant + Embedding API
                        ↓
                   Agent 服务层 → LLM API
```

## 模块索引

| 模块 | 目录 | 职责 | 文档 |
|------|------|------|------|
| 后端 API | `backend/` | HTTP 接口层，文档管理、任务查询、问答路由 | [docs/backend.md](docs/backend.md) |
| 异步 Worker | `worker/` | 文档摄取流水线（解析→切块→向量化→入库） | [docs/worker.md](docs/worker.md) |
| 基础设施 | `docker-compose.yml` | PostgreSQL、Redis、Qdrant 容器编排 | [docs/infrastructure.md](docs/infrastructure.md) |
| 数据模型 | `backend/prisma/` + `*/src/schemas/` | Prisma ORM + Zod Schema + 环境配置 | [docs/data-model.md](docs/data-model.md) |
| 摄取流水线 | `worker/src/processors/` | 解析→切块→向量化→入库的完整数据流 | [docs/ingestion-pipeline.md](docs/ingestion-pipeline.md) |
| Agent 服务层 | `backend/src/agent/` | 检索 + Prompt 组装 + LLM 调用 | [docs/agent.md](docs/agent.md) |
| 前端 | `frontend/` | Next.js 管理台与问答界面（上传 / 列表 / 问答） | [docs/frontend.md](docs/frontend.md) |

## 当前进度

- [x] Layer 1: 基础设施（Docker Compose + 初始化脚本）
- [x] Layer 2: 数据模型（Prisma + Zod + 环境配置）
- [x] Layer 3: 后端 API（Koa 路由 + 服务 + 数据访问层）
- [x] Layer 4: 异步 Worker（BullMQ 文档摄取管线）
- [x] Layer 5: Agent 服务层（语义检索 + LLM 问答）
- [x] Layer 6: 前端（Next.js App Router + AntD + TanStack Query 管理台）

## 核心数据流

```
用户上传文档
  → POST /api/documents/upload
  → 写入 documents 表 + 创建 ingestion_tasks
  → BullMQ 投递任务
  → Worker 5 步流水线: parse → split → embed → upsert → complete
  → 文本切块写入 document_chunks 表
  → 向量写入 Qdrant

用户提问
  → POST /api/chat/ask
  → chatService → agent.runChat
      → queryRewriter（占位）
      → retriever（Qdrant 语义检索）
      → reranker（占位）
      → promptBuilder（Prompt 组装 + 字符裁剪）
      → llmClient（OpenAI 兼容 LLM）
      → answerFormatter（引用来源整理）
  → 持久化 ChatMessage（含 referencesJson）
  ← { content, referencesJson, meta }
```

## 快速启动

```bash
cp .env.example .env   # 填入真实 API Key
docker compose up -d   # 启动基础设施
python scripts/init_qdrant.py  # 初始化向量集合

# 前端
cd frontend && cp .env.local.example .env.local && pnpm install && pnpm dev
```
