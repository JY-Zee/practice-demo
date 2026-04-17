import OpenAI from 'openai';

import { env } from '../config/env';

/** Embedding 专用客户端（SiliconFlow / DashScope 等） */
export const embeddingClient = new OpenAI({
  apiKey: env.EMBEDDING_API_KEY,
  baseURL: env.EMBEDDING_API_BASE,
});

/** LLM 问答专用客户端（OpenRouter / OpenAI 等） */
export const llmClient = new OpenAI({
  apiKey: env.LLM_API_KEY,
  baseURL: env.LLM_API_BASE,
  timeout: 60_000,
});
