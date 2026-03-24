/**
 * 摄取任务相关 Zod Schemas
 *
 * 定义任务创建、状态更新、以及响应结构的校验规则。
 * 任务表跟踪文档从上传到向量入库的完整处理流程。
 */

import { z } from 'zod';

/** 任务状态枚举 */
export const TaskStatus = z.enum([
  'pending',    // 等待处理
  'processing', // 处理中
  'completed',  // 已完成
  'failed',     // 处理失败
]);
export type TaskStatus = z.infer<typeof TaskStatus>;

/** 任务处理步骤枚举 */
export const TaskStep = z.enum([
  'parse',     // 文档解析
  'chunk',     // 文本切块
  'embed',     // 生成向量
  'upsert',    // 写入 Qdrant
  'complete',  // 标记完成
]);
export type TaskStep = z.infer<typeof TaskStep>;

/** 创建任务输入 */
export const CreateTaskSchema = z.object({
  documentId: z.string().uuid(),
});
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

/** 更新任务状态输入（Worker 在每个步骤完成后调用） */
export const UpdateTaskSchema = z.object({
  status: TaskStatus.optional(),
  currentStep: TaskStep.optional(),
  errorMessage: z.string().optional(),
  startedAt: z.string().datetime().optional(),
  finishedAt: z.string().datetime().optional(),
});
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

/** 单个任务响应结构 */
export const TaskResponseSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  status: TaskStatus,
  currentStep: z.string().nullable(),
  errorMessage: z.string().nullable(),
  startedAt: z.string().datetime().nullable(),
  finishedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
export type TaskResponse = z.infer<typeof TaskResponseSchema>;
