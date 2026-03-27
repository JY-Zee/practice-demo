/**
 * 第一步：解析文档为纯文本
 *
 * 当前支持 txt / md / pdf，解析结果会写入中间产物文件，供下游切块步骤读取。
 */

import fs from 'fs/promises';
import path from 'path';

import type { Job } from 'bullmq';

import { ensureArtifactDir, writeArtifactJson } from '../lib/artifacts';
import { markProcessingStep } from '../lib/ingestionState';
import { prisma } from '../lib/prisma';
import type { IngestionJobPayload, ParsedDocumentArtifact } from '../types/jobs';

const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text?: string }>;

function normalizeText(text: string) {
  return text.replace(/\r\n/g, '\n').replace(/\u0000/g, '').trim();
}

async function extractText(storagePath: string, fileType: string) {
  const fileBuffer = await fs.readFile(storagePath);

  if (fileType === 'pdf') {
    const pdfResult = await pdfParse(fileBuffer);
    return normalizeText(pdfResult.text ?? '');
  }

  return normalizeText(fileBuffer.toString('utf8'));
}

export async function parseDocument(
  job: Job<IngestionJobPayload, ParsedDocumentArtifact>,
) {
  const { taskId, documentId } = job.data;
  await markProcessingStep(job.data, 'parse');

  const task = await prisma.ingestionTask.findUnique({
    where: { id: taskId },
    include: { document: true },
  });

  if (!task || task.documentId !== documentId) {
    throw new Error(`未找到摄取任务或任务与文档不匹配: taskId=${taskId}`);
  }

  const { document } = task;
  const storagePath = path.normalize(document.storagePath);
  const text = await extractText(storagePath, document.fileType.toLowerCase());

  if (!text) {
    throw new Error(`文档解析结果为空: ${document.fileName}`);
  }

  const artifactDir = await ensureArtifactDir(taskId);
  const parsedPath = path.join(artifactDir, 'parsed.json');

  await writeArtifactJson(parsedPath, {
    taskId,
    documentId,
    fileName: document.fileName,
    fileType: document.fileType,
    storagePath,
    text,
  });

  return {
    taskId,
    documentId,
    artifactDir,
    parsedPath,
    fileName: document.fileName,
    fileType: document.fileType,
    storagePath,
    textLength: text.length,
  };
}
