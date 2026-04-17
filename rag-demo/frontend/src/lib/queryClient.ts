/**
 * React Query 默认配置
 *
 * - `staleTime`: 10 秒，避免组件 remount 时反复请求。
 * - `retry`: 失败仅重试 1 次，便于及时暴露后端异常。
 * - `refetchOnWindowFocus`: 关闭，学习版不需要。
 */

import { QueryClient } from '@tanstack/react-query';

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
