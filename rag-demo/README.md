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
│    Celery + Redis：解析 → 切块 → Embedding → 入库        │
├─────────────────────────────────────────────────────────┤
│                    Layer 3: 后端 API                      │
│           FastAPI：文档管理 ｜ 任务状态 ｜ 问答           │
├─────────────────────────────────────────────────────────┤
│                    Layer 2: 数据模型                      │
│       SQLAlchemy ORM ｜ Pydantic Schemas ｜ Config       │
├─────────────────────────────────────────────────────────┤
│                    Layer 1: 基础设施                      │
│          PostgreSQL ｜ Redis ｜ Qdrant (向量库)           │
└─────────────────────────────────────────────────────────┘
```

## 技术选型

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | Next.js + React + TypeScript | 管理台与问答界面 |
| UI | Ant Design | 组件库 |
| 后端 API | FastAPI | Python 异步 Web 框架 |
| 异步任务 | Celery + Redis | 文档摄取管线 |
| 关系数据库 | PostgreSQL 16 | 文档元数据、任务状态、聊天记录 |
| 向量数据库 | Qdrant | 语义检索 |
| 缓存/队列 | Redis 7 | Celery Broker + 缓存 |
| 文档解析 | pypdf / python-docx | 支持 txt、md、pdf |
| Embedding | OpenAI 兼容接口 | text-embedding-3-small |
| LLM | OpenAI 兼容接口 | gpt-4o-mini |

## 目录结构

```
rag-demo/
├── docker-compose.yml          # 基础设施编排
├── .env.example                # 环境变量模板
├── README.md                   # 项目说明
├── scripts/                    # 初始化与工具脚本
│   ├── init_db.sql             # PostgreSQL 建表脚本（自动执行）
│   └── init_qdrant.py          # Qdrant 集合初始化
├── backend/                    # 后端 API（FastAPI）
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py             # 应用入口
│       ├── core/               # 配置、日志
│       ├── db/                 # 数据库连接与初始化
│       ├── models/             # SQLAlchemy ORM 模型
│       ├── schemas/            # Pydantic 请求/响应模型
│       ├── routers/            # API 路由
│       ├── services/           # 业务逻辑
│       └── repositories/       # 数据访问层
├── worker/                     # 异步任务（Celery）
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── celery_app.py       # Celery 实例
│       ├── pipeline.py         # 任务编排
│       └── tasks/              # 各步骤任务
├── agent/                      # Agent 服务层
│   ├── service.py              # 统一入口
│   ├── retriever.py            # Qdrant 检索
│   ├── prompt_builder.py       # Prompt 组装
│   ├── llm_client.py           # LLM 调用
│   ├── answer_formatter.py     # 答案与引用格式化
│   ├── query_rewriter.py       # 查询改写（预留）
│   └── reranker.py             # 重排序（预留）
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
- Node.js >= 18（前端开发）
- Python >= 3.11（后端开发）
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

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `POSTGRES_USER` | 数据库用户名 | `kb_user` |
| `POSTGRES_PASSWORD` | 数据库密码 | `kb_password` |
| `POSTGRES_DB` | 数据库名 | `kb_db` |
| `REDIS_URL` | Redis 连接地址 | `redis://redis:6379/0` |
| `QDRANT_HOST` | Qdrant 地址 | `qdrant` |
| `QDRANT_COLLECTION` | 集合名称 | `kb_documents` |
| `EMBEDDING_API_KEY` | Embedding API 密钥 | - |
| `EMBEDDING_MODEL` | Embedding 模型 | `text-embedding-3-small` |
| `EMBEDDING_DIMENSION` | 向量维度 | `1536` |
| `LLM_API_KEY` | LLM API 密钥 | - |
| `LLM_MODEL` | LLM 模型 | `gpt-4o-mini` |

## 搭建进度

- [x] Step 1: 基础设施层（Docker Compose + 初始化脚本 + 环境变量）
- [ ] Step 2: 数据模型与配置层（ORM + Schemas + Config）
- [ ] Step 3: 后端 API 骨架（FastAPI + 路由 + 服务）
- [ ] Step 4: 异步 Worker 层（Celery 文档摄取管线）
- [ ] Step 5: Agent 服务层（检索 + Prompt + LLM + 引用）
- [ ] Step 6: 前端层（Next.js + 文档管理 + 问答页）
- [ ] Step 7: 收尾（完善文档 + 一键脚本）

## 后续迭代路线

- 查询改写（Query Rewrite）
- 重排序（Rerank）
- 多轮对话记忆
- Tool Use / Function Calling
- LangGraph Agent 编排
- 批量文档导入
- 文档版本管理
- 用户权限系统
