# Agent 最小可扩展接口 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Agent 层补齐正式的 TypeScript Stage 接口契约，并实现多轮记忆（session history 注入），使 QueryRewrite / Rerank / Tool Use / LangGraph 等后续扩展可在不改动主链路的前提下插拔替换。

**Architecture:** 不引入额外框架，直接在现有 `backend/src/agent/` 六个函数模块上补齐 TypeScript `interface` 契约（`interfaces.ts`），将 `ChatHistoryItem` 类型加入 `types.ts`，更新 `queryRewriter` / `promptBuilder` / `service` 三个模块以透传历史，并修复 `service.ts` 中 `formatAgentAnswer` 误用原始 contexts（而非 `prompt.contexts`）的 bug。

**Tech Stack:** TypeScript 5, Koa 2, Prisma 6, Node.js 内置测试运行器（`node:test`），tsx

---

## 文件变更一览

| 操作 | 文件 | 职责 |
|------|------|------|
| Create | `backend/src/agent/interfaces.ts` | 六个 Stage 的 TypeScript 函数接口契约 |
| Create | `backend/src/agent/__tests__/answerFormatter.test.ts` | answerFormatter 单元测试 |
| Create | `backend/src/agent/__tests__/queryRewriter.test.ts` | queryRewriter 单元测试 |
| Create | `backend/src/agent/__tests__/promptBuilder.test.ts` | promptBuilder 单元测试（含历史） |
| Modify | `backend/src/agent/types.ts` | 新增 `ChatHistoryItem`；更新 `AgentChatInput`、`PromptPayload` |
| Modify | `backend/src/agent/queryRewriter.ts` | 签名加 `chatHistory?` 参数 |
| Modify | `backend/src/agent/promptBuilder.ts` | 支持 `chatHistory`；修复 trimContexts 开销计算 |
| Modify | `backend/src/agent/service.ts` | 从 chatRepository 拉取历史；透传 chatHistory；修复 contexts bug |
| Modify | `backend/src/repositories/chatRepository.ts` | 新增 `getRecentMessages()` |
| Modify | `backend/package.json` | 新增 `"test"` 脚本 |
| Modify | `docs/agent.md` | 补充 Stage 接口、多轮记忆使用说明 |

---

## Task 1: 配置 backend 测试脚本

**Files:**
- Modify: `backend/package.json`

- [ ] **Step 1: 在 scripts 中增加 test 命令**

打开 `backend/package.json`，在 `"scripts"` 块内已有的几行之后追加：

```json
"test": "tsx --test src/**/*.test.ts"
```

完整 scripts 块应为：

```json
"scripts": {
  "dev": "tsx watch src/app.ts",
  "build": "tsc",
  "start": "node dist/app.js",
  "test": "tsx --test src/**/*.test.ts",
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate dev",
  "prisma:studio": "prisma studio"
}
```

- [ ] **Step 2: 验证命令可被识别（当前无测试文件，预期零测试通过即可）**

```bash
cd backend && pnpm test
```

Expected: 命令运行结束，无报错（0 tests / 0 failures 均可）。

- [ ] **Step 3: Commit**

```bash
cd backend && git add package.json && git commit -m "chore(backend): add test script using tsx --test"
```

---

## Task 2: 定义流水线 Stage 接口

**Files:**
- Create: `backend/src/agent/interfaces.ts`

- [ ] **Step 1: 创建 interfaces.ts**

