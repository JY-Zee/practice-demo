/**
 * 语义检索
 *
 * 真实实现：question → Embedding → Qdrant TopK → RetrievedContext[]
 */

import { embeddingClient } from '../lib/openai';
import { qdrantClient } from '../lib/qdrant';
import { env } from '../config/env';
import type { RetrievedContext } from './types';

export interface RetrieveParams {
  question: string;
  topK: number;
}

export async function retrieveContexts({
  question,
  topK,
}: RetrieveParams): Promise<RetrievedContext[]> {
  let embeddingResponse;
  try {
    embeddingResponse = await embeddingClient.embeddings.create({
      model: env.EMBEDDING_MODEL,
      input: question,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Embedding 调用失败（${env.EMBEDDING_API_BASE}，model=${env.EMBEDDING_MODEL}）：${message}`,
      { cause: error instanceof Error ? error : undefined },
    );
  }

  const embedding = embeddingResponse.data[0]?.embedding;
  if (!embedding) {
    throw new Error(
      `Embedding 调用未返回有效向量。请检查 EMBEDDING_API_BASE=${env.EMBEDDING_API_BASE} 与 EMBEDDING_MODEL=${env.EMBEDDING_MODEL} 是否配置正确。`,
    );
  }

  if (embedding.length !== env.EMBEDDING_DIMENSION) {
    throw new Error(
      `Embedding 维度不匹配：实际返回 ${embedding.length} 维，但 EMBEDDING_DIMENSION=${env.EMBEDDING_DIMENSION}。请检查 .env 中的模型维度配置是否与 Qdrant 集合一致。`,
    );
  }

  console.info('[retriever] search start', {
    questionLen: question.length,
    topK,
  });

  let searchResult;
  try {
    searchResult = await qdrantClient.search(env.QDRANT_COLLECTION, {
      vector: embedding,
      limit: topK,
      with_payload: true,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Qdrant query 失败 collection=${env.QDRANT_COLLECTION}：${detail}`,
      { cause: error instanceof Error ? error : undefined },
    );
  }

  console.info('[retriever] search done', {
    hits: searchResult.length,
    topScore: searchResult[0]?.score ?? null,
  });

  return searchResult.map((point) => {
    const payload = point.payload ?? {};
    return {
      documentId: String(payload.document_id ?? ''),
      documentName: String(payload.file_name ?? ''),
      chunkId: String(payload.chunk_id ?? point.id ?? ''),
      chunkIndex: Number(payload.chunk_index ?? 0),
      content: String(payload.text ?? ''),
      score: point.score,
    };
  });
}
