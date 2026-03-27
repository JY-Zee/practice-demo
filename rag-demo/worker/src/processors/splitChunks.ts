/**
 * 第二步：文本切块
 *
 * 使用固定窗口 + 重叠策略生成块，结果写入 chunks.json。
 */

import path from 'path';

import type { Job } from 'bullmq';

import { env } from '../config/env';
import { readArtifactJson, writeArtifactJson } from '../lib/artifacts';
import { getSingleChildValue } from '../lib/flow';
import { markProcessingStep } from '../lib/ingestionState';
import type {
  ChunkRecord,
  IngestionJobPayload,
  ParsedDocumentArtifact,
  SplitChunksArtifact,
} from '../types/jobs';

function estimateTokenCount(content: string) {
  return Math.max(1, Math.ceil(content.length / 4));
}

function splitText(text: string) {
  const normalized = text.replace(/\n{3,}/g, '\n\n').trim();
  const chunks: string[] = [];

  if (!normalized) {
    return chunks;
  }

  let start = 0;

  while (start < normalized.length) {
    let end = Math.min(start + env.CHUNK_SIZE, normalized.length);

    if (end < normalized.length) {
      const lastBreak = normalized.lastIndexOf('\n', end);
      const lastSpace = normalized.lastIndexOf(' ', end);
      const boundary = Math.max(lastBreak, lastSpace);

      if (boundary > start + Math.floor(env.CHUNK_SIZE * 0.6)) {
        end = boundary;
      }
    }

    const content = normalized.slice(start, end).trim();

    if (content) {
      chunks.push(content);
    }

    if (end >= normalized.length) {
      break;
    }

    start = Math.max(end - env.CHUNK_OVERLAP, start + 1);
  }

  return chunks;
}

export async function splitChunks(
  job: Job<IngestionJobPayload, SplitChunksArtifact>,
) {
  await markProcessingStep(job.data, 'chunk');

  const parsedArtifact = await getSingleChildValue<ParsedDocumentArtifact>(job);
  const parsed = await readArtifactJson<{
    text: string;
    fileName: string;
  }>(parsedArtifact.parsedPath);

  const rawChunks = splitText(parsed.text);

  if (rawChunks.length === 0) {
    throw new Error(`文档切块结果为空: ${parsed.fileName}`);
  }

  const chunks: ChunkRecord[] = rawChunks.map((content, index) => ({
    chunkIndex: index,
    content,
    tokenCount: estimateTokenCount(content),
    metadataJson: {
      source_file_name: parsed.fileName,
      chunk_index: index,
      strategy: 'fixed-window-overlap',
      chunk_size: env.CHUNK_SIZE,
      chunk_overlap: env.CHUNK_OVERLAP,
    },
  }));

  const chunksPath = path.join(parsedArtifact.artifactDir, 'chunks.json');
  await writeArtifactJson(chunksPath, {
    taskId: job.data.taskId,
    documentId: job.data.documentId,
    fileName: parsed.fileName,
    chunks,
  });

  return {
    taskId: job.data.taskId,
    documentId: job.data.documentId,
    artifactDir: parsedArtifact.artifactDir,
    chunksPath,
    chunkCount: chunks.length,
    fileName: parsed.fileName,
  };
}
