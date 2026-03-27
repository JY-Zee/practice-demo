import type { Job } from 'bullmq';

export async function getSingleChildValue<T>(job: Job) {
  const childValues = Object.values(await job.getChildrenValues()) as T[];

  if (childValues.length === 0) {
    throw new Error(`步骤 ${job.name} 缺少上游处理结果`);
  }

  return childValues[0];
}
