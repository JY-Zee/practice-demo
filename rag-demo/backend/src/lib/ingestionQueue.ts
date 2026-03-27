/**
 * 文档摄取入队封装
 *
 * backend 只负责投递触发任务，真正的 5 步 Flow 由 worker 侧展开。
 */

import { Queue } from 'bullmq';

import { env } from '../config/env';

interface IngestionJobPayload {
  taskId: string;
  documentId: string;
}

const ingestionQueue = new Queue<IngestionJobPayload>('document-ingestion', {
  connection: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
  prefix: env.INGESTION_QUEUE_PREFIX,
  defaultJobOptions: {
    removeOnComplete: 1000,
    removeOnFail: 1000,
  },
});

export async function enqueueDocumentIngestion(payload: IngestionJobPayload) {
  await ingestionQueue.add('ingest-document', payload);
}

export async function closeIngestionQueue() {
  await ingestionQueue.close();
}
