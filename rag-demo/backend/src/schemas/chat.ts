/**
 * 聊天消息相关 Zod Schemas
 *
 * 定义问答请求、消息记录、以及引用来源的校验结构。
 * 支持多轮对话的 session 机制。
 */

import { z } from 'zod';

/** 消息角色枚举 */
export const ChatRole = z.enum(['user', 'assistant', 'system']);
export type ChatRole = z.infer<typeof ChatRole>;

/** 引用来源结构：标记答案中引用了哪个文档的哪段内容 */
export const ReferenceSchema = z.object({
  documentId: z.string().uuid(),
  documentName: z.string(),
  chunkIndex: z.number().int(),
  content: z.string(),
  score: z.number().min(0).max(1).optional(),
});
export type Reference = z.infer<typeof ReferenceSchema>;

/** 用户提问请求体 */
export const AskQuestionSchema = z.object({
  question: z.string().min(1).max(2000),
  sessionId: z.string().min(1).max(100).optional(),
});
export type AskQuestionInput = z.infer<typeof AskQuestionSchema>;

/** 单条聊天消息响应 */
export const ChatMessageResponseSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string(),
  role: ChatRole,
  content: z.string(),
  referencesJson: z.array(ReferenceSchema),
  createdAt: z.string().datetime(),
});
export type ChatMessageResponse = z.infer<typeof ChatMessageResponseSchema>;

/** 会话历史查询参数 */
export const ListChatMessagesSchema = z.object({
  sessionId: z.string().min(1),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});
export type ListChatMessagesQuery = z.infer<typeof ListChatMessagesSchema>;
