/**
 * 后端 API 响应类型
 *
 * 与 `backend/src/schemas/*.ts` 中的 Zod schema 一一对齐。
 * 后端若变更字段需同步更新此处。
 */

export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface DocumentResponse {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  status: DocumentStatus;
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedDocuments {
  items: DocumentResponse[];
  total: number;
  page: number;
  pageSize: number;
}

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type TaskStep = 'parse' | 'chunk' | 'embed' | 'upsert' | 'complete';

export interface TaskResponse {
  id: string;
  documentId: string;
  status: TaskStatus;
  currentStep: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

export interface UploadDocumentResult {
  document: DocumentResponse;
  task: TaskResponse;
}

export type ChatRole = 'user' | 'assistant' | 'system';

export interface Reference {
  documentId: string;
  documentName: string;
  chunkIndex: number;
  content: string;
  score?: number;
}

export interface ChatMessageResponse {
  id: string;
  sessionId: string;
  role: ChatRole;
  content: string;
  referencesJson: Reference[];
  createdAt: string;
}

export interface AskResult extends ChatMessageResponse {
  /** 非标准字段：后端 chatService 额外返回的 Agent 元信息，目前未强校验 */
  meta?: Record<string, unknown>;
}

export interface ApiErrorPayload {
  error?: {
    status?: number;
    message?: string;
    details?: unknown;
  };
}
