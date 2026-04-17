/**
 * 问答相关 API 服务
 *
 * 对应后端：backend/src/routers/chat.ts
 */

import { request } from '@/lib/apiClient';
import type { ChatMessageResponse } from '@/types/api';

interface PaginatedChatMessages {
  items: ChatMessageResponse[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListChatMessagesParams {
  sessionId: string;
  page?: number;
  pageSize?: number;
}

export const fetchChatMessages = (params: ListChatMessagesParams) =>
  request<PaginatedChatMessages>('/api/chat/messages', {
    method: 'GET',
    query: params,
  });
