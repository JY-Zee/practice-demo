/**
 * 第三步：为切块生成向量
 */

import path from 'path';

import type { Job } from 'bullmq';

import { env } from '../config/env';
import { readArtifactJson, writeArtifactJson } from '../lib/artifacts';
import {
  assertEmbeddingDimensions,
  buildEmbeddingRequest,
  formatEmbeddingError,
} from '../lib/embedding';
import { getSingleChildValue } from '../lib/flow';
import { markProcessingStep } from '../lib/ingestionState';
import { openaiClient } from '../lib/openai';
import type {
  ChunkRecord,
  EmbeddedChunk,
  EmbeddedChunksArtifact,
  IngestionJobPayload,
  SplitChunksArtifact,
} from '../types/jobs';

async function createEmbeddings(chunks: ChunkRecord[]) {
  const embeddedChunks: EmbeddedChunk[] = [];

  for (let index = 0; index < chunks.length; index += env.EMBEDDING_BATCH_SIZE) {
    const batch = chunks.slice(index, index + env.EMBEDDING_BATCH_SIZE);
    let response;

    try {
      response = await openaiClient.embeddings.create(
        buildEmbeddingRequest({
          model: env.EMBEDDING_MODEL,
          input: batch.map((chunk) => chunk.content),
        }),
      );
    } catch (error) {
      throw formatEmbeddingError(error, {
        apiBase: env.EMBEDDING_API_BASE,
        model: env.EMBEDDING_MODEL,
      });
    }

    assertEmbeddingDimensions(
      response.data.map((item) => item.embedding),
      env.EMBEDDING_DIMENSION,
    );

    response.data.forEach((item, batchIndex) => {
      const chunk = batch[batchIndex];
      embeddedChunks.push({
        ...chunk,
        pointId: '',
        embedding: item.embedding,
      });
    });
  }

  return embeddedChunks;
}

export async function embedChunks(
  job: Job<IngestionJobPayload, EmbeddedChunksArtifact>,
) {
  await markProcessingStep(job.data, 'embed');

  const splitArtifact = await getSingleChildValue<SplitChunksArtifact>(job);
  const chunkArtifact = await readArtifactJson<{
    fileName: string;
    chunks: ChunkRecord[];
  }>(splitArtifact.chunksPath);

  if (chunkArtifact.chunks.length === 0) {
    throw new Error(`没有可用于生成向量的切块: ${chunkArtifact.fileName}`);
  }

  const embeddedChunks = await createEmbeddings(chunkArtifact.chunks);
  const documentId = job.data.documentId;

  const payload: EmbeddedChunk[] = embeddedChunks.map((chunk) => ({
    ...chunk,
    pointId: `${documentId}:${chunk.chunkIndex}`,
  }));

  const embeddingsPath = path.join(splitArtifact.artifactDir, 'embeddings.json');
  await writeArtifactJson(embeddingsPath, {
    taskId: job.data.taskId,
    documentId,
    fileName: chunkArtifact.fileName,
    chunks: payload,
  });

  return {
    taskId: job.data.taskId,
    documentId,
    artifactDir: splitArtifact.artifactDir,
    embeddingsPath,
    chunkCount: payload.length,
    fileName: chunkArtifact.fileName,
  };
}
