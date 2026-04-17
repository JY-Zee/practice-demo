/**
 * 问答流式消费封装
 *
 * 设计目标：
 * - 上层 UI 只关心 `onDelta(textChunk)` 与 `onDone(finalMessage)` 两个回调。
 * - 当前后端 `POST /api/chat/ask` 是一次性 JSON 返回，因此我们做"先请求再一次性派发"的降级方案。
 * - 后续若后端切到 `text/event-stream`，此处只需补充 SSE 解析逻辑，上层无感。
 */

import { request } from './apiClient';
import type { AskResult } from '@/types/api';

export interface AskStreamParams {
  question: string;
  sessionId?: string;
  signal?: AbortSignal;
  onDelta: (deltaText: string, fullText: string) => void;
  onDone: (message: AskResult) => void;
  onError?: (error: unknown) => void;
}

/**
 * 发起一次问答请求。
 *
 * 目前后端不支持 SSE，因此等后端返回后一次性把完整内容派发给 `onDelta` 一次，
 * 再调用 `onDone`。这样调用方可以沿用流式 UI 写法，未来无需改动。
 */
export async function askStream(params: AskStreamParams): Promise<void> {
  const { question, sessionId, signal, onDelta, onDone, onError } = params;

  try {
    const result = await request<AskResult>('/api/chat/ask', {
      method: 'POST',
      json: { question, sessionId },
      signal,
    });

    onDelta(result.content, result.content);
    onDone(result);
  } catch (error) {
    if (onError) onError(error);
    else throw error;
  }
}
