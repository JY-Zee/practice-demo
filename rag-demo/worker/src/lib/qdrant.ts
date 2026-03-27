import { QdrantClient } from '@qdrant/js-client-rest';

import { env } from '../config/env';

export const qdrantClient = new QdrantClient({
  host: env.QDRANT_HOST,
  port: env.QDRANT_HTTP_PORT,
});

interface QdrantVectorParams {
  size: number;
  distance?: string;
}

interface QdrantCollectionInfo {
  config?: {
    params?: {
      vectors?: QdrantVectorParams | Record<string, QdrantVectorParams>;
    };
  };
}

interface AssertCollectionParams {
  collectionName: string;
  expectedDimension: number;
}

interface BuildQdrantChunkPayloadParams {
  documentId: string;
  fileName: string;
  pointId: string;
  chunkIndex: number;
  content: string;
  tokenCount: number;
  metadataJson: Record<string, unknown>;
}

interface QdrantOperationContext {
  action: 'delete' | 'upsert' | 'query';
  collectionName: string;
}

function isAnonymousVectorConfig(
  vectors: QdrantCollectionInfo['config'] extends infer C
    ? C extends { params?: { vectors?: infer V } }
      ? V
      : never
    : never,
): vectors is QdrantVectorParams {
  return (
    typeof vectors === 'object' &&
    vectors !== null &&
    'size' in vectors &&
    typeof vectors.size === 'number'
  );
}

function toSnakeCaseKey(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

function normalizePayloadMetadata(metadataJson: Record<string, unknown>) {
  return Object.entries(metadataJson).reduce<Record<string, unknown>>(
    (result, [key, value]) => {
      result[toSnakeCaseKey(key)] = value;
      return result;
    },
    {},
  );
}

function getQdrantBaseUrl() {
  return `http://${env.QDRANT_HOST}:${env.QDRANT_HTTP_PORT}`;
}

function getErrorStatus(error: unknown) {
  if (typeof error !== 'object' || error === null) {
    return null;
  }

  if ('status' in error && typeof error.status === 'number') {
    return error.status;
  }

  const response = 'response' in error ? error.response : null;
  if (
    typeof response === 'object' &&
    response !== null &&
    'status' in response &&
    typeof response.status === 'number'
  ) {
    return response.status;
  }

  return null;
}

function getErrorDetail(error: unknown) {
  if (typeof error !== 'object' || error === null) {
    return error instanceof Error ? error.message : String(error);
  }

  if ('data' in error && error.data !== undefined) {
    try {
      return JSON.stringify(error.data);
    } catch {
      return String(error.data);
    }
  }

  if ('response' in error && typeof error.response === 'object' && error.response !== null) {
    const responseData =
      'data' in error.response ? (error.response as { data?: unknown }).data : undefined;
    if (responseData !== undefined) {
      try {
        return JSON.stringify(responseData);
      } catch {
        return String(responseData);
      }
    }
  }

  if ('message' in error && typeof error.message === 'string') {
    return error.message;
  }

  return JSON.stringify(error);
}

async function fetchCollectionInfo(collectionName: string) {
  const url = `${getQdrantBaseUrl()}/collections/${encodeURIComponent(collectionName)}`;
  const response = await fetch(url);

  if (response.status === 404) {
    throw new Error(
      `Qdrant 集合 ${collectionName} 不存在。请先运行 scripts/init_qdrant.py 初始化集合。`,
    );
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `读取 Qdrant 集合 ${collectionName} 配置失败：HTTP ${response.status} ${body}`.trim(),
    );
  }

  const data = (await response.json()) as { result?: QdrantCollectionInfo };
  return data.result ?? {};
}

export function buildQdrantChunkPayload({
  documentId,
  fileName,
  pointId,
  chunkIndex,
  content,
  tokenCount,
  metadataJson,
}: BuildQdrantChunkPayloadParams) {
  return {
    document_id: documentId,
    file_name: fileName,
    chunk_id: pointId,
    chunk_index: chunkIndex,
    text: content,
    token_count: tokenCount,
    ...normalizePayloadMetadata(metadataJson),
  };
}

export function assertAnonymousVectorCollection(
  collectionInfo: QdrantCollectionInfo,
  { collectionName, expectedDimension }: AssertCollectionParams,
) {
  const vectors = collectionInfo.config?.params?.vectors;

  if (!vectors) {
    throw new Error(
      `Qdrant 集合 ${collectionName} 缺少 vectors 配置，无法确认是否兼容当前 worker。`,
    );
  }

  if (!isAnonymousVectorConfig(vectors)) {
    const vectorNames = Object.keys(vectors);
    throw new Error(
      `Qdrant 集合 ${collectionName} 当前使用 named vector 配置（${vectorNames.join(', ')}），` +
        '但 worker 发送的是匿名单向量 vector。请重建集合或同步修改写入格式。',
    );
  }

  if (vectors.size !== expectedDimension) {
    throw new Error(
      `Qdrant 集合 ${collectionName} 与当前 embedding 配置不一致：` +
        `当前集合维度为 ${vectors.size}，但 EMBEDDING_DIMENSION=${expectedDimension}。` +
        '请重建集合，或把 .env 中的 EMBEDDING_DIMENSION 改回与现有集合一致的值。',
    );
  }
}

export async function ensureQdrantCollectionCompatibility(
  collectionName: string,
  expectedDimension: number,
) {
  const collectionInfo = await fetchCollectionInfo(collectionName);
  assertAnonymousVectorCollection(collectionInfo, {
    collectionName,
    expectedDimension,
  });
}

export function formatQdrantOperationError(
  error: unknown,
  { action, collectionName }: QdrantOperationContext,
) {
  const status = getErrorStatus(error);
  const detail = getErrorDetail(error);
  const statusText = status == null ? '' : `（HTTP ${status}）`;

  return new Error(
    `Qdrant ${action} 失败${statusText} collection=${collectionName}：${detail}`,
    { cause: error instanceof Error ? error : undefined },
  );
}
