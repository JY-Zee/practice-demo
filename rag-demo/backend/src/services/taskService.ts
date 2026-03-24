/**
 * 摄取任务业务服务
 *
 * 查询任务状态与详情。
 */

import * as taskRepo from '../repositories/taskRepository';

/** 按 ID 查询任务详情 */
export async function getTaskById(id: string) {
  const task = await taskRepo.findTaskById(id);
  if (!task) return null;
  return serializeTask(task);
}

/** 按文档 ID 查询最新任务 */
export async function getLatestTaskByDocumentId(documentId: string) {
  const task = await taskRepo.findLatestTaskByDocumentId(documentId);
  if (!task) return null;
  return serializeTask(task);
}

/** 将 Prisma IngestionTask 序列化为 API 响应格式 */
function serializeTask(task: any) {
  return {
    id: task.id,
    documentId: task.documentId,
    status: task.status,
    currentStep: task.currentStep,
    errorMessage: task.errorMessage,
    startedAt: task.startedAt?.toISOString() ?? null,
    finishedAt: task.finishedAt?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
  };
}
