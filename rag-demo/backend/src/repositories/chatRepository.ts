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
