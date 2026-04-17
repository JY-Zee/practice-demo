/**
 * Agent 流水线 Stage 接口契约
 *
 * 每个接口对应链路中一个可独立替换的实现单元。
 * 当前各模块的具体函数（rewriteQuery / retrieveContexts / ...）
 * 已自然满足对应接口，无需修改调用方。
 * 后续若要接入 LangGraph、Cross-Encoder 等，只需提供新的实现并在 service.ts 中替换引用即可。
 */

import type {
  AgentAnswer,
  ChatHistoryItem,
  LlmCompletion,
  PromptPayload,
  RetrievedContext,
} from './types';

/** 查询改写阶段：原始问题 (+ 可选历史) → 改写后问题 */
export type QueryRewriteStage = (
  question: string,
  chatHistory?: ChatHistoryItem[],
) => Promise<string>;

/** 向量检索阶段：问题 + topK → 候选片段列表 */
export type RetrieveStage = (params: {
  question: string;
  topK: number;
}) => Promise<RetrievedContext[]>;

/** 重排序阶段：问题 + 候选列表 → 精排后列表 */
export type RerankStage = (
  question: string,
  contexts: RetrievedContext[],
) => Promise<RetrievedContext[]>;

/** Prompt 组装阶段：问题 + 上下文 (+ 可选历史) → PromptPayload */
export type PromptBuildStage = (
  question: string,
  contexts: RetrievedContext[],
  chatHistory?: ChatHistoryItem[],
) => PromptPayload;

/** LLM 调用阶段：PromptPayload → LlmCompletion */
export type LlmCallStage = (payload: PromptPayload) => Promise<LlmCompletion>;

/** 答案格式化阶段：completion + contexts + topK → AgentAnswer */
export type FormatAnswerStage = (params: {
  completion: LlmCompletion;
  contexts: RetrievedContext[];
  topK: number;
}) => AgentAnswer;
