/**
 * 答案与引用来源格式化
 *
 * 把 LLM 输出和召回上下文整理成统一的 AgentAnswer：
 * - answer：最终文本回答
 * - references：符合 backend Reference Schema 的引用列表
 * - meta：可观测元数据（模型、召回数、token 用量等）
 */

import type { Reference } from '../schemas/chat';
import type {
  AgentAnswer,
  LlmCompletion,
  RetrievedContext,
} from './types';

export interface FormatAnswerParams {
  completion: LlmCompletion;
  contexts: RetrievedContext[];
  topK: number;
}

export function formatAgentAnswer({
  completion,
  contexts,
  topK,
}: FormatAnswerParams): AgentAnswer {
  const references: Reference[] = contexts.map((ctx) => ({
    documentId: ctx.documentId,
    documentName: ctx.documentName,
    chunkIndex: ctx.chunkIndex,
    content: ctx.content,
    score: clampScore(ctx.score),
  }));

  return {
    answer: completion.content,
    references,
    meta: {
      model: completion.model,
      retrievedCount: contexts.length,
      topK,
      finishReason: completion.finishReason,
      usage: completion.usage,
    },
  };
}

/** Reference.score 规定在 [0, 1]，检索得分可能超出 1，这里做安全夹取 */
function clampScore(score: number) {
  if (Number.isNaN(score)) return 0;
  if (score < 0) return 0;
  if (score > 1) return 1;
  return score;
}
