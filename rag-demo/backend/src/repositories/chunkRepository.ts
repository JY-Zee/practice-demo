/**
 * 文档切块数据访问层
 *
 * 封装 DocumentChunk 表的 CRUD 操作。
 */

import { prisma } from '../lib/prisma';
import type { CreateChunkInput, ListChunksByDocumentQuery } from '../schemas/chunk';

/** 批量创建切块 */
export async function createChunks(inputs: CreateChunkInput[]) {
  return prisma.documentChunk.createMany({
    data: inputs.map((input) => ({
      documentId: input.documentId,
      chunkIndex: input.chunkIndex,
      content: input.content,
      tokenCount: input.tokenCount,
      metadataJson: input.metadataJson as any,
    })),
  });
}

/** 按文档 ID 分页查询切块 */
export async function listChunksByDocument(query: ListChunksByDocumentQuery) {
  const { documentId, page, pageSize } = query;
  const where = { documentId };

  const [items, total] = await Promise.all([
    prisma.documentChunk.findMany({
      where,
      orderBy: { chunkIndex: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.documentChunk.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

/** 按文档 ID 删除所有切块 */
export async function deleteChunksByDocumentId(documentId: string) {
  return prisma.documentChunk.deleteMany({ where: { documentId } });
}
