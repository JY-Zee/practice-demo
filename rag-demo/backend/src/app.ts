/**
 * RAG 知识库后端 — Koa 应用入口
 *
 * 职责：组装中间件、挂载路由、启动 HTTP 服务、优雅关闭。
 */

import Koa from 'koa';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import { koaSwagger } from 'koa2-swagger-ui';
import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';

import { env } from './config/env';
import { prisma } from './lib/prisma';
import { errorHandler } from './middlewares/errorHandler';
import { healthRouter } from './routers/health';
import { documentsRouter } from './routers/documents';
import { tasksRouter } from './routers/tasks';
import { chatRouter } from './routers/chat';

const app = new Koa();

// ---- 全局中间件 ----
app.use(errorHandler());
app.use(cors());
app.use(bodyParser({ jsonLimit: '10mb' }));

// ---- Swagger API 文档 ----
const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RAG 知识库系统 API',
      version: '0.1.0',
      description: '文档管理 · 摄取任务 · 知识库问答',
    },
    servers: [
      { url: `http://localhost:${env.BACKEND_PORT}`, description: '本地开发' },
    ],
  },
  apis: [path.resolve(__dirname, 'routers', '*.ts')],
});

// Swagger JSON 端点
app.use(async (ctx, next) => {
  if (ctx.path === '/api-docs/json') {
    ctx.body = swaggerSpec;
    return;
  }
  await next();
});

// Swagger UI
app.use(
  koaSwagger({
    routePrefix: '/api-docs',
    swaggerOptions: { spec: swaggerSpec as Record<string, unknown> },
  }),
);

// ---- 路由挂载 ----
app.use(healthRouter.routes()).use(healthRouter.allowedMethods());
app.use(documentsRouter.routes()).use(documentsRouter.allowedMethods());
app.use(tasksRouter.routes()).use(tasksRouter.allowedMethods());
app.use(chatRouter.routes()).use(chatRouter.allowedMethods());

// ---- 启动服务 ----
const server = app.listen(env.BACKEND_PORT, () => {
  console.log(`🚀 后端服务已启动: http://localhost:${env.BACKEND_PORT}`);
  console.log(`📖 API 文档: http://localhost:${env.BACKEND_PORT}/api-docs`);
});

// ---- Graceful Shutdown ----
const shutdown = async (signal: string) => {
  console.log(`\n${signal} 收到，开始优雅关闭...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log('✅ 服务已关闭');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('⚠️ 强制关闭（超时 10s）');
    process.exit(1);
  }, 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
