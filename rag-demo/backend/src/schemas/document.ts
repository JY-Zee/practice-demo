/**
 * 文档相关 Zod Schemas
 *
 * 定义文档上传请求、列表查询参数、以及响应结构的类型校验。
 * 作为 Controller 层入参校验与 API 文档的单一数据源。
 */

import { z } from 'zod';

/** 文档处理状态枚举 */
export const DocumentStatus = z.enum([
  'pending',    // 待处理
  'processing', // 处理中
  'completed',  // 已完成
  'failed',     // 处理失败
]);
export type DocumentStatus = z.infer<typeof DocumentStatus>;

/** 文档上传请求体（文件通过 multer 处理，这里校验附加字段） */
export const UploadDocumentSchema = z.object({
  fileName: z.string().min(1).max(500),
  fileType: z.string().min(1).max(50),
  fileSize: z.coerce.number().int().nonnegative(),
  storagePath: z.string().min(1).max(1000),
});
export type UploadDocumentInput = z.infer<typeof UploadDocumentSchema>;

/** 文档列表查询参数 */
export const ListDocumentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: DocumentStatus.optional(),
});
export type ListDocumentsQuery = z.infer<typeof ListDocumentsQuerySchema>;

/** 单个文档响应结构 */
export const DocumentResponseSchema = z.object({
  id: z.string().uuid(),
  fileName: z.string(),
  fileType: z.string(),
  fileSize: z.number(),
  storagePath: z.string(),
  status: DocumentStatus,
  chunkCount: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type DocumentResponse = z.infer<typeof DocumentResponseSchema>;

/** 文档列表分页响应 */
export const PaginatedDocumentsSchema = z.object({
  items: z.array(DocumentResponseSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});
export type PaginatedDocuments = z.infer<typeof PaginatedDocumentsSchema>;
