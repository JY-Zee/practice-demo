/**
 * 聊天业务服务
 *
 * 链路 1：接入 Agent 服务层（当前 Agent 内部为骨架 + 占位实现），
 * 负责：
 * 1. 分配/复用 sessionId
 * 2. 持久化用户消息 → 调用 Agent → 持久化助手消息
 * 3. 将 Agent 返回结构转为 API 响应
 *
 * 后续链路 2~3 只会替换 Agent 内部实现，此处保持稳定。
 */

import { runChat } from '../agent/service';
import * as chatRepo from '../repositories/chatRepository';
import type { AskQuestionInput, ListChatMessagesQuery, Reference } from '../schemas/chat';

export async function askQuestion(input: AskQuestionInput) {
  const sessionId = input.sessionId ?? randomSessionId();

  const agentResult = await runChat({
    question: input.question,
    sessionId,
  });

  const references: Reference[] = agentResult.references;

  await chatRepo.createMessage({
    sessionId,
    role: 'user',
    content: input.question,
  });

  const reply = await chatRepo.createMessage({
    sessionId,
    role: 'assistant',
    content: agentResult.answer,
    referencesJson: references,
  });

  return {
    id: reply.id,
    sessionId,
    role: reply.role,
    content: reply.content,
    referencesJson: references,
    createdAt: reply.createdAt.toISOString(),
    meta: agentResult.meta,
  };
}

/** 分页查询会话历史 */
export async function listMessages(query: ListChatMessagesQuery) {
  const result = await chatRepo.listMessagesBySession(query);
  return {
    ...result,
    items: result.items.map((msg) => ({
      id: msg.id,
      sessionId: msg.sessionId,
      role: msg.role,
      content: msg.content,
      referencesJson: msg.referencesJson,
      createdAt: msg.createdAt.toISOString(),
    })),
  };
}

function randomSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
