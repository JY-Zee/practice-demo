/**
 * 第四步：写入 PostgreSQL 与 Qdrant
 */

import type { Prisma } from '@prisma/client';
import type { Job } from 'bullmq';

import { env } from '../config/env';
import { readArtifactJson } from '../lib/artifacts';
import { getSingleChildValue } from '../lib/flow';
import { markProcessingStep } from '../lib/ingestionState';
import { prisma } from '../lib/prisma';
import {
  buildQdrantChunkPayload,
  ensureQdrantCollectionCompatibility,
  formatQdrantOperationError,
  qdrantClient,
} from '../lib/qdrant';
import type {
  EmbeddedChunk,
  EmbeddedChunksArtifact,
  IngestionJobPayload,
  UpsertedVectorsArtifact,
} from '../types/jobs';

export async function upsertVectors(
  job: Job<IngestionJobPayload, UpsertedVectorsArtifact>,
) {
  await markProcessingStep(job.data, 'upsert');
  await ensureQdrantCollectionCompatibility(
    env.QDRANT_COLLECTION,
    env.EMBEDDING_DIMENSION,
  );

  const embeddedArtifact = await getSingleChildValue<EmbeddedChunksArtifact>(job);
  const embeddingPayload = await readArtifactJson<{
    fileName: string;
    chunks: EmbeddedChunk[];
  }>(embeddedArtifact.embeddingsPath);

  const { documentId } = job.data;
  try {
    await qdrantClient.delete(env.QDRANT_COLLECTION, {
      wait: true,
      filter: {
        must: [{ key: 'document_id', match: { value: documentId } }],
      },
    } as any);
  } catch (error) {
    throw formatQdrantOperationError(error, {
      action: 'delete',
      collectionName: env.QDRANT_COLLECTION,
    });
  }

  await prisma.$transaction([
    prisma.documentChunk.deleteMany({ where: { documentId } }),
    prisma.documentChunk.createMany({
      data: embeddingPayload.chunks.map((chunk) => ({
        documentId,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        tokenCount: chunk.tokenCount,
        metadataJson: chunk.metadataJson as Prisma.InputJsonValue,
      })),
    }),
    prisma.document.update({
      where: { id: documentId },
      data: {
        chunkCount: embeddingPayload.chunks.length,
      },
    }),
  ]);

  try {
    await qdrantClient.upsert(env.QDRANT_COLLECTION, {
      wait: true,
      points: embeddingPayload.chunks.map((chunk) => ({
        id: chunk.pointId,
        vector: chunk.embedding,
        payload: buildQdrantChunkPayload({
          documentId,
          fileName: embeddingPayload.fileName,
          pointId: chunk.pointId,
          chunkIndex: chunk.chunkIndex,
          content: chunk.content,
          tokenCount: chunk.tokenCount,
          metadataJson: chunk.metadataJson,
        }),
      })),
    } as any);
  } catch (error) {
    throw formatQdrantOperationError(error, {
      action: 'upsert',
      collectionName: env.QDRANT_COLLECTION,
    });
  }

  return {
    taskId: job.data.taskId,
    documentId,
    artifactDir: embeddedArtifact.artifactDir,
    vectorCount: embeddingPayload.chunks.length,
    fileName: embeddingPayload.fileName,
  };
}
