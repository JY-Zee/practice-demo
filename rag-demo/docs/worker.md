# Worker 模块 - 异步文档摄取管线

## 概述

基于 BullMQ 的异步任务处理服务，负责文档摄取的完整流水线：解析 → 切块 → 向量化 → 入库。与 Backend 共享文件存储卷，独立部署运行。

## 目录结构

```
worker/
├── Dockerfile
├── package.json
├── tsconfig.json
├── prisma/
│   └── schema.prisma           # 与 backend 相同的数据模型
└── src/
    ├── worker.ts               # Worker 入口（6 个 Worker 实例）
    ├── pipeline.ts             # FlowProducer 流水线编排
    ├── config/
    │   └── env.ts              # 环境变量配置
    ├── lib/
    │   ├── prisma.ts           # Prisma Client 单例
    │   ├── openai.ts           # OpenAI 兼容客户端
    │   ├── qdrant.ts           # Qdrant 客户端 + 集合兼容性检查
    │   ├── queue.ts            # BullMQ 队列名常量 + 连接配置
    │   ├── embedding.ts        # Embedding 请求构建 + 维度校验
    │   ├── artifacts.ts        # 中间产物文件读写
    │   ├── flow.ts             # FlowProducer 子任务取值工具
    │   └── ingestionState.ts   # 任务/文档状态回写
    ├── processors/
    │   ├── parseDocument.ts    # 步骤 1: 文档解析
    │   ├── splitChunks.ts      # 步骤 2: 文本切块
    │   ├── embedChunks.ts      # 步骤 3: 向量生成
    │   ├── upsertVectors.ts    # 步骤 4: 写入 PG + Qdrant
    │   └── markComplete.ts     # 步骤 5: 标记完成
    └── types/
        └── jobs.ts             # 任务载荷与产物类型定义
```

## 流水线架构

使用 BullMQ `FlowProducer` 将 5 个步骤串为依赖链：

```
document-ingestion (触发队列)
  └→ FlowProducer 创建依赖链:
      parse → split → embed → upsert → complete
```

每一步是独立的 BullMQ Worker，通过中间产物文件传递数据。

## 5 步处理器详解

### 1. parseDocument - 文档解析

- 从磁盘读取上传的原始文件
- 支持 txt / md（直接读取 UTF-8）和 pdf（使用 `pdf-parse`）
- 输出 `parsed.json` 中间产物，包含提取的纯文本

### 2. splitChunks - 文本切块

- 按固定窗口 + 重叠策略将纯文本切分为多个 chunk
- 窗口大小由 `CHUNK_SIZE`（默认 1000 字符）控制
- 重叠大小由 `CHUNK_OVERLAP`（默认 200 字符）控制
- 输出 `chunks.json`，包含每个 chunk 的内容、索引、token 数

### 3. embedChunks - 向量生成

- 调用 OpenAI 兼容 Embedding API 批量生成向量
- 批次大小由 `EMBEDDING_BATCH_SIZE`（默认 20）控制
- 校验返回向量维度与 `EMBEDDING_DIMENSION` 一致
- 输出 `embeddings.json`，包含每个 chunk 的向量

### 4. upsertVectors - 双写入库

- 先清理该文档的旧数据（Qdrant 删除旧 point + PG 删除旧 chunk）
- 事务写入 PostgreSQL：`document_chunks` 表 + 更新 `documents.chunk_count`
- 写入 Qdrant：以 `documentId:chunkIndex` 为 point ID

### 5. markComplete - 标记完成

- 回写 `ingestion_tasks.status = completed`
- 回写 `documents.status = completed`
- 清理中间产物文件

## 关键设计

- **中间产物落盘**: 大文本和向量数组不通过 Redis 传递，而是写入 `uploads/.artifacts/<taskId>/` 目录，避免 Redis 内存压力
- **失败回写**: 任一步骤失败，自动将 `ingestion_tasks` 和 `documents` 状态回写为 `failed`，并记录错误信息
- **Qdrant 兼容性检查**: 启动时和 upsert 前都会校验集合是否存在、维度是否匹配
- **Embedding 网关警告**: 启动时检测是否使用官方 OpenAI 域名，提示地区访问风险
- **并发控制**: 触发队列并发 5，其余步骤各并发 2

## 依赖

- `bullmq` + `ioredis` -- 任务队列
- `@prisma/client` -- ORM
- `openai` -- OpenAI 兼容 SDK（Embedding）
- `@qdrant/js-client-rest` -- Qdrant 客户端
- `pdf-parse` -- PDF 解析
