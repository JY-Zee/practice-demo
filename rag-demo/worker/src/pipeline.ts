/**
 * BullMQ 流水线编排
 *
 * 使用 FlowProducer 将 parse -> split -> embed -> upsert -> complete 串为一条依赖链。
 */

import { FlowProducer } from 'bullmq';

import { bullmqConnection, bullmqPrefix, QUEUE_NAMES } from './lib/queue';
import type { IngestionJobPayload } from './types/jobs';

const flowProducer = new FlowProducer({
  connection: bullmqConnection,
  prefix: bullmqPrefix,
});

export async function enqueueIngestionFlow(payload: IngestionJobPayload) {
  return flowProducer.add({
    name: 'complete',
    queueName: QUEUE_NAMES.complete,
    data: payload,
    children: [
      {
        name: 'upsert',
        queueName: QUEUE_NAMES.upsert,
        data: payload,
        children: [
          {
            name: 'embed',
            queueName: QUEUE_NAMES.embed,
            data: payload,
            children: [
              {
                name: 'chunk',
                queueName: QUEUE_NAMES.split,
                data: payload,
                children: [
                  {
                    name: 'parse',
                    queueName: QUEUE_NAMES.parse,
                    data: payload,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  });
}

export async function closeFlowProducer() {
  await flowProducer.close();
}
