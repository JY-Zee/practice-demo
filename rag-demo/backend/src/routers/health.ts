/**
 * 健康检查路由
 */

import Router from '@koa/router';
import { prisma } from '../lib/prisma';

const router = new Router({ prefix: '/api' });

/**
 * @openapi
 * /api/health:
 *   get:
 *     tags: [健康检查]
 *     summary: 服务健康检查
 *     description: 检查后端服务与数据库连接是否正常
 *     responses:
 *       200:
 *         description: 服务健康
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 database:
 *                   type: string
 *                   example: connected
 */
router.get('/health', async (ctx) => {
  let dbStatus = 'connected';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'disconnected';
  }

  ctx.body = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbStatus,
  };
});

export { router as healthRouter };