```typescript
/**
 * Agent 流水线 Stage 接口契约
 *
 * 每个接口对应链路中一个可独立替换的实现单元。
 * 当前各模块的具体函数（rewriteQuery / retrieveContexts / ...）
 * 已自然满足对应接口，无需修改调用方。
 * 后续若要接入 LangGraph、Cross-Encoder 等，只需提供新的实现并在 service.ts 中替换引用即可。
 */

import type {
  AgentAnswer,
  ChatHistoryItem,
  LlmCompletion,
  PromptPayload,
  RetrievedContext,
} from './types';

/** 查询改写阶段：原始问题 (+ 可选历史) → 改写后问题 */
export type QueryRewriteStage = (
  question: string,
  chatHistory?: ChatHistoryItem[],
) => Promise<string>;

/** 向量检索阶段：问题 + topK → 候选片段列表 */
export type RetrieveStage = (params: {
  question: string;
  topK: number;
}) => Promise<RetrievedContext[]>;

/** 重排序阶段：问题 + 候选列表 → 精排后列表 */
export type RerankStage = (
  question: string,
  contexts: RetrievedContext[],
) => Promise<RetrievedContext[]>;

/** Prompt 组装阶段：问题 + 上下文 (+ 可选历史) → PromptPayload */
export type PromptBuildStage = (
  question: string,
  contexts: RetrievedContext[],
  chatHistory?: ChatHistoryItem[],
) => PromptPayload;

/** LLM 调用阶段：PromptPayload → LlmCompletion */
export type LlmCallStage = (payload: PromptPayload) => Promise<LlmCompletion>;

/** 答案格式化阶段：completion + contexts + topK → AgentAnswer */
export type FormatAnswerStage = (params: {
  completion: LlmCompletion;
  contexts: RetrievedContext[];
  topK: number;
}) => AgentAnswer;
```

- [ ] **Step 2: Commit**

```bash
cd backend && git add src/agent/interfaces.ts && git commit -m "feat(agent): add pipeline stage type interfaces"
```

---

## Task 3: 扩展类型定义

**Files:**
- Modify: `backend/src/agent/types.ts`

- [ ] **Step 1: 添加 ChatHistoryItem，更新 AgentChatInput 和 PromptPayload**

将 `backend/src/agent/types.ts` 全量替换为：

```typescript
/**
 * Agent 层内部数据结构
 *
 * 说明：Agent 层封装检索 + Prompt + LLM 的问答链路，
 * 这些类型是 Agent 内部各模块（retriever/promptBuilder/llmClient/...）之间的契约。
 * 对 backend Service 层只暴露 `runChat` 及其 I/O 类型。
 */

import type { Reference } from '../schemas/chat';

/** 多轮对话历史单条记录（由 service.ts 从 chatRepository 预填充后注入 Agent 流水线） */
export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

/** Agent 入口入参 */
export interface AgentChatInput {
  question: string;
  sessionId: string;
  topK?: number;
  /**
   * 多轮对话历史，由 service.ts 从 chatRepository 拉取后注入。
   * API 调用方无需传递此字段。
   */
  chatHistory?: ChatHistoryItem[];
}

/** 召回得到的单条文档片段上下文 */
export interface RetrievedContext {
  documentId: string;
  documentName: string;
  chunkId: string;
  chunkIndex: number;
  content: string;
  score: number;
}

/** PromptBuilder 组装后的 LLM 入参 */
export interface PromptPayload {
  system: string;
  user: string;
  contexts: RetrievedContext[];
  /** 实际纳入 Prompt 的对话历史（透传自 AgentChatInput.chatHistory） */
  chatHistory?: ChatHistoryItem[];
}

/** LLM 响应 */
export interface LlmCompletion {
  content: string;
  model: string;
  finishReason?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

/** Agent 返回给后端的最终结果 */
export interface AgentAnswer {
  answer: string;
  references: Reference[];
  meta: {
    model: string;
    retrievedCount: number;
    topK: number;
    finishReason?: string;
    usage?: LlmCompletion['usage'];
  };
}
```

- [ ] **Step 2: Commit**

```bash
cd backend && git add src/agent/types.ts && git commit -m "feat(agent): add ChatHistoryItem type and chatHistory fields"
```

---

## Task 4: answerFormatter 单元测试

**Files:**
- Create: `backend/src/agent/__tests__/answerFormatter.test.ts`

这批测试针对现有实现，无需改动 answerFormatter.ts，预期全部通过。

- [ ] **Step 1: 创建测试文件**

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';

import { formatAgentAnswer } from '../answerFormatter';
import type { LlmCompletion, RetrievedContext } from '../types';

const makeContext = (score: number): RetrievedContext => ({
  documentId: '00000000-0000-0000-0000-000000000001',
  documentName: 'test.md',
  chunkId: 'chunk-1',
  chunkIndex: 0,
  content: 'test chunk content',
  score,
});

const makeCompletion = (): LlmCompletion => ({
  content: 'This is the answer.',
  model: 'gpt-4o-mini',
  finishReason: 'stop',
  usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
});

