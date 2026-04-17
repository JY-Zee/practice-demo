'use client';

/**
 * 问答面板
 *
 * 数据流：
 * 1. 用户输入 → 发送
 * 2. UI 立刻插入 user 消息 + 一个 pending 的 assistant 占位
 * 3. `useAskQuestion.onDelta` 逐步填充助手内容（当前为一次性）
 * 4. 成功后写入 references，清除 pending
 * 5. 全程共享同一个 sessionId（首次由后端分配）
 */

import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Empty,
  Input,
  Space,
  Typography,
  Tag,
  App,
} from 'antd';
import { ClearOutlined, SendOutlined } from '@ant-design/icons';
import MessageItem, { type ChatDisplayMessage } from './MessageItem';
import { useAskQuestion } from '@/hooks/useAskQuestion';
import { ApiError } from '@/lib/apiClient';

const { TextArea } = Input;

function makeId() {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function ChatPanel() {
  const { message: antMessage } = App.useApp();

  const [messages, setMessages] = useState<ChatDisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [lastError, setLastError] = useState<string | null>(null);

  const pendingIdRef = useRef<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  const updateAssistant = (id: string, patch: Partial<ChatDisplayMessage>) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const askMutation = useAskQuestion({
    onDelta: (_delta, full) => {
      const id = pendingIdRef.current;
      if (!id) return;
      updateAssistant(id, { content: full });
    },
    onSuccess: (data) => {
      const id = pendingIdRef.current;
      if (!id) return;
      setSessionId(data.sessionId);
      updateAssistant(id, {
        content: data.content,
        references: data.referencesJson,
        pending: false,
      });
      pendingIdRef.current = null;
    },
    onError: (err) => {
      const id = pendingIdRef.current;
      const msg = err instanceof ApiError ? err.message : '问答失败，请稍后重试';
      setLastError(msg);
      antMessage.error(msg);
      if (id) {
        updateAssistant(id, { pending: false, error: msg });
        pendingIdRef.current = null;
      }
    },
  });

  // 自动滚动到底部
  useEffect(() => {
    const el = scrollAreaRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleSend = () => {
    const question = input.trim();
    if (!question || askMutation.isPending) return;

    setLastError(null);

    const userMsg: ChatDisplayMessage = {
      id: makeId(),
      role: 'user',
      content: question,
    };
    const assistantPlaceholder: ChatDisplayMessage = {
      id: makeId(),
      role: 'assistant',
      content: '',
      pending: true,
    };
    pendingIdRef.current = assistantPlaceholder.id;

    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    setInput('');

    askMutation.mutate({ question, sessionId });
  };

  const handleClear = () => {
    setMessages([]);
    setSessionId(undefined);
    setLastError(null);
    pendingIdRef.current = null;
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            知识库问答
          </Typography.Title>
          <Typography.Text type="secondary">
            基于已入库文档的语义检索 + LLM 回答；多轮对话通过 sessionId 保持。
          </Typography.Text>
        </div>
        <Space>
          {sessionId && <Tag color="blue">会话 {sessionId}</Tag>}
          <Button icon={<ClearOutlined />} onClick={handleClear} disabled={messages.length === 0}>
            清空
          </Button>
        </Space>
      </Space>

      {lastError && <Alert type="error" showIcon message={lastError} />}

      <div
        ref={scrollAreaRef}
        style={{
          minHeight: 360,
          maxHeight: 520,
          overflowY: 'auto',
          padding: 16,
          background: '#fbfcfe',
          border: '1px solid #eef1f4',
          borderRadius: 8,
        }}
      >
        {messages.length === 0 ? (
          <Empty description="还没有消息，先提个问题吧" />
        ) : (
          messages.map((m) => <MessageItem key={m.id} message={m} />)
        )}
      </div>

      <Space.Compact style={{ width: '100%' }}>
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入你的问题，Enter 发送，Shift+Enter 换行"
          autoSize={{ minRows: 2, maxRows: 6 }}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={askMutation.isPending}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          loading={askMutation.isPending}
          disabled={!input.trim()}
          style={{ height: 'auto' }}
        >
          发送
        </Button>
      </Space.Compact>
    </Space>
  );
}
