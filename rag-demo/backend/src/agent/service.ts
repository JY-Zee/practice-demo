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
