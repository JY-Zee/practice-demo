/**
 * 聊天消息数据访问层
 *
 * 封装 ChatMessage 表的 CRUD 操作。
 */

import { prisma } from '../lib/prisma';
import type { ListChatMessagesQuery } from '../schemas/chat';

interface CreateMessageInput {
  sessionId: string;
  role: string;
  content: string;
  referencesJson?: object[];
}

/** 创建聊天消息 */
export async function createMessage(input: CreateMessageInput) {
  return prisma.chatMessage.create({
    data: {
      sessionId: input.sessionId,
      role: input.role,
      content: input.content,
      referencesJson: (input.referencesJson as any) ?? [],
    },
  });
}

/** 按 session 分页查询聊天历史 */
export async function listMessagesBySession(query: ListChatMessagesQuery) {
  const { sessionId, page, pageSize } = query;
  const where = { sessionId };

  const [items, total] = await Promise.all([
    prisma.chatMessage.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.chatMessage.count({ where }),
  ]);

  return { items, total, page, pageSize };
}
