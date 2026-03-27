/**
 * Worker 环境变量配置
 *
 * 优先读取运行时注入的环境变量；本地开发时会尝试从 rag-demo 根目录加载 .env。
 */

import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

const envCandidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env'),
  path.resolve(__dirname, '../../../.env'),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    config({ path: envPath, override: false });
    break;
  }
}

const envSchema = z.object({
  POSTGRES_USER: z.string().default('kb_user'),
  POSTGRES_PASSWORD: z.string().default('kb_password'),
  POSTGRES_DB: z.string().default('kb_db'),
  POSTGRES_HOST: z.string().default('localhost'),
  POSTGRES_PORT: z.coerce.number().int().default(5432),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().default(6379),

  QDRANT_HOST: z.string().default('localhost'),
  QDRANT_HTTP_PORT: z.coerce.number().int().default(6333),
  QDRANT_COLLECTION: z.string().default('kb_documents'),

  EMBEDDING_API_KEY: z.string().min(1, 'EMBEDDING_API_KEY 不能为空'),
  EMBEDDING_API_BASE: z.string().url().default('https://api.openai.com/v1'),
  EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
  EMBEDDING_DIMENSION: z.coerce.number().int().positive().default(1536),

  UPLOAD_DIR: z.string().default('/app/uploads'),
  INGESTION_QUEUE_PREFIX: z.string().default('rag-kb'),
  CHUNK_SIZE: z.coerce.number().int().min(200).default(1000),
  CHUNK_OVERLAP: z.coerce.number().int().min(0).default(200),
  EMBEDDING_BATCH_SIZE: z.coerce.number().int().min(1).max(100).default(20),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Worker 环境变量校验失败：');
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;

export const DATABASE_URL =
  `postgresql://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}` +
  `@${env.POSTGRES_HOST}:${env.POSTGRES_PORT}/${env.POSTGRES_DB}?schema=public`;

export function resolveUploadDir() {
  return path.isAbsolute(env.UPLOAD_DIR)
    ? env.UPLOAD_DIR
    : path.resolve(process.cwd(), env.UPLOAD_DIR);
}
