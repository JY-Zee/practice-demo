/**
 * 摄取任务数据访问层
 *
 * 封装 IngestionTask 表的 CRUD 操作。
 */

import { prisma } from '../lib/prisma';
import type { CreateTaskInput, UpdateTaskInput } from '../schemas/task';

/** 创建摄取任务 */
export async function createTask(input: CreateTaskInput) {
  return prisma.ingestionTask.create({
    data: {
      documentId: input.documentId,
      status: 'pending',
    },
  });
}

/** 按 ID 查询任务 */
export async function findTaskById(id: string) {
  return prisma.ingestionTask.findUnique({
    where: { id },
    include: { document: true },
  });
}

/** 按文档 ID 查询最新任务 */
export async function findLatestTaskByDocumentId(documentId: string) {
  return prisma.ingestionTask.findFirst({
    where: { documentId },
    orderBy: { createdAt: 'desc' },
  });
}

/** 更新任务状态 */
export async function updateTask(id: string, input: UpdateTaskInput) {
  return prisma.ingestionTask.update({
    where: { id },
    data: {
      ...(input.status !== undefined && { status: input.status }),
      ...(input.currentStep !== undefined && { currentStep: input.currentStep }),
      ...(input.errorMessage !== undefined && { errorMessage: input.errorMessage }),
      ...(input.startedAt !== undefined && { startedAt: new Date(input.startedAt) }),
      ...(input.finishedAt !== undefined && { finishedAt: new Date(input.finishedAt) }),
    },
  });
}
