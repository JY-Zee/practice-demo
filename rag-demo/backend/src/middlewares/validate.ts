/**
 * Zod 请求校验中间件
 *
 * 校验通过后将解析结果挂到 ctx.state.validated，供后续 handler 使用。
 */

import type { Context, Next } from 'koa';
import type { ZodSchema } from 'zod';

type ValidationTarget = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return async (ctx: Context, next: Next) => {
    const source =
      target === 'body'
        ? ctx.request.body
        : target === 'query'
          ? ctx.query
          : ctx.params;

    const result = schema.safeParse(source);
    if (!result.success) {
      ctx.status = 400;
      ctx.body = {
        error: {
          status: 400,
          message: '请求参数校验失败',
          details: result.error.flatten(),
        },
      };
      return;
    }

    ctx.state.validated = result.data;
    await next();
  };
}
