'use client';

/**
 * 引用来源展示
 *
 * 用 Collapse 折叠引用片段，默认只展示文档名 / chunkIndex / 相似度，展开后才看全文。
 */

import { Collapse, Tag, Typography, Space, Empty } from 'antd';
import type { Reference } from '@/types/api';

interface ReferenceListProps {
  references: Reference[];
}

export default function ReferenceList({ references }: ReferenceListProps) {
  if (!references || references.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无引用来源" />;
  }

  return (
    <Collapse
      size="small"
      ghost
      items={references.map((ref, idx) => ({
        key: `${ref.documentId}-${ref.chunkIndex}-${idx}`,
        label: (
          <Space wrap size={[8, 4]}>
            <Tag color="blue">#{idx + 1}</Tag>
            <Typography.Text strong>{ref.documentName}</Typography.Text>
            <Tag>chunk {ref.chunkIndex}</Tag>
            {typeof ref.score === 'number' && (
              <Tag color="geekblue">相似度 {(ref.score * 100).toFixed(1)}%</Tag>
            )}
          </Space>
        ),
        children: (
          <Typography.Paragraph
            style={{
              marginBottom: 0,
              background: '#f6f8fa',
              padding: 12,
              borderRadius: 6,
              whiteSpace: 'pre-wrap',
            }}
          >
            {ref.content}
          </Typography.Paragraph>
        ),
      }))}
    />
  );
}
