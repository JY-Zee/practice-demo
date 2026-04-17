# Data Model 模块 - 数据模型与校验

## 概述

定义系统的数据基座，包括 Prisma ORM 数据模型、Zod 请求/响应 Schema、环境变量校验。所有上层模块（API、Worker、Agent）依赖此层的类型安全保障。

## 数据库表结构

### documents - 文档元数据表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键，自动生成 |
| file_name | VARCHAR(500) | 原始文件名 |
| file_type | VARCHAR(50) | 文件扩展名（txt/md/pdf） |
| file_size | BIGINT | 文件大小（字节） |
| storage_path | VARCHAR(1000) | 磁盘存储路径 |
| status | VARCHAR(50) | 状态：pending → processing → completed / failed |
| chunk_count | INTEGER | 切块数量 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

### document_chunks - 文档切块表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| document_id | UUID | 关联文档 ID（级联删除） |
| chunk_index | INTEGER | 切块序号 |
| content | TEXT | 切块文本内容 |
| token_count | INTEGER | Token 数量 |
| metadata_json | JSONB | 扩展元数据 |
| created_at | TIMESTAMPTZ | 创建时间 |

### ingestion_tasks - 摄取任务表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| document_id | UUID | 关联文档 ID（级联删除） |
| status | VARCHAR(50) | pending / processing / completed / failed |
| current_step | VARCHAR(100) | 当前执行步骤（parse/split/embed/upsert/complete） |
| error_message | TEXT | 失败时的错误信息 |
| started_at | TIMESTAMPTZ | 开始时间 |
| finished_at | TIMESTAMPTZ | 完成时间 |
| created_at | TIMESTAMPTZ | 创建时间 |

### chat_messages - 聊天消息表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| session_id | VARCHAR(100) | 会话 ID |
| role | VARCHAR(20) | 角色：user / assistant |
| content | TEXT | 消息内容 |
| references_json | JSONB | 引用来源（assistant 消息附带） |
| created_at | TIMESTAMPTZ | 创建时间 |

## Zod Schema

位于 `backend/src/schemas/`，为每个业务模块定义请求输入和响应输出的 Schema：

- **document.ts** -- 文档上传输入、列表查询参数、分页响应、状态枚举
- **chunk.ts** -- 切块创建输入、切块响应
- **task.ts** -- 任务创建/更新输入、状态与步骤枚举
- **chat.ts** -- 提问请求体、消息响应、引用来源结构

Zod 一份 Schema 同时提供运行时校验 + TypeScript 类型推导，无需手动维护 interface。

## 环境变量校验

`backend/src/config/env.ts` 和 `worker/src/config/env.ts` 使用 Zod 定义所有环境变量的类型和默认值：

- PostgreSQL 连接信息（5 项）
- Redis 连接信息（3 项）
- Qdrant 连接信息（4 项）
- Embedding API 配置（4 项，均为必填）
- LLM API 配置（3 项）
- 文件存储、队列前缀、服务端口等

启动时校验不通过会打印明确错误并 `process.exit(1)`。

## 字段映射

Prisma 使用 `@map` 将 camelCase 的 TypeScript 字段映射到 snake_case 的数据库列名：

```
fileName  →  file_name
fileType  →  file_type
documentId  →  document_id
```

兼顾 TypeScript 代码风格与 SQL 命名惯例。
