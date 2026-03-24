/**
 * 聊天业务服务
 *
 * 当前为 mock 实现，Step 5 接入 Agent 后会替换为真实的 RAG 问答链路。
 */

import * as chatRepo from '../repositories/chatRepository';
import type { AskQuestionInput, ListChatMessagesQuery } from '../schemas/chat';

/** 提问（mock）：保存用户消息 + 返回 mock 回答 */
export async function askQuestion(input: AskQuestionInput) {
  const sessionId = input.sessionId ?? randomSessionId();

  await chatRepo.createMessage({
    sessionId,
    role: 'user',
    content: input.question,
  });

  const mockAnswer =
    `这是一个 mock 回答。您的问题是：「${input.question}」。` +
    '当 Agent 服务层完成后，这里将返回基于文档检索的真实回答。';

  const mockReferences = [
    {
      documentId: '00000000-0000-0000-0000-000000000000',
      documentName: 'mock-document.md',
      chunkIndex: 0,
      content: '这是模拟的引用片段内容...',
      score: 0.95,
    },
  ];

  const reply = await chatRepo.createMessage({
    sessionId,
    role: 'assistant',
    content: mockAnswer,
    referencesJson: mockReferences,
  });

  return {
    id: reply.id,
    sessionId,
    role: reply.role,
    content: reply.content,
    referencesJson: mockReferences,
    createdAt: reply.createdAt.toISOString(),
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
