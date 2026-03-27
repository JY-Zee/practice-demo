/**
 * 第五步：标记任务完成并清理中间产物
 */

import type { Job } from 'bullmq';

import { cleanupArtifactDir } from '../lib/artifacts';
import { getSingleChildValue } from '../lib/flow';
import { markCompleted, markProcessingStep } from '../lib/ingestionState';
import type {
  IngestionJobPayload,
  UpsertedVectorsArtifact,
} from '../types/jobs';

export async function markComplete(job: Job<IngestionJobPayload>) {
  await markProcessingStep(job.data, 'complete');

  const upserted = await getSingleChildValue<UpsertedVectorsArtifact>(job);
  await markCompleted(job.data);
  await cleanupArtifactDir(upserted.artifactDir);

  return {
    taskId: upserted.taskId,
    documentId: upserted.documentId,
    vectorCount: upserted.vectorCount,
    status: 'completed',
  };
}
