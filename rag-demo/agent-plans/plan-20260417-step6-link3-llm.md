# 步骤 6 · 链路 3 设计：PromptBuilder + LLMClient + AnswerFormatter

> 关联主计划：[plan-20260324-rag-learning-architecture.md](./plan-20260324-rag-learning-architecture.md)
> 前置链路：[链路 2 · Retriever 接入 Qdrant](./plan-20260417-step6-link2-retriever.md)
> 所属步骤：步骤 6「完成检索问答链路」
> 本次链路：链路 3 · 真实 LLM 问答
> 创建日期：2026-04-17

## 背景

到链路 2 结束时：

- `retriever.ts` 已接入 Qdrant，能返回真实 `RetrievedContext[]`
- `promptBuilder.ts`、`answerFormatter.ts` 链路 1 已经是正式实现
- `llmClient.ts` 仍然是占位，返回固定 mock 文本

本链路的目标：**把 `llmClient.ts` 接通真实 LLM**，让 `/api/chat/ask` 返回基于文档检索的真实回答；同时给 `promptBuilder` 补一点点上下文长度兜底，避免超长 chunk 把请求打爆。

## 依赖与约束

| 项 | 说明 |
| --- | --- |
| LLM 接入方式 | OpenAI 兼容接口，走 `env.LLM_API_BASE`（默认 OpenRouter） |
| 模型 | `env.LLM_MODEL`（默认 `gpt-4o-mini`） |
| SDK | 复用 `openai@^6.33.0`（链路 2 已加入依赖） |
| 客户端拆分 | Embedding 与 LLM 使用**不同的 `baseURL` / `apiKey`**，必须是两个独立 client 实例 |
| 温度 / 长度 | 第一版固定：`temperature = 0.2`、`max_tokens = 1024` |
| 超时 | OpenAI SDK 默认 10 分钟，本版设为 `60_000ms`（1 分钟）显式覆盖 |
| Prompt 上下文上限 | 保守按 **字符** 而非 token 控制：拼接后的 user 消息超过 `12000` 字符时，从末尾 context 开始丢弃（学习阶段简化，不引入 tokenizer） |

## 新增/修改文件清单

### 修改

- `backend/src/lib/openai.ts`
  - 原本只导出 embedding client（链路 2 新建）
  - 本次拆分为两个导出：`embeddingClient`、`llmClient`，各自使用不同的 base/key
  - 命名区分，避免上层误用
- `backend/src/agent/llmClient.ts`
  - 完整重写：用 `llmClient.chat.completions.create(...)` 替换 mock
  - 组装 `messages = [{role:'system',...},{role:'user',...}]`
  - 返回 `LlmCompletion`：`content / model / finishReason / usage`
  - 异常：带上 `apiBase + model` 二次包装
- `backend/src/agent/promptBuilder.ts`
  - 增补「字符长度兜底」：在拼接 user 消息前，按 `MAX_PROMPT_CHARS` 动态裁剪 context
  - 裁剪时保留靠前的（分数更高）context，丢弃末尾
  - 在 system 中不做改动
- `backend/src/agent/types.ts`
  - `LlmCompletion.usage` 字段在链路 1 已有，本次确认 SDK 返回字段命名（可能是 `prompt_tokens` snake_case，需要在 llmClient 里做 map）

### 不改动

- `retriever.ts`（链路 2 完成后本轮不碰）
- `service.ts`（编排顺序不变）
- `answerFormatter.ts`（已做 `clampScore`，LLM 侧新增的 `usage` 原样透传）
- `chatService.ts`（接口契约不变）

## 关键决策

1. **embedding client 与 llm client 必须拆**
   `EMBEDDING_API_BASE` 与 `LLM_API_BASE` 在 `.env` 可能指向不同网关（embedding 用 SiliconFlow、LLM 用 OpenRouter 等），不能共享 `baseURL`；且 `EMBEDDING_API_KEY` 与 `LLM_API_KEY` 也是独立校验项。所以 `lib/openai.ts` 暴露两个实例。

2. **固定低温度 + 小输出**
   学习阶段优先让回答稳定、成本可控，温度调高留给后续迭代。max_tokens 1024 足够覆盖多数 RAG 场景，超了再通过 env 调。

