/**
 * Worker 侧任务状态维护
 *
 * 统一更新 Postgres 中的任务状态与文档状态，避免各 processor 各自散落处理。
 */

import { prisma } from './prisma';

interface JobIdentity {
  taskId: string;
  documentId: string;
}

export async function markProcessingStep(
  { taskId, documentId }: JobIdentity,
  currentStep: 'parse' | 'chunk' | 'embed' | 'upsert' | 'complete',
) {
  const task = await prisma.ingestionTask.findUnique({
    where: { id: taskId },
    select: { startedAt: true },
  });

  await Promise.all([
    prisma.ingestionTask.update({
      where: { id: taskId },
      data: {
        status: 'processing',
        currentStep,
        errorMessage: null,
        ...(task?.startedAt ? {} : { startedAt: new Date() }),
      },
    }),
    prisma.document.update({
      where: { id: documentId },
      data: { status: 'processing' },
    }),
  ]);
}

export async function markCompleted({ taskId, documentId }: JobIdentity) {
  await Promise.all([
    prisma.ingestionTask.update({
      where: { id: taskId },
      data: {
        status: 'completed',
        currentStep: 'complete',
        errorMessage: null,
        finishedAt: new Date(),
      },
    }),
    prisma.document.update({
      where: { id: documentId },
      data: { status: 'completed' },
    }),
  ]);
}

export async function markFailed(
  { taskId, documentId }: JobIdentity,
  currentStep: string | null,
  error: unknown,
) {
  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : '未知错误';

  await Promise.all([
    prisma.ingestionTask.update({
      where: { id: taskId },
      data: {
        status: 'failed',
        currentStep,
        errorMessage: message,
        finishedAt: new Date(),
      },
    }),
    prisma.document.update({
      where: { id: documentId },
      data: { status: 'failed' },
    }),
  ]);
}