test('formatAgentAnswer: 正常映射 references 和 meta', () => {
  const result = formatAgentAnswer({
    completion: makeCompletion(),
    contexts: [makeContext(0.85)],
    topK: 5,
  });

  assert.equal(result.answer, 'This is the answer.');
  assert.equal(result.references.length, 1);
  assert.equal(result.references[0].score, 0.85);
  assert.equal(result.references[0].documentName, 'test.md');
  assert.equal(result.references[0].chunkIndex, 0);
  assert.equal(result.meta.topK, 5);
  assert.equal(result.meta.retrievedCount, 1);
  assert.equal(result.meta.model, 'gpt-4o-mini');
  assert.deepEqual(result.meta.usage, {
    promptTokens: 100,
    completionTokens: 50,
    totalTokens: 150,
  });
});

test('formatAgentAnswer: score > 1 被截断为 1', () => {
  const result = formatAgentAnswer({
    completion: makeCompletion(),
    contexts: [makeContext(1.5)],
    topK: 5,
  });
  assert.equal(result.references[0].score, 1);
});

test('formatAgentAnswer: score < 0 被截断为 0', () => {
  const result = formatAgentAnswer({
    completion: makeCompletion(),
    contexts: [makeContext(-0.3)],
    topK: 5,
  });
  assert.equal(result.references[0].score, 0);
});

test('formatAgentAnswer: NaN score 被截断为 0', () => {
  const result = formatAgentAnswer({
    completion: makeCompletion(),
    contexts: [makeContext(NaN)],
    topK: 5,
  });
  assert.equal(result.references[0].score, 0);
});

test('formatAgentAnswer: 无 contexts 时 references 为空数组', () => {
  const result = formatAgentAnswer({
    completion: makeCompletion(),
    contexts: [],
    topK: 5,
  });
  assert.deepEqual(result.references, []);
  assert.equal(result.meta.retrievedCount, 0);
});
```

- [ ] **Step 2: 运行测试，确认全部通过**

```bash
cd backend && pnpm test
```

Expected: 5 tests pass, 0 failures.

- [ ] **Step 3: Commit**

```bash
cd backend && git add src/agent/__tests__/answerFormatter.test.ts && git commit -m "test(agent): add answerFormatter unit tests"
```

---

## Task 5: queryRewriter 测试 + 签名更新

**Files:**
- Create: `backend/src/agent/__tests__/queryRewriter.test.ts`
- Modify: `backend/src/agent/queryRewriter.ts`

- [ ] **Step 1: 写失败测试（history 参数测试）**

创建 `backend/src/agent/__tests__/queryRewriter.test.ts`：

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';

import { rewriteQuery } from '../queryRewriter';
import type { ChatHistoryItem } from '../types';

test('rewriteQuery: 去除首尾空格', async () => {
  const result = await rewriteQuery('  hello world  ');
  assert.equal(result, 'hello world');
});

test('rewriteQuery: 纯空格输入返回空字符串', async () => {
  const result = await rewriteQuery('   ');
  assert.equal(result, '');
});

test('rewriteQuery: 无历史时直通（向后兼容）', async () => {
  const result = await rewriteQuery('some question');
  assert.equal(result, 'some question');
});

test('rewriteQuery: 传入历史时仍直通（占位实现）', async () => {
  const history: ChatHistoryItem[] = [
    { role: 'user', content: 'previous question' },
    { role: 'assistant', content: 'previous answer' },
  ];
  const result = await rewriteQuery('current question', history);
  assert.equal(result, 'current question');
});

test('rewriteQuery: 传入空历史数组时直通', async () => {
  const result = await rewriteQuery('question', []);
  assert.equal(result, 'question');
});
```

- [ ] **Step 2: 运行测试，确认 history 参数的测试报 TS 类型错误（或测试通过但签名未更新）**

```bash
cd backend && pnpm test
```

Expected: 若 queryRewriter 签名缺少 `chatHistory` 参数，TypeScript 编译会警告，或测试因调用方式不匹配而报错。

- [ ] **Step 3: 更新 queryRewriter.ts 签名**

将 `backend/src/agent/queryRewriter.ts` 全量替换为：

