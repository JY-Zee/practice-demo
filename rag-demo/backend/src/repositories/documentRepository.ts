/**
 * 文档数据访问层
 *
 * 封装 Document 表的 CRUD 操作，供 Service 层调用。
 */

import { prisma } from '../lib/prisma';
import type { UploadDocumentInput, ListDocumentsQuery } from '../schemas/document';

/** 创建文档记录 */
export async function createDocument(input: UploadDocumentInput) {
  return prisma.document.create({
    data: {
      fileName: input.fileName,
      fileType: input.fileType,
      fileSize: BigInt(input.fileSize),
      storagePath: input.storagePath,
      status: 'pending',
    },
  });
}

/** 按 ID 查询单个文档 */
export async function findDocumentById(id: string) {
  return prisma.document.findUnique({ where: { id } });
}

/** 分页查询文档列表 */
export async function listDocuments(query: ListDocumentsQuery) {
  const { page, pageSize, status } = query;
  const where = status ? { status } : {};

  const [items, total] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.document.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

/** 更新文档状态 */
export async function updateDocumentStatus(id: string, status: string) {
  return prisma.document.update({
    where: { id },
    data: { status },
  });
}

/** 更新文档切块数量 */
export async function updateDocumentChunkCount(id: string, chunkCount: number) {
  return prisma.document.update({
    where: { id },
    data: { chunkCount },
  });
}
