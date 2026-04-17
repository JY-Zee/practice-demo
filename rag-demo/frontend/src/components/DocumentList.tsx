'use client';

/**
 * 文档列表组件
 *
 * - 用 `useDocuments` 查询分页数据，并在存在 pending/processing 时自动 3s 轮询
 * - AntD Table 展示基础元数据与状态 Tag
 * - 顶部操作：刷新 / 跳转上传页
 */

import { useState } from 'react';
import Link from 'next/link';
import dayjs from 'dayjs';
import {
  Table,
  Tag,
  Space,
  Button,
  Typography,
  Alert,
  Empty,
  Tooltip,
} from 'antd';
import { CloudUploadOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useDocuments } from '@/hooks/useDocuments';
import { DOCUMENT_STATUS_META } from '@/constants/status';
import type { DocumentResponse, DocumentStatus } from '@/types/api';
import { ApiError } from '@/lib/apiClient';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const columns: ColumnsType<DocumentResponse> = [
  {
    title: '文件名',
    dataIndex: 'fileName',
    key: 'fileName',
    render: (name: string) => (
      <Tooltip title={name} placement="topLeft">
        <span>{name}</span>
      </Tooltip>
    ),
    ellipsis: true,
  },
  {
    title: '类型',
    dataIndex: 'fileType',
    key: 'fileType',
    width: 90,
    render: (t: string) => t?.toUpperCase() || '-',
  },
  {
    title: '大小',
    dataIndex: 'fileSize',
    key: 'fileSize',
    width: 110,
    render: (v: number) => formatFileSize(v),
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    render: (s: DocumentStatus) => {
      const meta = DOCUMENT_STATUS_META[s];
      return <Tag color={meta.color}>{meta.label}</Tag>;
    },
  },
  {
    title: 'Chunks',
    dataIndex: 'chunkCount',
    key: 'chunkCount',
    width: 90,
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 170,
    render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    title: '最近更新',
    dataIndex: 'updatedAt',
    key: 'updatedAt',
    width: 170,
    render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm:ss'),
  },
];

export default function DocumentList() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading, isFetching, error, refetch } = useDocuments({ page, pageSize });

  const errorMessage = error
    ? error instanceof ApiError
      ? error.message
      : '加载文档列表失败，请检查后端服务是否已启动'
    : null;

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          文档列表
        </Typography.Title>
        <Space>
          <Button icon={<ReloadOutlined />} loading={isFetching} onClick={() => refetch()}>
            刷新
          </Button>
          <Link href="/documents/upload">
            <Button type="primary" icon={<CloudUploadOutlined />}>
              上传文档
            </Button>
          </Link>
        </Space>
      </Space>

      {errorMessage && <Alert type="error" showIcon message={errorMessage} />}

      <Table<DocumentResponse>
        rowKey="id"
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
        locale={{
          emptyText: <Empty description="暂无文档，先去上传一个吧" />,
        }}
        pagination={{
          current: data?.page ?? page,
          pageSize: data?.pageSize ?? pageSize,
          total: data?.total ?? 0,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (total) => `共 ${total} 条`,
          onChange: (nextPage, nextPageSize) => {
            setPage(nextPage);
            setPageSize(nextPageSize);
          },
        }}
      />
    </Space>
  );
}