```typescript
/**
 * 查询改写
 *
 * 预留位：后续可接入 LLM 做多轮消歧、拆分复合问题、补全上下文。
 * 第一版直接原样返回，保留接口便于后续替换。
 *
 * chatHistory 参数已预留，供后续 LLM 改写实现使用。
 */

import type { ChatHistoryItem } from './types';

export async function rewriteQuery(
  question: string,
  _chatHistory?: ChatHistoryItem[],
): Promise<string> {
  return question.trim();
}
```

- [ ] **Step 4: 运行测试，确认全部通过**

```bash
cd backend && pnpm test
```

Expected: 所有 queryRewriter 测试（5 个）+ answerFormatter 测试（5 个）= 10 tests pass.

- [ ] **Step 5: Commit**

```bash
cd backend && git add src/agent/__tests__/queryRewriter.test.ts src/agent/queryRewriter.ts && git commit -m "feat(agent): add chatHistory param to rewriteQuery; add unit tests"
```

---

## Task 6: promptBuilder 测试 + 多轮历史支持

**Files:**
- Create: `backend/src/agent/__tests__/promptBuilder.test.ts`
- Modify: `backend/src/agent/promptBuilder.ts`

- [ ] **Step 1: 写测试（历史相关测试预期失败）**

创建 `backend/src/agent/__tests__/promptBuilder.test.ts`：

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';

import { buildPrompt } from '../promptBuilder';
import type { ChatHistoryItem, RetrievedContext } from '../types';

const makeContext = (i: number, content = `content of chunk ${i}`): RetrievedContext => ({
  documentId: `00000000-0000-0000-0000-00000000000${i + 1}`,
  documentName: `doc${i}.md`,
  chunkId: `chunk-${i}`,
  chunkIndex: i,
  content,
  score: 0.9 - i * 0.05,
});

// ── 基础行为（无历史） ───────────────────────────────────────────────────────

test('buildPrompt: 返回 system / user / contexts 字段', () => {
  const ctx = makeContext(0, 'RAG is retrieval augmented generation.');
  const result = buildPrompt('What is RAG?', [ctx]);

  assert.equal(typeof result.system, 'string');
  assert.ok(result.system.length > 0, 'system prompt 不应为空');
  assert.ok(result.user.includes('What is RAG?'), 'user prompt 应包含问题');
  assert.ok(result.user.includes('RAG is retrieval augmented generation.'), 'user prompt 应包含 context');
  assert.deepEqual(result.contexts, [ctx]);
});

test('buildPrompt: 无 context 时展示兜底提示', () => {
  const result = buildPrompt('Unknown question?', []);
  assert.ok(result.user.includes('没有检索到相关资料'), '应有无资料兜底文本');
  assert.deepEqual(result.contexts, []);
});

test('buildPrompt: 无历史时 user prompt 不包含"对话历史"字样', () => {
  const result1 = buildPrompt('Q?', [makeContext(0)]);
  const result2 = buildPrompt('Q?', [makeContext(0)], []);

  assert.ok(!result1.user.includes('对话历史'), '无历史时不应有历史区块');
  assert.ok(!result2.user.includes('对话历史'), '空历史数组时不应有历史区块');
});

test('buildPrompt: 超大 context 列表时触发截断', () => {
  const bigContexts = Array.from({ length: 20 }, (_, i) =>
    makeContext(i, 'x'.repeat(700)),
  );
  const result = buildPrompt('question?', bigContexts);
  assert.ok(result.contexts.length < bigContexts.length, '超出字符上限时应截断 contexts');
  assert.ok(result.contexts.length > 0, '截断后仍应保留部分 contexts');
});

// ── 多轮历史 ────────────────────────────────────────────────────────────────

test('buildPrompt: 传入历史时 user prompt 包含"对话历史"区块', () => {
  const history: ChatHistoryItem[] = [
    { role: 'user', content: 'First question about databases' },
    { role: 'assistant', content: 'Databases store structured data.' },
  ];
  const result = buildPrompt('Follow-up question', [makeContext(0)], history);

  assert.ok(result.user.includes('对话历史'), '应有历史区块标题');
  assert.ok(result.user.includes('First question about databases'), '应包含用户历史消息');
  assert.ok(result.user.includes('Databases store structured data.'), '应包含助手历史消息');
  assert.ok(result.user.includes('Follow-up question'), '应包含当前问题');
});

