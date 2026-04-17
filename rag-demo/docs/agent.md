# Agent 模块 - 检索问答服务层

## 概述

`backend/src/agent/` 实现了 RAG 问答链路的核心逻辑：接收用户问题，经过查询改写、向量检索、重排序、Prompt 组装、LLM 调用、答案格式化六个步骤，返回带引用来源的自然语言回答。

> **关于目录位置**：学习阶段将 Agent 合并在 `backend/src/agent/` 内，与后端共享 Prisma Client 和环境配置，减少跨包通信复杂度。后续可将此目录抽离为独立包（参见「扩展点指引」）。

## 调用链路

```
chatService.askQuestion
  └── agent/service.ts: runChat(input)
        ├── queryRewriter.ts:  rewriteQuery(question)       → string
        ├── retriever.ts:      retrieveContexts({q, topK})  → RetrievedContext[]
        ├── reranker.ts:       rerankContexts(q, contexts)  → RetrievedContext[]
        ├── promptBuilder.ts:  buildPrompt(q, contexts)     → PromptPayload
        ├── llmClient.ts:      generateAnswer(payload)      → LlmCompletion
        └── answerFormatter.ts: formatAgentAnswer(...)      → AgentAnswer
```

## 模块一览

### service.ts — 统一入口

**实现状态：真实**

对 `chatService` 只暴露 `runChat(input: AgentChatInput): Promise<AgentAnswer>`，内部串联六步链路。`topK` 默认为 5，可通过 `AgentChatInput.topK` 覆盖。

```typescript
export async function runChat(input: AgentChatInput): Promise<AgentAnswer>
```

---

### queryRewriter.ts — 查询改写

**实现状态：占位（直通）**

接收原始问题，当前直接返回 `question.trim()`。接口稳定，后续可替换为 LLM 改写（多轮消歧、复合问题拆分、上下文补全）而不影响调用方。

```typescript
export async function rewriteQuery(question: string): Promise<string>
```

---

### retriever.ts — 语义检索

**实现状态：真实（Qdrant）**

流程：`question → Embedding API → 向量 → Qdrant TopK → RetrievedContext[]`

1. 调用 `embeddingClient`（`EMBEDDING_API_BASE` / `EMBEDDING_MODEL`）获取问题向量
2. 校验向量维度与 `EMBEDDING_DIMENSION` 一致
3. 调用 `qdrantClient.search(QDRANT_COLLECTION, { vector, limit: topK })`
4. 将 Qdrant payload 映射为 `RetrievedContext`

可观测埋点（`console.info`）：
- 检索前：`questionLen`、`topK`
- 检索后：`hits`、`topScore`

---

### reranker.ts — 重排序

**实现状态：占位（直通）**

当前将 retriever 返回的列表原样透传。接口稳定，后续可接入 Cross-Encoder / BGE Reranker 做精排。

```typescript
export async function rerankContexts(
  question: string,
  contexts: RetrievedContext[],
): Promise<RetrievedContext[]>
```

---

### promptBuilder.ts — Prompt 组装

**实现状态：真实（含字符裁剪）**

- system prompt：中文知识库助手角色 + 指令（基于资料回答、缺料说明、角标引用）
- user prompt：`参考资料：[1]…[n]\n\n用户问题：xxx`
- 字符兜底：`MAX_PROMPT_CHARS = 12000`，从后往前丢弃低分 context，保留召回靠前的片段
- 返回 `PromptPayload.contexts` 为实际纳入 Prompt 的片段列表（可能少于原始 topK）

---

### llmClient.ts — LLM 调用

**实现状态：真实（OpenAI 兼容接口）**

通过 `llmClient`（`LLM_API_BASE` / `LLM_MODEL`）发起 `chat.completions.create`，参数固定为 `temperature=0.2, max_tokens=1024`。

可观测埋点（`console.info`）：
- 请求前：`model`、`contextsCount`、`promptCharLen`
- 请求后：`model`（来自响应）、`latencyMs`、`usage`（promptTokens / completionTokens / totalTokens）

---

### answerFormatter.ts — 答案格式化

**实现状态：真实**

将 `LlmCompletion` 和 `RetrievedContext[]` 整理为 `AgentAnswer`：

- `answer`：LLM 返回的原始文本
- `references`：按 context 顺序生成，每项含 `documentId / documentName / chunkIndex / content / score`
- `meta`：见下方「响应结构」

## 响应结构

`runChat` 返回 `AgentAnswer`，`chatService` 将其持久化后透传给接口响应：

