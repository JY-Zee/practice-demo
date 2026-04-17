/**
 * 重排序（Rerank）
 *
 * 预留位：后续可接入 Cross-Encoder / BGE Reranker 等做精排。
 * 第一版直通，保留接口便于后续替换。
 */

import type { RetrievedContext } from './types';

export async function rerankContexts(
  _question: string,
  contexts: RetrievedContext[],
): Promise<RetrievedContext[]> {
  return contexts;
}
