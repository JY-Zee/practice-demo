/**
 * 文档业务服务
 *
 * 处理文档上传（保存元数据 + 创建摄取任务）、查询列表、查询详情。
 */

import * as documentRepo from '../repositories/documentRepository';
import * as taskRepo from '../repositories/taskRepository';
import type { ListDocumentsQuery } from '../schemas/document';

interface UploadParams {
  originalName: string;
  mimetype: string;
  size: number;
  storagePath: string;
}

/** 上传文档：写入 Document 记录 + 创建 IngestionTask */
export async function uploadDocument(params: UploadParams) {
  const ext = params.originalName.split('.').pop()?.toLowerCase() ?? '';

  const doc = await documentRepo.createDocument({
    fileName: params.originalName,
    fileType: ext,
    fileSize: params.size,
    storagePath: params.storagePath,
  });

  const task = await taskRepo.createTask({ documentId: doc.id });

  return { document: serializeDocument(doc), task };
}

/** 分页查询文档列表 */
export async function listDocuments(query: ListDocumentsQuery) {
  const result = await documentRepo.listDocuments(query);
  return {
    ...result,
    items: result.items.map(serializeDocument),
  };
}

/** 查询单个文档详情 */
export async function getDocumentById(id: string) {
  const doc = await documentRepo.findDocumentById(id);
  if (!doc) return null;
  return serializeDocument(doc);
}

/** 将 Prisma Document 序列化为 API 响应格式（BigInt → number） */
function serializeDocument(doc: any) {
  return {
    id: doc.id,
    fileName: doc.fileName,
    fileType: doc.fileType,
    fileSize: Number(doc.fileSize),
    storagePath: doc.storagePath,
    status: doc.status,
    chunkCount: doc.chunkCount,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
