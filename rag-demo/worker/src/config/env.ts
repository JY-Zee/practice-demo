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

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }

  return value;
};

const embeddingApiKeySchema = z
  .string()
  .min(1, 'EMBEDDING_API_KEY 不能为空')
  .refine(
    (value) => value !== 'sk-your-embedding-api-key',
    'EMBEDDING_API_KEY 仍然是模板值，请替换为真实密钥',
  );

const embeddingApiBaseSchema = z.preprocess(
  emptyStringToUndefined,
  z
    .string({
      error:
        'EMBEDDING_API_BASE 不能为空，请填写你服务器可访问的 OpenAI 兼容网关地址',
    })
    .url('EMBEDDING_API_BASE 必须是合法 URL'),
);

const embeddingModelSchema = z.preprocess(
  emptyStringToUndefined,
  z.string({
    error:
      'EMBEDDING_MODEL 不能为空，请填写与兼容网关匹配的 embedding 模型名',
  }),
);

const embeddingDimensionSchema = z.preprocess(
  emptyStringToUndefined,
  z.coerce
    .number({
      error:
        'EMBEDDING_DIMENSION 不能为空，请填写当前 embedding 模型输出的向量维度',
    })
    .int()
    .positive('EMBEDDING_DIMENSION 必须是正整数'),
);

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

  EMBEDDING_API_KEY: embeddingApiKeySchema,
  EMBEDDING_API_BASE: embeddingApiBaseSchema,
  EMBEDDING_MODEL: embeddingModelSchema,
  EMBEDDING_DIMENSION: embeddingDimensionSchema,

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
