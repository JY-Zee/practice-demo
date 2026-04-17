'use client';

/**
 * 单条消息气泡
 *
 * - 用户消息右对齐、主题色背景
 * - 助手消息左对齐、浅灰背景，底部折叠展示引用来源
 * - pending 状态的助手消息显示闪烁光标提示
 */

import { Avatar, Space, Typography, Card } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import ReferenceList from './ReferenceList';
import type { Reference } from '@/types/api';

export interface ChatDisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  references?: Reference[];
  pending?: boolean;
  error?: string;
}

interface MessageItemProps {
  message: ChatDisplayMessage;
}

export default function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 16,
      }}
    >
      <Space
        align="start"
        size={12}
        style={{ maxWidth: '80%', flexDirection: isUser ? 'row-reverse' : 'row' }}
      >
        <Avatar
          icon={isUser ? <UserOutlined /> : <RobotOutlined />}
          style={{
            backgroundColor: isUser ? '#2563eb' : '#52c41a',
            flexShrink: 0,
          }}
        />
        <Card
          size="small"
          style={{
            background: isUser ? '#eff6ff' : '#fafafa',
            borderColor: isUser ? '#bfdbfe' : '#e5e7eb',
            minWidth: 120,
          }}
          styles={{ body: { padding: '10px 14px' } }}
        >
          {message.error ? (
            <Typography.Text type="danger">{message.error}</Typography.Text>
          ) : (
            <Typography.Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
              {message.content}
              {message.pending && (
                <span
                  aria-label="正在生成"
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 14,
                    marginLeft: 4,
                    background: '#9ca3af',
                    verticalAlign: 'middle',
                    animation: 'rag-cursor-blink 1s steps(2, start) infinite',
                  }}
                />
              )}
            </Typography.Paragraph>
          )}

          {!isUser && !message.pending && message.references && message.references.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                引用来源
              </Typography.Text>
              <ReferenceList references={message.references} />
            </div>
          )}
        </Card>
      </Space>

      <style jsx global>{`
        @keyframes rag-cursor-blink {
          to {
            visibility: hidden;
          }
        }
      `}</style>
    </div>
  );
}
