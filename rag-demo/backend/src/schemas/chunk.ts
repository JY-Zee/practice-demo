/**
 * 文档切块相关 Zod Schemas
 *
 * 定义切块创建输入与响应结构，供 Worker 写入和 API 查询使用。
 */

import { z } from 'zod';

/** 切块创建输入（Worker 解析文档后批量写入） */
export const CreateChunkSchema = z.object({
  documentId: z.string().uuid(),
  chunkIndex: z.number().int().nonnegative(),
  content: z.string().min(1),
  tokenCount: z.number().int().nonnegative().default(0),
  metadataJson: z.record(z.unknown()).default({}),
});
export type CreateChunkInput = z.infer<typeof CreateChunkSchema>;

/** 单个切块响应结构 */
export const ChunkResponseSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  chunkIndex: z.number().int(),
  content: z.string(),
  tokenCount: z.number().int(),
  metadataJson: z.record(z.unknown()),
  createdAt: z.string().datetime(),
});
export type ChunkResponse = z.infer<typeof ChunkResponseSchema>;

/** 按文档 ID 查询切块列表的参数 */
export const ListChunksByDocumentSchema = z.object({
  documentId: z.string().uuid(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});
export type ListChunksByDocumentQuery = z.infer<typeof ListChunksByDocumentSchema>;
