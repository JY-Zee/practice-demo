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
