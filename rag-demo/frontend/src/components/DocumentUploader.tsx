'use client';

/**
 * 文档上传组件
 *
 * 使用 AntD `Upload.Dragger` 的"受控 beforeUpload"写法：
 * - 阻止默认上传行为（`return false`），自己走 `useUploadDocument` mutation
 * - 只支持 .txt / .md / .pdf，单文件 ≤ 50MB（与后端 multer 限制一致）
 * - 上传结束后展示结果卡片，提供跳转文档列表的入口
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Button,
  Typography,
  Alert,
  Space,
  Descriptions,
  App,
} from 'antd';
import { InboxOutlined, FileTextOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useUploadDocument } from '@/hooks/useUploadDocument';
import type { UploadDocumentResult } from '@/types/api';
import { ApiError } from '@/lib/apiClient';

const ACCEPTED_EXT = ['.txt', '.md', '.pdf'];
const MAX_BYTES = 50 * 1024 * 1024;

export default function DocumentUploader() {
  const router = useRouter();
  const { message } = App.useApp();
  const [result, setResult] = useState<UploadDocumentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadMutation = useUploadDocument();

  const handleBeforeUpload: UploadProps['beforeUpload'] = (file) => {
    setError(null);

    const name = file.name.toLowerCase();
    const ok = ACCEPTED_EXT.some((ext) => name.endsWith(ext));
    if (!ok) {
      message.error(`仅支持 ${ACCEPTED_EXT.join(' / ')} 文件`);
      return Upload.LIST_IGNORE;
    }
    if (file.size > MAX_BYTES) {
      message.error('文件超过 50MB 上限');
      return Upload.LIST_IGNORE;
    }

    uploadMutation.mutate(file as unknown as File, {
      onSuccess: (data) => {
        setResult(data);
        message.success('上传成功，已创建摄取任务');
      },
      onError: (err) => {
        const msg = err instanceof ApiError ? err.message : '上传失败，请稍后重试';
        setError(msg);
        message.error(msg);
      },
    });

    return false;
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ marginBottom: 0 }}>
        上传文档
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
        支持 <code>.txt</code> / <code>.md</code> / <code>.pdf</code>，单文件不超过 50MB。上传成功后系统会自动投递摄取任务，
        Worker 将依次完成解析、切块、向量化、入库。
      </Typography.Paragraph>

      <Upload.Dragger
        name="file"
        accept={ACCEPTED_EXT.join(',')}
        multiple={false}
        showUploadList={false}
        beforeUpload={handleBeforeUpload}
        disabled={uploadMutation.isPending}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
        <p className="ant-upload-hint">严格按后端限制校验；不会真正上传到 OSS，仅走本地 Koa 服务</p>
      </Upload.Dragger>

      {uploadMutation.isPending && <Alert type="info" showIcon message="正在上传并创建摄取任务…" />}

      {error && <Alert type="error" showIcon message={error} />}

      {result && (
        <Alert
          type="success"
          showIcon
          message="上传成功"
          description={
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="文件名">
                  <Space>
                    <FileTextOutlined />
                    {result.document.fileName}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="文档 ID">{result.document.id}</Descriptions.Item>
                <Descriptions.Item label="摄取任务 ID">{result.task.id}</Descriptions.Item>
              </Descriptions>
              <Space>
                <Button type="primary" onClick={() => router.push('/documents')}>
                  查看文档列表
                </Button>
                <Button
                  onClick={() => {
                    setResult(null);
                    setError(null);
                  }}
                >
                  继续上传
                </Button>
              </Space>
            </Space>
          }
        />
      )}
    </Space>
  );
}
