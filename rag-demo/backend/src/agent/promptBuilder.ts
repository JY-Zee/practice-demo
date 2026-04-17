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
