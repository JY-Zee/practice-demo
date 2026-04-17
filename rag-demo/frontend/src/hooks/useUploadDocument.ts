/**
 * 文档上传 mutation
 *
 * 上传成功后失效列表缓存，让列表页自动刷新。
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadDocument } from '@/services/documents';
import { DOCUMENTS_QUERY_KEY } from './useDocuments';

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadDocument(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DOCUMENTS_QUERY_KEY] });
    },
  });
}
