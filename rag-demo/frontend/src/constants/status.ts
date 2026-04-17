/**
 * 状态文案与展示色映射
 *
 * 仅做前端展示用，和后端枚举值严格一一对应。
 */

import type { DocumentStatus, TaskStatus } from '@/types/api';

interface StatusMeta {
  label: string;
  color: string;
}

export const DOCUMENT_STATUS_META: Record<DocumentStatus, StatusMeta> = {
  pending: { label: '待处理', color: 'default' },
  processing: { label: '处理中', color: 'processing' },
  completed: { label: '已完成', color: 'success' },
  failed: { label: '失败', color: 'error' },
};

export const TASK_STATUS_META: Record<TaskStatus, StatusMeta> = {
  pending: { label: '等待', color: 'default' },
  processing: { label: '运行中', color: 'processing' },
  completed: { label: '完成', color: 'success' },
  failed: { label: '失败', color: 'error' },
};

/** 当前页是否还有需要继续轮询的文档 */
export const isActiveDocumentStatus = (status: DocumentStatus): boolean =>
  status === 'pending' || status === 'processing';
