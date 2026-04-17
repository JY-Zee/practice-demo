import { QdrantClient } from '@qdrant/js-client-rest';

import { env } from '../config/env';

export const qdrantClient = new QdrantClient({
  host: env.QDRANT_HOST,
  port: env.QDRANT_HTTP_PORT,
});
