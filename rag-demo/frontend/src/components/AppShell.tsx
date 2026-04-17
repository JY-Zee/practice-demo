'use client';

/**
 * 应用外壳
 *
 * 顶部 Header 放导航菜单，内容区展示页面。
 * 纯 Client Component，便于读取 `usePathname` 高亮当前菜单。
 */

import { useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layout, Menu, Typography } from 'antd';
import {
  DatabaseOutlined,
  MessageOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons';

const { Header, Content } = Layout;

interface NavItem {
  key: string;
  label: ReactNode;
  match: (pathname: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    key: '/documents',
    label: (
      <Link href="/documents">
        <DatabaseOutlined /> 文档列表
      </Link>
    ),
    match: (p) => p === '/documents' || (p.startsWith('/documents') && !p.startsWith('/documents/upload')),
  },
  {
    key: '/documents/upload',
    label: (
      <Link href="/documents/upload">
        <CloudUploadOutlined /> 上传文档
      </Link>
    ),
    match: (p) => p.startsWith('/documents/upload'),
  },
  {
    key: '/chat',
    label: (
      <Link href="/chat">
        <MessageOutlined /> 知识问答
      </Link>
    ),
    match: (p) => p.startsWith('/chat'),
  },
];

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname() ?? '/';

  const selectedKey = useMemo(() => {
    const matched = NAV_ITEMS.find((item) => item.match(pathname));
    return matched ? [matched.key] : [];
  }, [pathname]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <Link href="/" style={{ marginRight: 32, textDecoration: 'none' }}>
          <Typography.Title level={4} style={{ margin: 0, color: '#2563eb' }}>
            RAG 知识库
          </Typography.Title>
        </Link>
        <Menu
          mode="horizontal"
          selectedKeys={selectedKey}
          items={NAV_ITEMS.map((item) => ({ key: item.key, label: item.label }))}
          style={{ flex: 1, borderBottom: 'none' }}
        />
      </Header>
      <Content style={{ padding: '24px', background: '#f5f7fa' }}>
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            background: '#fff',
            borderRadius: 8,
            padding: 24,
            minHeight: 'calc(100vh - 120px)',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
          }}
        >
          {children}
        </div>
      </Content>
    </Layout>
  );
}
