import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertAnonymousVectorCollection,
  buildQdrantChunkPayload,
  formatQdrantOperationError,
} from './qdrant';

test('buildQdrantChunkPayload 会生成统一的 snake_case payload', () => {
  const payload = buildQdrantChunkPayload({
    documentId: 'doc-1',
    fileName: 'README.md',
    pointId: 'doc-1:0',
    chunkIndex: 0,
    content: 'hello qdrant',
    tokenCount: 3,
    metadataJson: {
      sourceFileName: 'README.md',
      chunkSize: 1000,
      chunkOverlap: 200,
    },
  });

  assert.deepEqual(payload, {
    document_id: 'doc-1',
    file_name: 'README.md',
    chunk_id: 'doc-1:0',
    chunk_index: 0,
    text: 'hello qdrant',
    token_count: 3,
    source_file_name: 'README.md',
    chunk_size: 1000,
    chunk_overlap: 200,
  });
});

test('assertAnonymousVectorCollection 在维度匹配时通过', () => {
  assert.doesNotThrow(() =>
    assertAnonymousVectorCollection(
      {
        config: {
          params: {
            vectors: {
              size: 2560,
              distance: 'Cosine',
            },
          },
        },
      },
      {
        collectionName: 'kb_documents',
        expectedDimension: 2560,
      },
    ),
  );
});

test('assertAnonymousVectorCollection 在维度不匹配时抛出可读错误', () => {
  assert.throws(
    () =>
      assertAnonymousVectorCollection(
        {
          config: {
            params: {
              vectors: {
                size: 1536,
                distance: 'Cosine',
              },
            },
          },
        },
        {
          collectionName: 'kb_documents',
          expectedDimension: 2560,
        },
      ),
    /当前集合维度为 1536.*EMBEDDING_DIMENSION=2560/,
  );
});

test('assertAnonymousVectorCollection 在遇到 named vectors 时抛出明确提示', () => {
  assert.throws(
    () =>
      assertAnonymousVectorCollection(
        {
          config: {
            params: {
              vectors: {
                default: {
                  size: 2560,
                  distance: 'Cosine',
                },
              },
            },
          },
        },
        {
          collectionName: 'kb_documents',
          expectedDimension: 2560,
        },
      ),
    /named vector.*default/,
  );
});

test('formatQdrantOperationError 会带出状态码和服务端返回体', () => {
  const error = formatQdrantOperationError(
    {
      status: 400,
      data: {
        status: {
          error: 'Wrong input: Vector dimension error: expected dim: 1536, got 2560',
        },
      },
      message: 'Bad Request',
    },
    {
      action: 'upsert',
      collectionName: 'kb_documents',
    },
  );

  assert.match(error.message, /Qdrant upsert 失败/);
  assert.match(error.message, /400/);
  assert.match(error.message, /expected dim: 1536, got 2560/);
});
