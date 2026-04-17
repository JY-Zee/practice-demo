# Ingestion Pipeline - 文档摄取流水线

## 概述

文档摄取是系统的核心数据处理链路。从用户上传文件开始，经过 5 步自动化处理，最终将文档的语义向量写入 Qdrant，使其可被语义检索。

## 完整数据流

```
用户上传文件 (POST /api/documents/upload)
  │
  ├─ 1. Backend: 文件存入磁盘 (uploads/)
  ├─ 2. Backend: 写入 documents 表 (status=pending)
  ├─ 3. Backend: 创建 ingestion_tasks 记录
  ├─ 4. Backend: BullMQ 投递到 document-ingestion 队列
  │
  └─ Worker 接收任务
       │
       ├─ triggerWorker: 用 FlowProducer 创建 5 步依赖链
       │
       ├─ Step 1: parseDocument
       │   读取文件 → 提取纯文本 → 写入 parsed.json
       │
       ├─ Step 2: splitChunks
       │   纯文本 → 按窗口+重叠切块 → 写入 chunks.json
       │
       ├─ Step 3: embedChunks
       │   切块文本 → 批量调用 Embedding API → 写入 embeddings.json
       │
       ├─ Step 4: upsertVectors
       │   清理旧数据 → PG 事务写入 document_chunks → Qdrant upsert
       │
       └─ Step 5: markComplete
           回写 status=completed → 清理中间产物
```

## BullMQ 队列设计

| 队列名 | Worker | 并发 | 职责 |
|--------|--------|------|------|
| document-ingestion | triggerWorker | 5 | 接收 Backend 投递，创建 Flow |
| ingestion-parse | parseWorker | 2 | 文档解析 |
| ingestion-split | splitWorker | 2 | 文本切块 |
| ingestion-embed | embedWorker | 2 | 向量生成 |
| ingestion-upsert | upsertWorker | 2 | 双写入库 |
| ingestion-complete | completeWorker | 2 | 标记完成 |

所有队列共享 `rag-kb` 前缀（可通过 `INGESTION_QUEUE_PREFIX` 配置）。

## 中间产物

存储路径：`uploads/.artifacts/<taskId>/`

| 文件 | 生产者 | 消费者 | 内容 |
|------|--------|--------|------|
| parsed.json | parseDocument | splitChunks | 纯文本 + 文档元数据 |
| chunks.json | splitChunks | embedChunks | 切块数组（内容、索引、token 数） |
| embeddings.json | embedChunks | upsertVectors | 切块 + 向量数组 |

中间产物在 markComplete 步骤清理，避免磁盘膨胀。

## 切块策略

- **固定窗口 + 重叠**: 按字符数切分，相邻 chunk 有重叠区域
- `CHUNK_SIZE=1000` -- 单个切块窗口大小（字符）
- `CHUNK_OVERLAP=200` -- 重叠字符数
- 重叠保证了上下文不会在边界处丢失

## 向量化

- 使用 OpenAI 兼容接口，批量调用
- `EMBEDDING_BATCH_SIZE=20` 控制每次请求的 chunk 数
- 返回向量维度校验与 `EMBEDDING_DIMENSION` 一致
- Qdrant point ID 格式：`{documentId}:{chunkIndex}`

## 错误处理

- 每个 Worker 监听 `failed` 事件
- 失败时自动调用 `markFailed()` 回写 `ingestion_tasks` 和 `documents` 状态为 `failed`
- 错误信息记录到 `ingestion_tasks.error_message`

## 幂等性

- upsertVectors 步骤先删除该文档的旧 chunk 和旧 Qdrant point，再重新写入
- 支持对同一文档重新触发摄取（覆盖式更新）