```typescript
interface AgentAnswer {
  answer: string;
  references: Reference[];
  meta: {
    model: string;          // 实际使用的模型（来自 LLM 响应）
    retrievedCount: number; // promptBuilder 裁剪后实际纳入 Prompt 的片段数
    topK: number;           // 检索阶段的 topK 参数
    finishReason?: string;  // LLM finish_reason（"stop" / "length" 等）
    usage?: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    };
  };
}
```

接口响应的 `referencesJson` 字段为 `Reference[]` 序列化后的 JSON 字符串，存入 `chat_messages.references_json`。

## 扩展点指引

### 替换 reranker

在 `reranker.ts` 中将直通逻辑替换为 Cross-Encoder 调用：

```typescript
// 示例：调用本地 reranker 服务
const scored = await fetch('http://reranker:8080/rerank', {
  method: 'POST',
  body: JSON.stringify({ query: question, passages: contexts.map(c => c.content) }),
});
```

`rerankContexts` 接口签名不变，service.ts 无需改动。

### 多轮记忆（已实现）

多轮记忆已在 `service.ts` 中实现：每次问答前从 `chatRepository.getRecentMessages` 拉取最近 6 条消息，注入 `queryRewriter` 和 `promptBuilder`。详见本文档下方的「多轮记忆（Multi-turn Memory）」一节。

### 抽成独立包

将 `backend/src/agent/` 复制到 `packages/agent/`，在 `package.json` 中导出入口：

```json
{ "exports": { ".": "./src/index.ts" } }
```

`backend` 和未来的其它服务通过 `workspace:*` 引用该包即可。需要将 `env`、`embeddingClient`、`qdrantClient` 改为依赖注入参数，解除对 `backend/src/` 内部模块的直接 import。

---

## Stage 接口契约（interfaces.ts）

`backend/src/agent/interfaces.ts` 为每个流水线阶段定义了 TypeScript 函数类型：

| 类型 | 签名摘要 |
|------|---------|
| `QueryRewriteStage` | `(question, chatHistory?) → Promise<string>` |
| `RetrieveStage` | `({ question, topK }) → Promise<RetrievedContext[]>` |
| `RerankStage` | `(question, contexts) → Promise<RetrievedContext[]>` |
| `PromptBuildStage` | `(question, contexts, chatHistory?) → PromptPayload` |
| `LlmCallStage` | `(payload) → Promise<LlmCompletion>` |
| `FormatAnswerStage` | `({ completion, contexts, topK }) → AgentAnswer` |

当前各模块的具体函数已自然满足对应接口。若要替换某一阶段（如接入 Cross-Encoder Reranker），只需提供满足接口签名的新实现并在 `service.ts` 中替换引用，无需改动其余模块。

---

## 多轮记忆（Multi-turn Memory）

### 数据流

```
chatService.askQuestion(sessionId, question)
  └── agent/service.ts: runChat
        ├── chatRepository.getRecentMessages(sessionId, 6)  → ChatHistoryItem[]
        ├── queryRewriter.rewriteQuery(question, chatHistory)  → rewrittenQuestion
        ├── retriever / reranker  (不感知历史)
        ├── promptBuilder.buildPrompt(q, contexts, chatHistory)
        │     └── 在参考资料之后、用户问题之前插入「对话历史：」区块
        └── llmClient / answerFormatter  (不感知历史)
```

### Prompt 结构示例（含历史）

```
参考资料：
[1] 来源：doc.md（片段 2）
这是文档内容...

对话历史：
用户：上一个问题
助手：上一个回答

用户问题：当前问题
```

### ChatHistoryItem 类型

```typescript
interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}
```

### 调整历史轮数

在 `service.ts` 中修改 `HISTORY_TURNS` 常量（默认 3 轮 = 6 条消息）。

### 接入真实 Query Rewrite

当前 `rewriteQuery` 是直通占位。替换步骤：

```typescript
// queryRewriter.ts
export async function rewriteQuery(
  question: string,
  chatHistory?: ChatHistoryItem[],
): Promise<string> {
  if (!chatHistory || chatHistory.length === 0) return question.trim();

  const historyText = chatHistory
    .map((m) => `${m.role === 'user' ? '用户' : '助手'}：${m.content}`)
    .join('\n');

  const response = await llmClient.chat.completions.create({
    model: env.LLM_MODEL,
    messages: [
      {
        role: 'system',
        content: '根据对话历史，将用户的最新问题改写为独立完整的问题，便于向量检索。只输出改写后的问题，不要解释。',
      },
      { role: 'user', content: `对话历史：\n${historyText}\n\n当前问题：${question}` },
    ],
    temperature: 0,
    max_tokens: 200,
  });

  return response.choices[0]?.message?.content?.trim() ?? question.trim();
}
```
