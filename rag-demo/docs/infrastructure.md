# Infrastructure 模块 - 基础设施层

## 概述

通过 Docker Compose 编排 3 个核心基础设施服务 + 2 个应用服务，配合初始化脚本完成数据库建表和向量集合创建。

## Docker Compose 服务

| 服务 | 镜像 | 端口 | 用途 |
|------|------|------|------|
| postgres | postgres:18.3 | 5432 | 关系数据库，存储文档元数据、切块、任务状态、聊天记录 |
| redis | redis:8.6.1-alpine | 6379 | BullMQ Broker + 缓存 |
| qdrant | qdrant/qdrant:v1.17.0 | 6333/6334 | 向量数据库，存储文档切块的 Embedding 向量 |
| backend | 自建镜像 | 8000 | 后端 API 服务 |
| worker | 自建镜像 | - | 异步摄取 Worker（无对外端口） |

## 服务依赖关系

```
backend  ──depends_on──→  postgres (healthy)
         ──depends_on──→  redis (healthy)
         ──depends_on──→  qdrant (healthy)

worker   ──depends_on──→  postgres (healthy)
         ──depends_on──→  redis (healthy)
         ──depends_on──→  qdrant (healthy)
```

所有依赖均使用 `condition: service_healthy`，确保基础设施就绪后应用才启动。

## 健康检查

- **PostgreSQL**: `pg_isready -U kb_user -d kb_db`
- **Redis**: `redis-cli ping`
- **Qdrant**: bash TCP 探测 6333 端口（镜像未安装 curl）
- **Backend**: `wget -qO- http://localhost:8000/api/health`

## 数据持久化

| Volume | 挂载路径 | 用途 |
|--------|----------|------|
| postgres_data | /var/lib/postgresql | PostgreSQL 数据 |
| redis_data | /data | Redis AOF 持久化 |
| qdrant_data | /qdrant/storage | Qdrant 向量数据 |
| backend_uploads | /app/uploads | 上传文件（backend + worker 共享） |

## 初始化脚本

### scripts/init_db.sql

PostgreSQL 建表脚本，通过 Docker 挂载到 `docker-entrypoint-initdb.d` 自动执行：

- 启用 `uuid-ossp` 扩展
- 创建 4 张表：`documents`、`document_chunks`、`ingestion_tasks`、`chat_messages`
- 创建 6 个索引加速常用查询
- 外键约束：`document_chunks` 和 `ingestion_tasks` 级联删除关联 `documents`

### scripts/init_qdrant.py

Python 脚本，手动运行初始化 Qdrant 集合：

- 创建 `kb_documents` 集合，使用 Cosine 距离
- 向量维度由 `EMBEDDING_DIMENSION` 环境变量决定
- 如集合已存在，校验维度是否匹配
- 创建 3 个 payload 索引：`document_id`、`file_name`、`chunk_id`

## 网络

所有服务位于同一 Docker 网络 `kb_network`（bridge 模式），服务间通过容器名互访。

## 环境变量

通过 `.env` 文件统一管理，`docker-compose.yml` 使用 `${VAR:-default}` 语法引用。详见 `.env.example` 中的完整配置模板。