3. **上下文裁剪按字符而非 token**
   引入 tokenizer 会多一层依赖和模型对齐成本，学习阶段用字符长度做保守兜底即可；真实生产再替换 `tiktoken` / 模型原生 tokenizer。

4. **SDK 异常不直接抛原始 message**
   OpenAI SDK 的错误有时是 `APIError` 或底层 `fetch` 错误，上层拿到会一头雾水。llmClient 里统一包成 `Error('LLM 调用失败：<原因>')`，并附上 `LLM_API_BASE` 与模型名。

5. **usage 字段字段名映射**
   OpenAI 兼容响应的 usage 是 `prompt_tokens / completion_tokens / total_tokens` (snake_case)，`LlmCompletion.usage` 类型是 camelCase，需要在 llmClient 内做一次显式映射，避免 `answerFormatter.meta.usage` 透传出来的是 undefined。

## 异常矩阵

| 异常 | 处理 |
| --- | --- |
| LLM 4xx（鉴权 / 模型不存在 / 参数错） | 抛 `Error('LLM 调用失败（HTTP 4xx）：...')`，带上 apiBase + model |
| LLM 5xx / 网络超时 | 同上，附 status |
| 空召回（retriever 返回 `[]`） | **不跳过 LLM 调用**，仍按 prompt「当前没有检索到相关资料」发请求，LLM 自行说明 |
| LLM 返回空 content | 抛错，说明「LLM 返回空响应，请检查网关与模型配置」 |
| Prompt 过长（> MAX_PROMPT_CHARS） | 静默裁剪 context，记录调试日志 `context trimmed from N to M`（前期用 `console.warn` 即可） |
| finishReason === 'length' | 不抛错，透传到 `meta.finishReason`，让调用方感知「答案被截断」 |

## 实施步骤

```
1. 改 backend/src/lib/openai.ts（拆分成 embedding + llm 两个 client）
2. 重写 backend/src/agent/llmClient.ts（chat.completions.create）
3. 给 backend/src/agent/promptBuilder.ts 加字符长度兜底
4. pnpm exec tsc --noEmit
5. docker compose up -d --build backend
```

## 验证方案

### 前置

- 链路 2 已完成，retriever 能召回真实 chunk
- `.env.LLM_*` 是真实可用的配置（本仓库用 OpenRouter）
- 已经有至少 1 篇文档入库完成

### 端到端流程

```bash
# 1. 问一个与文档内容强相关的问题
curl -X POST http://localhost:8000/api/chat/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"这个项目用什么数据库做向量检索？"}'
```

### 验收标准

- `content` 是 **自然语言回答**，不再是占位文本；应提到 Qdrant 等文档内真实出现的技术名
- `content` 末尾带 `[1] [2]` 这类引用角标（与 system prompt 约定一致）
- `meta.model` 与 `env.LLM_MODEL` 一致
- `meta.finishReason` 通常为 `stop`
- `meta.usage` 三个字段均为 number（`promptTokens / completionTokens / totalTokens`）
- `referencesJson` 仍然是链路 2 的真实 chunk（链路 3 不动 retriever）

### 负向测试

```bash
# 1. 完全无相关资料的问题：期望 LLM 按 system 约定「说明缺少信息」
curl -X POST http://localhost:8000/api/chat/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"今天上证指数收盘多少点？"}'

# 2. 超长问题（触发裁剪逻辑）：
curl -X POST http://localhost:8000/api/chat/ask \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{"question":"请基于文档回答……（重复 2000 字）"}
EOF
```

期望：

- 无相关资料：回答内明确说「当前资料不足」之类，不胡编
- 超长输入：不报错，后端日志出现 `context trimmed from ...`，回答仍正常

## 出口条件（进入链路 4 的前提）

- 真实 LLM 调用成功，`meta.usage` 有效
- 负向用例不抛 500
- Prompt 裁剪机制在超长 context 时有效（可以通过人为放大 retriever topK 或 context 来验证）
- 链路 3 之后，`/api/chat/ask` 的响应结构已经是最终形态，链路 4 只做端到端打磨与文档同步，不再改 Agent 内部实现
