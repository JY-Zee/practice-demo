/**
 * 文档相关 API 服务
 *
 * 对应后端：backend/src/routers/documents.ts
 */

import { request } from '@/lib/apiClient';
import type {
  DocumentResponse,
  DocumentStatus,
  PaginatedDocuments,
  UploadDocumentResult,
} from '@/types/api';

export interface ListDocumentsParams {
  page?: number;
  pageSize?: number;
  status?: DocumentStatus;
}

export const fetchDocuments = (params: ListDocumentsParams = {}) =>
  request<PaginatedDocuments>('/api/documents', {
    method: 'GET',
    query: params,
  });

export const fetchDocumentDetail = (id: string) =>
  request<DocumentResponse>(`/api/documents/${id}`, { method: 'GET' });

export const uploadDocument = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return request<UploadDocumentResult>('/api/documents/upload', {
    method: 'POST',
    formData,
  });
};
