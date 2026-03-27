import OpenAI from 'openai';

import { env } from '../config/env';

export const openaiClient = new OpenAI({
  apiKey: env.EMBEDDING_API_KEY,
  baseURL: env.EMBEDDING_API_BASE,
});
