/**
 * BullMQ Worker 入口
 *
 * 负责：
 * 1. 接收 backend 投递的摄取任务；
 * 2. 创建 BullMQ Flow；
 * 3. 启动 5 个步骤处理器；
 * 4. 在失败时把任务/文档状态回写到 PostgreSQL。
 */

import { Worker } from 'bullmq';

import { env } from './config/env';
import { getEmbeddingStartupWarning } from './lib/embedding';
import { markComplete } from './processors/markComplete';
import { embedChunks } from './processors/embedChunks';
import { parseDocument } from './processors/parseDocument';
import { splitChunks } from './processors/splitChunks';
import { upsertVectors } from './processors/upsertVectors';
import { closeFlowProducer, enqueueIngestionFlow } from './pipeline';
import { markFailed } from './lib/ingestionState';
import { prisma } from './lib/prisma';
import { ensureQdrantCollectionCompatibility } from './lib/qdrant';
import { bullmqConnection, bullmqPrefix, QUEUE_NAMES } from './lib/queue';
import type { IngestionJobPayload } from './types/jobs';

function attachLogging(worker: Worker<IngestionJobPayload>, label: string) {
  worker.on('completed', (job) => {
    console.log(`✅ [${label}] 完成 task=${job.data.taskId} doc=${job.data.documentId}`);
  });

  worker.on('failed', async (job, error) => {
    if (!job) {
      console.error(`❌ [${label}] 未拿到失败任务信息`, error);
      return;
    }

    console.error(`❌ [${label}] 失败 task=${job.data.taskId}: ${error.message}`);

    try {
      await markFailed(job.data, job.name ?? null, error);
    } catch (markError) {
      console.error('❌ 回写失败状态时出错', markError);
    }
  });
}

const triggerWorker = new Worker<IngestionJobPayload>(
  QUEUE_NAMES.ingestion,
  async (job) => {
    await enqueueIngestionFlow(job.data);
    return {
      enqueued: true,
      taskId: job.data.taskId,
      documentId: job.data.documentId,
    };
  },
  {
    connection: bullmqConnection,
    prefix: bullmqPrefix,
    concurrency: 5,
  },
);

const parseWorker = new Worker(QUEUE_NAMES.parse, parseDocument, {
  connection: bullmqConnection,
  prefix: bullmqPrefix,
  concurrency: 2,
});

const splitWorker = new Worker(QUEUE_NAMES.split, splitChunks, {
  connection: bullmqConnection,
  prefix: bullmqPrefix,
  concurrency: 2,
});

const embedWorker = new Worker(QUEUE_NAMES.embed, embedChunks, {
  connection: bullmqConnection,
  prefix: bullmqPrefix,
  concurrency: 2,
});

const upsertWorker = new Worker(QUEUE_NAMES.upsert, upsertVectors, {
  connection: bullmqConnection,
  prefix: bullmqPrefix,
  concurrency: 2,
});

const completeWorker = new Worker(QUEUE_NAMES.complete, markComplete, {
  connection: bullmqConnection,
  prefix: bullmqPrefix,
  concurrency: 2,
});

const workers = [
  { label: 'trigger', worker: triggerWorker },
  { label: 'parse', worker: parseWorker },
  { label: 'chunk', worker: splitWorker },
  { label: 'embed', worker: embedWorker },
  { label: 'upsert', worker: upsertWorker },
  { label: 'complete', worker: completeWorker },
];

workers.forEach(({ label, worker }) => attachLogging(worker as Worker<IngestionJobPayload>, label));

async function bootstrap() {
  await Promise.all(workers.map(({ worker }) => worker.waitUntilReady()));
  await ensureQdrantCollectionCompatibility(
    env.QDRANT_COLLECTION,
    env.EMBEDDING_DIMENSION,
  );

  const embeddingWarning = getEmbeddingStartupWarning(env.EMBEDDING_API_BASE);
  if (embeddingWarning) {
    console.warn(embeddingWarning);
  }

  console.log('🚀 Worker 已启动，等待摄取任务...');
}

async function shutdown(signal: string) {
  console.log(`\n${signal} 收到，开始关闭 Worker...`);

  await Promise.allSettled(workers.map(({ worker }) => worker.close()));
  await Promise.allSettled([closeFlowProducer(), prisma.$disconnect()]);

  console.log('✅ Worker 已关闭');
  process.exit(0);
}

bootstrap().catch(async (error) => {
  console.error('❌ Worker 启动失败', error);
  await Promise.allSettled([closeFlowProducer(), prisma.$disconnect()]);
  process.exit(1);
});

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
