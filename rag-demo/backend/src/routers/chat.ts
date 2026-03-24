/**
 * 问答路由
 *
 * - POST /api/chat/ask        提问（当前 mock 实现）
 * - GET  /api/chat/messages    查询会话历史
 */

import Router from '@koa/router';
import { validate } from '../middlewares/validate';
import { AskQuestionSchema, ListChatMessagesSchema } from '../schemas/chat';
import * as chatService from '../services/chatService';

const router = new Router({ prefix: '/api/chat' });

/**
 * @openapi
 * /api/chat/ask:
 *   post:
 *     tags: [知识问答]
 *     summary: 提问（当前为 mock 回答）
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question]
 *             properties:
 *               question:
 *                 type: string
 *                 maxLength: 2000
 *               sessionId:
 *                 type: string
 *                 description: 不传则自动生成新会话
 *     responses:
 *       200:
 *         description: 回答结果
 */
router.post('/ask', validate(AskQuestionSchema, 'body'), async (ctx) => {
  const input = ctx.state.validated;
  const result = await chatService.askQuestion(input);
  ctx.body = result;
});

/**
 * @openapi
 * /api/chat/messages:
 *   get:
 *     tags: [知识问答]
 *     summary: 查询会话历史
 *     parameters:
 *       - in: query
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: 消息列表
 */
router.get('/messages', validate(ListChatMessagesSchema, 'query'), async (ctx) => {
  const query = ctx.state.validated;
  const result = await chatService.listMessages(query);
  ctx.body = result;
});

export { router as chatRouter };
