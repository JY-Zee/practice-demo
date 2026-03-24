/**
 * 摄取任务路由
 *
 * - GET /api/tasks/:id  查询任务详情
 */

import Router from '@koa/router';
import * as taskService from '../services/taskService';

const router = new Router({ prefix: '/api/tasks' });

/**
 * @openapi
 * /api/tasks/{id}:
 *   get:
 *     tags: [任务管理]
 *     summary: 查询摄取任务详情
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 任务详情
 *       404:
 *         description: 任务不存在
 */
router.get('/:id', async (ctx) => {
  const task = await taskService.getTaskById(ctx.params.id);
  if (!task) {
    ctx.status = 404;
    ctx.body = { error: { status: 404, message: '任务不存在' } };
    return;
  }
  ctx.body = task;
});

export { router as tasksRouter };
