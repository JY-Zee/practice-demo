/**
 * 任务相关 API 服务
 *
 * 对应后端：backend/src/routers/tasks.ts
 */

import { request } from '@/lib/apiClient';
import type { TaskResponse } from '@/types/api';

export const fetchTaskDetail = (id: string) =>
  request<TaskResponse>(`/api/tasks/${id}`, { method: 'GET' });
