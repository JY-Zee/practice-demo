/**
 * 通用 HTTP 请求封装
 *
 * - 所有请求都走相对路径，经 `next.config.ts` rewrites 代理到后端。
 * - 统一解析 JSON、提取后端 `error.message`、抛出 `ApiError`。
 * - 不引入 axios，保持零额外依赖。
 */

import type { ApiErrorPayload } from '@/types/api';

export class ApiError extends Error {
  status: number;
  payload?: ApiErrorPayload;

  constructor(message: string, status: number, payload?: ApiErrorPayload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export type QueryValue = string | number | boolean | undefined | null;

interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** JSON body，自动 stringify 并设置 Content-Type */
  json?: unknown;
  /** FormData body，不要手动设置 Content-Type（让浏览器带 boundary） */
  formData?: FormData;
  /** 查询参数，自动拼接到 URL（接受普通对象与 interface） */
  query?: object;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  if (!query) return path;

  const entries = Object.entries(query).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return path;

  const qs = new URLSearchParams(
    entries.map(([k, v]) => [k, String(v)] as [string, string]),
  ).toString();
  return `${path}${path.includes('?') ? '&' : '?'}${qs}`;
}

async function parseError(response: Response): Promise<never> {
  let payload: ApiErrorPayload | undefined;
  let message = `请求失败 (${response.status})`;
  try {
    payload = (await response.json()) as ApiErrorPayload;
    if (payload?.error?.message) message = payload.error.message;
  } catch {
    // 非 JSON 响应，保留默认 message
  }
  throw new ApiError(message, response.status, payload);
}

/** 通用请求函数 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { json, formData, query, headers, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(headers as Record<string, string> | undefined),
  };

  let body: BodyInit | undefined;
  if (json !== undefined) {
    finalHeaders['Content-Type'] = 'application/json';
    body = JSON.stringify(json);
  } else if (formData) {
    body = formData;
  }

  const response = await fetch(buildUrl(path, query), {
    ...rest,
    headers: finalHeaders,
    body,
  });

  if (!response.ok) {
    await parseError(response);
  }

  // 204 / 空响应
  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