test('buildPrompt: 历史区块出现在参考资料之后、当前问题之前', () => {
  const history: ChatHistoryItem[] = [
    { role: 'user', content: 'Old question' },
    { role: 'assistant', content: 'Old answer' },
  ];
  const result = buildPrompt('New question', [makeContext(0)], history);
  const refIdx = result.user.indexOf('参考资料');
  const histIdx = result.user.indexOf('对话历史');
  const qIdx = result.user.indexOf('用户问题');

  assert.ok(refIdx < histIdx, '参考资料应在历史之前');
  assert.ok(histIdx < qIdx, '历史应在当前问题之前');
});

test('buildPrompt: chatHistory 字段被透传到返回值', () => {
  const history: ChatHistoryItem[] = [
    { role: 'user', content: 'Previous Q' },
  ];
  const result = buildPrompt('Current Q', [makeContext(0)], history);
  assert.deepEqual(result.chatHistory, history);
});

test('buildPrompt: 无历史时 chatHistory 字段为 undefined', () => {
  const result = buildPrompt('Q', [makeContext(0)]);
  assert.equal(result.chatHistory, undefined);
});
```

- [ ] **Step 2: 运行测试，确认历史相关测试失败**

```bash
cd backend && pnpm test
```

Expected: 基础行为测试（前 4 个）通过；历史相关测试（后 4 个）失败，错误类似 "user prompt 应有历史区块"。

- [ ] **Step 3: 更新 promptBuilder.ts，支持多轮历史**

将 `backend/src/agent/promptBuilder.ts` 全量替换为：

```typescript
/**
 * Prompt 组装
 *
 * 职责：把用户问题、召回上下文和可选的多轮历史拼成 system/user 消息。
 * - 字符兜底：MAX_PROMPT_CHARS = 12000，从低分 context 开始丢弃
 * - 历史区块：「对话历史：\n用户：...\n助手：...」，位于参考资料之后、当前问题之前
 */

import type { ChatHistoryItem, PromptPayload, RetrievedContext } from './types';

/** 拼接后 user 消息的字符上限，超过时从末尾 context 开始丢弃 */
const MAX_PROMPT_CHARS = 12_000;

const SYSTEM_PROMPT = [
  '你是一个知识库问答助手。',
  '回答时请严格基于"参考资料"中的内容，不要编造信息。',
  '如果资料不足以回答，请直接说明缺少信息。',
  '回答末尾用形如 [1] [2] 的角标标注引用的资料编号。',
].join('\n');

export function buildPrompt(
  question: string,
  contexts: RetrievedContext[],
  chatHistory?: ChatHistoryItem[],
): PromptPayload {
  const historyText = buildHistoryBlock(chatHistory);
  const trimmedContexts = trimContexts(question, contexts, historyText.length);

  const contextBlock = trimmedContexts
    .map((ctx, index) => {
      const header = `[${index + 1}] 来源：${ctx.documentName}（片段 ${ctx.chunkIndex}）`;
      return `${header}\n${ctx.content}`;
    })
    .join('\n\n');

  const parts: string[] = [
    '参考资料：',
    contextBlock || '（当前没有检索到相关资料）',
    '',
  ];

  if (historyText) {
    parts.push(historyText, '');
  }

  parts.push(`用户问题：${question}`);

  return {
    system: SYSTEM_PROMPT,
    user: parts.join('\n'),
    contexts: trimmedContexts,
    chatHistory,
  };
}

/**
 * 拼接多轮对话历史为文本块。
 * 示例输出：
 *   对话历史：
 *   用户：上一个问题
 *   助手：上一个回答
 */
function buildHistoryBlock(chatHistory?: ChatHistoryItem[]): string {
  if (!chatHistory || chatHistory.length === 0) return '';
  const lines = ['对话历史：'];
  for (const msg of chatHistory) {
    const prefix = msg.role === 'user' ? '用户' : '助手';
    lines.push(`${prefix}：${msg.content}`);
  }
  return lines.join('\n');
}

/**
 * 按字符长度裁剪 context 列表。
 * extraOverhead 用于把历史区块的字符数计入总预算，避免 Prompt 超限。
 */
