/**
 * 文档列表查询 Hook
 *
 * 核心特点：
 * - 仅当当前页存在 `pending/processing` 文档时才开启轮询，避免空转。
 * - queryKey 包含分页参数，切页自动失效。
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { fetchDocuments, type ListDocumentsParams } from '@/services/documents';
import { isActiveDocumentStatus } from '@/constants/status';
import type { PaginatedDocuments } from '@/types/api';

export const DOCUMENTS_QUERY_KEY = 'documents';

export function useDocuments(params: ListDocumentsParams = {}): UseQueryResult<PaginatedDocuments> {
  return useQuery({
    queryKey: [DOCUMENTS_QUERY_KEY, params],
    queryFn: () => fetchDocuments(params),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      const hasActive = data.items.some((doc) => isActiveDocumentStatus(doc.status));
      return hasActive ? 3000 : false;
    },
  });
}
