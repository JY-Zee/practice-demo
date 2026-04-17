/**
 * Agent 层内部数据结构
 *
 * 说明：Agent 层封装检索 + Prompt + LLM 的问答链路，
 * 这些类型是 Agent 内部各模块（retriever/promptBuilder/llmClient/...）之间的契约。
 * 对 backend Service 层只暴露 `runChat` 及其 I/O 类型。
 */

import type { Reference } from '../schemas/chat';

/** 多轮对话历史单条记录（由 service.ts 从 chatRepository 预填充后注入 Agent 流水线） */
export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

/** Agent 入口入参 */
export interface AgentChatInput {
  question: string;
  sessionId: string;
  topK?: number;
  /**
   * 多轮对话历史，由 service.ts 从 chatRepository 拉取后注入。
   * API 调用方无需传递此字段。
   */
  chatHistory?: ChatHistoryItem[];
}

/** 召回得到的单条文档片段上下文 */
export interface RetrievedContext {
  documentId: string;
  documentName: string;
  chunkId: string;
  chunkIndex: number;
  content: string;
  score: number;
}

/** PromptBuilder 组装后的 LLM 入参 */
export interface PromptPayload {
  system: string;
  user: string;
  contexts: RetrievedContext[];
  /** 实际纳入 Prompt 的对话历史（透传自 AgentChatInput.chatHistory） */
  chatHistory?: ChatHistoryItem[];
}

/** LLM 响应 */
export interface LlmCompletion {
  content: string;
  model: string;
  finishReason?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

/** Agent 返回给后端的最终结果 */
export interface AgentAnswer {
  answer: string;
  references: Reference[];
  meta: {
    model: string;
    retrievedCount: number;
    topK: number;
    finishReason?: string;
    usage?: LlmCompletion['usage'];
  };
}
