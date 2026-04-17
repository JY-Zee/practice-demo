# 步骤 6 · 链路 4 设计：端到端验证 + 文档同步

> 关联主计划：[plan-20260324-rag-learning-architecture.md](./plan-20260324-rag-learning-architecture.md)
> 前置链路：
> - [链路 2 · Retriever 接入 Qdrant](./plan-20260417-step6-link2-retriever.md)
> - [链路 3 · 真实 LLM 问答](./plan-20260417-step6-link3-llm.md)
> 所属步骤：步骤 6「完成检索问答链路」
> 本次链路：链路 4 · 端到端打磨与文档同步
> 创建日期：2026-04-17

## 背景

到链路 3 结束时，`/api/chat/ask` 的核心链路已经跑通：

```
POST /api/chat/ask
  → chatService.askQuestion
      → createMessage(user)
      → agent.runChat
          → queryRewriter (占位)
          → retriever (真 · Qdrant)
          → reranker (占位)
          → promptBuilder (真 · 含裁剪)
          → llmClient (真 · OpenAI 兼容)
          → answerFormatter (真)
      → createMessage(assistant + references)
  ← {id, sessionId, content, referencesJson, meta}
```

但还差三块：

1. **端到端稳定性验收**：真实上传 → 摄取 → 问答 → 回看历史 → 负向用例，形成一份可复现的验证 checklist
2. **文档同步**：主计划中 `agent/` 被调整到了 `backend/src/agent/` 子目录，PROJECT.md、README.md、docs/ 都需要同步
3. **可观测性最低位**：retriever / llm 的关键节点加一次 `console.info` 输出（便于日后排障），这是步骤 9 的预热而非完整实现

## 本链路不扩展的范围

- 不做前端（属于步骤 8）
- 不做完整日志框架（属于步骤 9）
- 不做脚本（属于步骤 10）
- 不做 README 重写（属于步骤 11）

本链路只做「让步骤 6 真正交付」所必需的文档和观测点，其它留给对应步骤。

## 新增/修改文件清单

### 修改

- `PROJECT.md`
  - 「当前进度」的 Layer 5 勾选（保留 Layer 6 不勾选）
  - 「模块索引」的 Agent 行：路径由 `agent/ (待实现)` 改为 `backend/src/agent/`，指向新建文档
  - 「核心数据流」的问答段落：把「当前 mock」改为真实描述
- `README.md`
  - 「搭建进度」Step 5 勾选
  - 「目录结构」中 `agent/` 位置调整说明
  - 「核心功能」第 4、5 条补充一句「已接通 Qdrant + LLM」
  - 加 Step 5 详解小节（参照现有 Step 2/3/4 详解风格）
- `plan-20260324-rag-learning-architecture.md`
  - 前言 todos 中新增 `step6-retrieval-qa` 一项并标为 completed（保留原 todos 结构）
  - 「建议实施顺序」中 M3 标记已完成
- `docs/backend.md`
  - 「目录结构」中新增 `agent/` 子目录说明
  - 「API 端点」的 `POST /api/chat/ask` 去掉「当前 mock，待接入 Agent」说明
  - 新增一段「Agent 子模块」小节，链接到新建的 `docs/agent.md`

### 新增

- `docs/agent.md`
  - 描述 Agent 分层（queryRewriter / retriever / reranker / promptBuilder / llmClient / answerFormatter / service）
  - 每个模块当前实现状态（占位 / 真实）
  - 扩展点指引（如何替换 reranker、如何接入多轮记忆、如何抽成独立包）
  - 响应结构与 `meta` 字段说明

### 可观测性改动（文件最小化）

- `backend/src/agent/retriever.ts`：在 Qdrant search 前后加 `console.info`，字段：`question 长度`、`topK`、`hits 数`、`topScore`
- `backend/src/agent/llmClient.ts`：在请求前后加 `console.info`，字段：`model`、`contextsCount`、`promptCharLen`、`usage`、`latencyMs`
- 不引入 winston / pino，保持 console.info，与现有 backend 风格一致

## 关键决策

1. **不把 agent 再挪回独立包**
   保持链路 1 决定的 `backend/src/agent/`，并在文档里显式说明「学习阶段合并，未来可抽独立包」。避免来回搬家造成的上下游反复。

2. **只做最小可观测性**
   不引入结构化日志库、不做 OpenTelemetry。步骤 9 才是可观测性的正题，本链路只埋两个关键节点的 console.info，够排障就行。

3. **主计划文件按追加方式更新**
   `plan-20260324-rag-learning-architecture.md` 是历史计划存档，不大改结构，只在「前言 todos」和「建议实施顺序」两处追加里程碑状态，保留原始设计全貌。

