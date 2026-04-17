/**
 * 编译期接口契约验证
 *
 * 每个赋值语句在编译时验证对应函数满足其 Stage 接口。
 * 若某函数的签名与接口不符，TypeScript 编译将报错。
 * 此文件无运行时逻辑，不需要测试。
 */

import type {
  FormatAnswerStage,
  LlmCallStage,
  PromptBuildStage,
  QueryRewriteStage,
  RerankStage,
  RetrieveStage,
} from '../interfaces';

import { formatAgentAnswer } from '../answerFormatter';
import { generateAnswer } from '../llmClient';
import { buildPrompt } from '../promptBuilder';
import { rewriteQuery } from '../queryRewriter';
import { rerankContexts } from '../reranker';
import { retrieveContexts } from '../retriever';

// These will cause a TypeScript compile error if any function's signature drifts from its Stage interface
const _: [QueryRewriteStage, RetrieveStage, RerankStage, PromptBuildStage, LlmCallStage, FormatAnswerStage] = [
  rewriteQuery,
  retrieveContexts,
  rerankContexts,
  buildPrompt,
  generateAnswer,
  formatAgentAnswer,
];
void _;
