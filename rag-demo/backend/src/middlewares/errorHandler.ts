/**
 * 全局错误处理中间件
 *
 * 捕获所有下游中间件和路由抛出的异常，统一返回 JSON 格式错误响应。
 */

import type { Context, Next } from 'koa';

interface AppError extends Error {
  status?: number;
  statusCode?: number;
}

export function errorHandler() {
  return async (ctx: Context, next: Next) => {
    try {
      await next();
    } catch (err) {
      const error = err as AppError;
      const status = error.status ?? error.statusCode ?? 500;
      const message = error.message || '服务器内部错误';

      ctx.status = status;
      ctx.body = {
        error: {
          status,
          message,
          ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
        },
      };

      if (status >= 500) {
        console.error('[ERROR]', error);
      }
    }
  };
}