4. **`docs/agent.md` 独立成章**
   Agent 是本次步骤 6 的主要产出，单独一份 doc 便于后续扩展；`docs/backend.md` 只在末尾链接到这份独立文档，避免 backend.md 膨胀。

## 实施步骤

```
1. 给 retriever.ts / llmClient.ts 加 console.info 埋点
2. 写 docs/agent.md
3. 改 docs/backend.md
4. 改 PROJECT.md
5. 改 README.md（搭建进度 + 目录结构 + Step 5 详解）
6. 改 plan-20260324-rag-learning-architecture.md（里程碑状态）
7. pnpm exec tsc --noEmit
8. docker compose up -d --build backend（因为改了 TS 源码）
9. 执行下方验证 checklist，记录结果
```

## 验证 checklist（端到端）

### 基础设施

```bash
docker ps | grep -E "kb_(postgres|redis|qdrant|backend|worker)"
```

期望：5 个容器都是 `Up` 且 `healthy`。

### 文档摄取

```bash
# 上传一个真实文档
curl -sS -X POST http://localhost:8000/api/documents/upload \
  -F "file=@README.md" | tee /tmp/upload.json

# 提取 documentId，轮询任务完成
DOC_ID=$(python3 -c "import json;print(json.load(open('/tmp/upload.json'))['id'])")
curl -sS "http://localhost:8000/api/documents/$DOC_ID" | python3 -m json.tool
```

期望：

- 上传立即返回，status 初始为 `pending` / `processing`
- Worker 日志跑完 5 步
- 文档最终状态 `completed`
- `chunkCount > 0`

### 正向问答

```bash
curl -sS -X POST http://localhost:8000/api/chat/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"这个项目用什么做向量检索？"}' | python3 -m json.tool
```

期望：

- `content` 是自然语言回答，含 Qdrant 这类真实名词
- `content` 末尾有 `[1] [2]` 这类角标
- `referencesJson` 所有项目 `documentId` 非全零
- `meta.model` === `env.LLM_MODEL`
- `meta.retrievedCount` ∈ `[1, 5]`
- `meta.usage.totalTokens > 0`

### 会话历史

```bash
SESSION=$(curl -sS -X POST http://localhost:8000/api/chat/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"再用一句话总结。"}' | python3 -c "import json,sys;print(json.load(sys.stdin)['sessionId'])")

curl -sS "http://localhost:8000/api/chat/messages?sessionId=$SESSION" | python3 -m json.tool
```

期望：`items` 包含至少 2 条（user + assistant），顺序正确。

### 负向用例

```bash
# 与知识库无关的问题
curl -sS -X POST http://localhost:8000/api/chat/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"珠穆朗玛峰海拔多少？"}' | python3 -m json.tool

# 空 question 请求（Zod 校验）
curl -sS -X POST http://localhost:8000/api/chat/ask \
  -H "Content-Type: application/json" \
  -d '{"question":""}' -o - -w "\nHTTP: %{http_code}\n"
```

期望：

- 无关问题：接口 200，`content` 说明资料不足、不编造
- 空 question：接口 400，错误消息来自 Zod

### 错误观测

```bash
docker logs kb_backend --tail 80
```

期望：能看到 retriever / llmClient 的 `info` 埋点，字段有 `question 长度 / topK / hits / model / latencyMs / usage`。

## 验收与交付

本链路完成时，步骤 6 可以视为交付：

- [ ] 真实文档上传 → 摄取 → 问答 → 引用溯源，全链路 200
- [ ] 负向用例覆盖：空问题 / 无资料问题 / 会话历史
- [ ] Agent 内部所有模块：retriever / promptBuilder / llmClient / answerFormatter 为**真实实现**；queryRewriter / reranker 为**占位但接口稳定**
- [ ] PROJECT.md / README.md / docs/backend.md / docs/agent.md 与代码状态一致
- [ ] 主计划里程碑 M3 标记完成
- [ ] `pnpm exec tsc --noEmit` 通过

## 后续链路（不在本次范围）

- 步骤 7：Agent 可扩展接口抽象（形式化 `IRetriever / IReranker / ILLMClient`）
- 步骤 8：前端三页（上传 / 列表 / 问答）
- 步骤 9：可观测性（请求/任务/错误/召回记录的结构化日志）
- 步骤 10：一键脚本（dev_start / dev_reset / init_db / init_qdrant）
- 步骤 11：README 最终版
- 步骤 12：本次计划归档（已完成一部分，链路 2/3/4 的 plan 已经在根目录）
