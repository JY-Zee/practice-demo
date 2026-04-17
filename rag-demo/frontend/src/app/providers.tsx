'use client';

/**
 * 全局 Provider
 *
 * - AntdRegistry：官方 App Router 适配器，避免 SSR CSS 闪烁。
 * - ConfigProvider：中文 locale + 主题 token。
 * - QueryClientProvider：React Query 全局客户端；用 `useState` 保证在 Client 端只创建一次。
 */

import { useState, type ReactNode } from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createQueryClient } from '@/lib/queryClient';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <AntdRegistry>
      <ConfigProvider
        locale={zhCN}
        theme={{
          token: {
            colorPrimary: '#2563eb',
            borderRadius: 6,
          },
        }}
      >
        <AntdApp>
          <QueryClientProvider client={queryClient}>
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryClientProvider>
        </AntdApp>
      </ConfigProvider>
    </AntdRegistry>
  );
}
