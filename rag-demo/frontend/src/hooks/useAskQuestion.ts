/**
 * 发起问答的 mutation
 *
 * 封装 `askStream`，把回调式的流式接口适配为 React Query 的 mutation 语义。
 * 调用方既可以通过 `onDelta` 拿到"逐步填充"的增量文本，也可以通过 mutation 的
 * `onSuccess` 拿到最终完整消息。
 */

import { useMutation } from '@tanstack/react-query';
import { askStream } from '@/lib/chatStream';
import type { AskResult } from '@/types/api';

interface UseAskQuestionOptions {
  onDelta?: (deltaText: string, fullText: string) => void;
  onSuccess?: (message: AskResult) => void;
  onError?: (error: unknown) => void;
}

interface AskInput {
  question: string;
  sessionId?: string;
}

export function useAskQuestion(options: UseAskQuestionOptions = {}) {
  return useMutation({
    mutationFn: (input: AskInput) =>
      new Promise<AskResult>((resolve, reject) => {
        askStream({
          question: input.question,
          sessionId: input.sessionId,
          onDelta: (delta, full) => options.onDelta?.(delta, full),
          onDone: (msg) => resolve(msg),
          onError: (err) => reject(err),
        });
      }),
    onSuccess: (data) => options.onSuccess?.(data),
    onError: (err) => options.onError?.(err),
  });
}
