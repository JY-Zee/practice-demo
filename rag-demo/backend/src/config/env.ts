/**
 * 环境变量配置管理
 *
 * 使用 dotenv 加载 .env 文件，通过 Zod 进行类型校验与默认值设置。
 * 所有模块统一从此处导入配置，避免散落的 process.env 访问。
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { z } from 'zod';

// 加载项目根目录的 .env（backend 上一层即 rag-demo 根目录）
config({ path: resolve(__dirname, '../../../.env') });

/** 环境变量 Schema：定义所有配置项的类型、默认值和校验规则 */
const envSchema = z.object({
  // ---------- PostgreSQL ----------
  POSTGRES_USER: z.string().default('kb_user'),
  POSTGRES_PASSWORD: z.string().default('kb_password'),
  POSTGRES_DB: z.string().default('kb_db'),
  POSTGRES_HOST: z.string().default('localhost'),
  POSTGRES_PORT: z.coerce.number().int().default(5432),

  // ---------- Redis ----------
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().default(6379),
  REDIS_URL: z.string().url().default('redis://localhost:6379/0'),

  // ---------- Qdrant ----------
  QDRANT_HOST: z.string().default('localhost'),
  QDRANT_HTTP_PORT: z.coerce.number().int().default(6333),
  QDRANT_GRPC_PORT: z.coerce.number().int().default(6334),
  QDRANT_COLLECTION: z.string().default('kb_documents'),

  // ---------- Embedding ----------
  EMBEDDING_API_KEY: z.string().min(1, 'EMBEDDING_API_KEY 不能为空'),
  EMBEDDING_API_BASE: z.string().url().default('https://api.openai.com/v1'),
  EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
  EMBEDDING_DIMENSION: z.coerce.number().int().default(1536),

  // ---------- LLM ----------
  LLM_API_KEY: z.string().min(1, 'LLM_API_KEY 不能为空'),
  LLM_API_BASE: z.string().url().default('https://api.openai.com/v1'),
  LLM_MODEL: z.string().default('gpt-4o-mini'),

  // ---------- 文件存储 ----------
  UPLOAD_DIR: z.string().default('/app/uploads'),

  // ---------- 后端服务 ----------
  BACKEND_HOST: z.string().default('0.0.0.0'),
  BACKEND_PORT: z.coerce.number().int().default(8000),
});

/** 校验并导出类型安全的环境变量对象 */
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ 环境变量校验失败：');
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;

/** Prisma 所需的 DATABASE_URL，按各字段拼接而成 */
export const DATABASE_URL =
  `postgresql://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}` +
  `@${env.POSTGRES_HOST}:${env.POSTGRES_PORT}/${env.POSTGRES_DB}?schema=public`;

export type Env = z.infer<typeof envSchema>;
