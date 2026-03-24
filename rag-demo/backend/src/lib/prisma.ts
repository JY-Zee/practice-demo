import { PrismaClient } from '@prisma/client';

import { DATABASE_URL } from '../config/env';

// Prisma 客户端只认 process.env.DATABASE_URL（见 schema.prisma），与 env.ts 中拼接的连接串对齐
process.env.DATABASE_URL ??= DATABASE_URL;

export const prisma = new PrismaClient();
