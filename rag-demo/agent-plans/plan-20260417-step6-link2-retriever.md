# 步骤 6 · 链路 2 设计：Retriever 接入 Qdrant

> 关联主计划：[plan-20260324-rag-learning-architecture.md](./plan-20260324-rag-learning-architecture.md)
> 所属步骤：步骤 6「完成检索问答链路」
> 本次链路：链路 2 · Retriever 接入 Qdrant
> 创建日期：2026-04-17

## 背景

链路 1 已完成 Agent 骨架与后端接线，但 `retriever.ts` 当前是占位实现（返回 1 条固定 mock 上下文）。本链路把 retriever 替换为真实实现：

```
question
  → Embedding (OpenAI 兼容网关)
  → Qdrant.search(TopK)
  → 映射为 RetrievedContext[]
```

完成后，`/api/chat/ask` 的 `referencesJson` 将来自真实已入库文档，而不是 mock。

## 依赖与约束

| 项 | 说明 |
| --- | --- |
| Qdrant 集合 | `env.QDRANT_COLLECTION`（默认 `kb_documents`），匿名单向量，Cosine，维度 `env.EMBEDDING_DIMENSION` |
| Qdrant point payload 字段 | `document_id / file_name / chunk_id / chunk_index / text / token_count`（由 worker 的 `buildQdrantChunkPayload` 写入） |
| Embedding API | 走 `EMBEDDING_API_BASE`（OpenAI 兼容网关），模型 `EMBEDDING_MODEL`，维度 `EMBEDDING_DIMENSION` |
| 默认 TopK | `5`（和主计划保持一致） |
| 版本对齐 | 复用 worker 已有版本：`openai@^6.33.0`、`@qdrant/js-client-rest@^1.17.0`，避免同仓库多版本共存 |

## 新增/修改文件清单

### 新增

- `backend/src/lib/openai.ts` — OpenAI 兼容客户端单例（仅用于 embedding 调用，读 `EMBEDDING_API_KEY` / `EMBEDDING_API_BASE`）
- `backend/src/lib/qdrant.ts` — Qdrant REST 客户端单例（读 `QDRANT_HOST` / `QDRANT_HTTP_PORT`）

### 修改

- `backend/package.json` — 新增两个运行时依赖
- `backend/src/agent/retriever.ts` — 完整重写为真实实现

### 不改动

- `backend/src/agent/service.ts`（内部编排不变）
- `backend/src/agent/promptBuilder.ts`（真实上下文已可直接喂入）
- `backend/src/agent/answerFormatter.ts`（`clampScore` 仍然负责把 Qdrant Cosine 的 `[-1, 1]` 夹取到 `[0, 1]`）
- `backend/src/agent/llmClient.ts`（继续占位，留给链路 3）
- `backend/src/services/chatService.ts`（接口契约不变）

## 关键决策

1. **Agent 层不直接复用 worker 模块**
   Agent 子模块目前在 `backend/src/agent/`，为了避免 backend 跨目录引用 `worker/src/lib/*`（会破坏容器构建边界），backend 独立建自己的 `lib/openai.ts`、`lib/qdrant.ts`。未来若要共享，抽到 `packages/shared/` 再统一替换。

2. **维度校验前置**
   `embedQuery` 返回向量后，立即断言长度等于 `env.EMBEDDING_DIMENSION`，不匹配抛错并提示检查 `.env`。避免进入 Qdrant 后被服务端报维度错再层层冒泡。

3. **`RetrievedContext.chunkId` 存 Qdrant pointId**
   Worker 写入时 `chunk_id = pointId = crypto.randomUUID()`，与 PostgreSQL `document_chunks.id` 不同源。Agent 层只关心检索溯源，不依赖 SQL 侧的 chunk id，所以 `chunkId` 直接保存 pointId 即可。

4. **空召回不抛错**
   Qdrant 返回空数组时，retriever 返回 `[]`，由 `promptBuilder` 走「当前没有检索到相关资料」分支。这样更贴近实际用户场景（知识库里没有对应材料）。

5. **得分规整沿用链路 1 的 `clampScore`**
   Cosine 相似度可能为负（语义完全无关），或略大于 1（浮点误差）。链路 1 的 `answerFormatter.clampScore` 已做夹取，retriever 本身不做规整，保持原始分数透传到 `RetrievedContext.score`，便于 debug。

## 异常矩阵

| 异常 | 处理 |
| --- | --- |
| Embedding API 报错（401 / 403 / 5xx） | 抛错，由 `errorHandler` 返回 500，消息里带上 `apiBase + model` |
| Embedding 返回维度不匹配 | 抛错，提示检查 `EMBEDDING_DIMENSION` / 模型输出 / Qdrant 集合 |
| Qdrant 报错 | 抛错，消息里带 `action=query + collection` |
| 空召回 | 返回 `[]`，prompt 里走「无资料」分支 |
| Qdrant 集合不存在 | 抛错（复用已有提示：「请先运行 scripts/init_qdrant.py」）— 考虑到 worker 启动时已做 `ensureQdrantCollectionCompatibility`，backend 侧暂不主动校验以避免冷启动阻塞，只在 search 失败时感知并报错 |

## 实施步骤

```
1. package.json 加依赖 → pnpm install
2. 写 backend/src/lib/openai.ts
3. 写 backend/src/lib/qdrant.ts
4. 重写 backend/src/agent/retriever.ts
5. pnpm exec tsc --noEmit（类型检查）
6. docker compose up -d --build backend
```

## 验证方案

### 前置

- Docker 基础设施在跑（`kb_postgres / kb_redis / kb_qdrant / kb_worker`）
- `.env` 已配置真实的 `EMBEDDING_*` 与 `LLM_*`

### 端到端流程

```bash
# 1. 上传一个真实文档（项目自身的 README 即可）
curl -X POST http://localhost:8000/api/documents/upload \
  -F "file=@README.md"

# 2. 等 worker 摄取完成（status=completed）
docker logs -f kb_worker

# 3. 用和文档内容相关的问题做检索
curl -X POST http://localhost:8000/api/chat/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"这个项目的技术选型是什么？"}'
```

### 验收标准

- `referencesJson` 至少 1 条，且：
  - `documentId` 是真实上传文档的 UUID（**不是** `00000000-…`）
  - `documentName` 是真实文件名（**不是** `mock-document.md`）
  - `content` 是真实切块内容
  - `score ∈ [0, 1]`
- `meta.retrievedCount` 与 `referencesJson.length` 一致
- 同一 `sessionId` 下 `GET /api/chat/messages` 能查到用户消息 + 助手消息
- LLM 回答部分仍是占位文本（因为链路 3 还没做），但「资料条数」应等于真实召回数

### 负向测试

```bash
# 完全无关的问题，验证 retriever 仍能跑通（可能召回低分片段）
curl -X POST http://localhost:8000/api/chat/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"今天北京天气怎么样？"}'
```

期望：不报错，`referencesJson` 可以有也可以无；有的话分数应明显偏低。

## 出口条件（进入链路 3 的前提）

- `pnpm exec tsc --noEmit` 无错
- 上传 → 摄取 → 问答 端到端跑通，返回真实 chunk 引用
- 链路 3 可以直接在 `llmClient.ts` 上替换为真实 LLM 调用，不需要再动 retriever / service