function trimContexts(
  question: string,
  contexts: RetrievedContext[],
  extraOverhead = 0,
): RetrievedContext[] {
  // 固定开销：「参考资料：\n」 + 「\n\n用户问题：」 + question + 历史记录
  const fixedLen =
    '参考资料：\n'.length +
    '\n\n用户问题：'.length +
    question.length +
    extraOverhead;

  let remaining = MAX_PROMPT_CHARS - fixedLen;
  if (remaining <= 0) return [];

  const kept: RetrievedContext[] = [];
  for (let i = 0; i < contexts.length; i++) {
    const ctx = contexts[i];
    const header = `[${i + 1}] 来源：${ctx.documentName}（片段 ${ctx.chunkIndex}）`;
    const blockLen = header.length + 1 + ctx.content.length + (i > 0 ? 2 : 0);

    if (blockLen > remaining) break;
    remaining -= blockLen;
    kept.push(ctx);
  }

  if (kept.length < contexts.length) {
    console.warn(
      `context trimmed from ${contexts.length} to ${kept.length} (MAX_PROMPT_CHARS=${MAX_PROMPT_CHARS})`,
    );
  }

  return kept;
}
```

- [ ] **Step 4: 运行测试，确认全部通过**

```bash
cd backend && pnpm test
```

Expected: 全部 20 tests pass（answerFormatter 5 + queryRewriter 5 + promptBuilder 10）。

- [ ] **Step 5: Commit**

```bash
cd backend && git add src/agent/__tests__/promptBuilder.test.ts src/agent/promptBuilder.ts && git commit -m "feat(agent): support chatHistory in promptBuilder; fix trimContexts overhead"
```

---

## Task 7: chatRepository 新增 getRecentMessages

**Files:**
- Modify: `backend/src/repositories/chatRepository.ts`

- [ ] **Step 1: 在文件末尾追加 getRecentMessages 函数**

在 `backend/src/repositories/chatRepository.ts` 末尾（`listMessagesBySession` 函数之后）追加：

```typescript
/**
 * 获取 session 最近 N 条消息（时间正序），用于多轮记忆注入 Agent。
 * 默认取最近 6 条（3 轮 user+assistant），调用方可按需调整。
 */
export async function getRecentMessages(
  sessionId: string,
  limit = 6,
): Promise<Array<{ role: string; content: string }>> {
  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { role: true, content: true },
  });
  return messages.reverse(); // 数据库倒序取最近 N 条，反转回时间正序
}
```

- [ ] **Step 2: 运行测试确保无破坏**

```bash
cd backend && pnpm test
```

Expected: 仍是 20 tests pass（新函数无对应单元测试，集成测试由 service.ts 覆盖）。

- [ ] **Step 3: Commit**

```bash
cd backend && git add src/repositories/chatRepository.ts && git commit -m "feat(chat): add getRecentMessages to chatRepository for multi-turn memory"
```

---

## Task 8: service.ts 接入多轮记忆 + 修复 contexts bug

**Files:**
- Modify: `backend/src/agent/service.ts`

当前 `service.ts` 有一个 bug：`formatAgentAnswer` 传入的是 `rerankContexts` 返回的原始 `contexts`，而非 `promptBuilder` 裁剪后的 `prompt.contexts`。这导致 references 列表可能包含未实际纳入 Prompt 的片段。

- [ ] **Step 1: 全量替换 service.ts**

```typescript
/**
 * Agent 服务统一入口
 *
 * 对 backend 只暴露 `runChat`，内部按 6 步链路：
 *   queryRewrite → retrieve → rerank → buildPrompt → callLLM → formatAnswer
 *
 * 多轮记忆：在 queryRewrite 和 buildPrompt 之前从 chatRepository 拉取近期历史，
 * 注入 chatHistory 参数，使问答具备上下文感知能力。
 *
 * 修复：formatAgentAnswer 现在使用 prompt.contexts（经 promptBuilder 裁剪后实际
 * 纳入 Prompt 的片段），而非 rerankContexts 返回的原始候选列表。
 */

import { rewriteQuery } from './queryRewriter';
import { retrieveContexts } from './retriever';
import { rerankContexts } from './reranker';
import { buildPrompt } from './promptBuilder';
import { generateAnswer } from './llmClient';
import { formatAgentAnswer } from './answerFormatter';
import { getRecentMessages } from '../repositories/chatRepository';
import type { AgentAnswer, AgentChatInput, ChatHistoryItem } from './types';

