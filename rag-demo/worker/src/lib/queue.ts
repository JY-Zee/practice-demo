import { env } from '../config/env';

export const QUEUE_NAMES = {
  ingestion: 'document-ingestion',
  parse: 'document-parse',
  split: 'document-split',
  embed: 'document-embed',
  upsert: 'document-upsert',
  complete: 'document-complete',
} as const;

export const bullmqConnection = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
};

export const bullmqPrefix = env.INGESTION_QUEUE_PREFIX;