const DEFAULT_TOP_K = 5;
/** 注入 Agent 的历史轮数上限（每轮含 user + assistant 两条，共 HISTORY_TURNS * 2 条消息） */
const HISTORY_TURNS = 3;

export async function runChat(input: AgentChatInput): Promise<AgentAnswer> {
  const topK = input.topK ?? DEFAULT_TOP_K;

  // 从数据库拉取最近 N 条消息作为多轮历史
  const recentMessages = await getRecentMessages(
    input.sessionId,
    HISTORY_TURNS * 2,
  );
  const chatHistory: ChatHistoryItem[] = recentMessages
    .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
    .map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

  const rewritten = await rewriteQuery(input.question, chatHistory);
  const candidates = await retrieveContexts({ question: rewritten, topK });
  const contexts = await rerankContexts(rewritten, candidates);

  const prompt = buildPrompt(rewritten, contexts, chatHistory);
  const completion = await generateAnswer(prompt);

  // 使用 prompt.contexts（经过截断的实际纳入 Prompt 的片段）而非原始 contexts
  return formatAgentAnswer({ completion, contexts: prompt.contexts, topK });
}

export type { AgentAnswer, AgentChatInput } from './types';
```

- [ ] **Step 2: 运行测试确保无破坏**

```bash
cd backend && pnpm test
```

Expected: 仍是 20 tests pass。

- [ ] **Step 3: 验证 TypeScript 编译无错误**

```bash
cd backend && pnpm build
```

Expected: 编译成功，无类型错误。

- [ ] **Step 4: Commit**

```bash
cd backend && git add src/agent/service.ts && git commit -m "feat(agent): inject session history for multi-turn memory; fix formatAgentAnswer uses prompt.contexts"
```

---

## Task 9: 更新 docs/agent.md

**Files:**
- Modify: `docs/agent.md`

- [ ] **Step 1: 在文档末尾追加"多轮记忆"与"Stage 接口"两节**

在 `docs/agent.md` 末尾（`## 扩展点指引` 之后）追加以下内容：

```markdown
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
```

- [ ] **Step 2: 运行测试确认未影响任何测试**

```bash
cd backend && pnpm test
```

Expected: 20 tests pass.

- [ ] **Step 3: Commit**

```bash
cd docs && git add agent.md && git commit -m "docs(agent): document Stage interfaces and multi-turn memory"
```

---

## 验收检查

所有任务完成后，在 `backend/` 目录运行以下命令，确认最终状态：

```bash
# 全量测试
pnpm test
# Expected: 20 tests pass, 0 failures

# TypeScript 编译
pnpm build
# Expected: 无类型错误，dist/ 正常生成
```

手工端对端验证（需要服务在运行）：

1. 发起第一个问题 `POST /api/chat/ask { "question": "什么是 RAG？" }`，记录返回的 `sessionId`。
2. 携带同一 `sessionId` 发起追问 `POST /api/chat/ask { "question": "它的主要优势是什么？", "sessionId": "<上一步 sessionId>" }`。
3. 查看 backend 日志：`[llmClient] request start` 中的 `promptCharLen` 应明显大于第一次（说明历史已纳入 Prompt）。
4. 返回答案中「它」应被 LLM 正确理解为「RAG」（多轮语义保持）。

---

## 扩展路线

完成本 Step 7 后，Agent 具备以下扩展基础：

| 扩展能力 | 入口文件 | 说明 |
|---------|---------|------|
| 真实 Query Rewrite | `queryRewriter.ts` | 替换直通逻辑，接入 LLM 改写，已有 chatHistory 参数 |
| Cross-Encoder Reranker | `reranker.ts` | 替换直通逻辑，接入本地/远程重排服务 |
| Tool Use | `service.ts` | 在 retrieve 之前/之后插入 Tool Call 环节 |
| LangGraph | `service.ts` | 将六步链路迁移到 LangGraph StateGraph，各 Stage 接口不变 |
| 长期记忆 | `chatRepository.ts` | 扩展 `getRecentMessages` 为向量摘要检索 |
