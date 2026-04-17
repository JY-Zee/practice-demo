/**
 * LLM 调用客户端
 *
 * 通过 OpenAI 兼容接口调用真实 LLM（走 env.LLM_API_BASE）。
 */

import { llmClient } from '../lib/openai';
import { env } from '../config/env';
import type { LlmCompletion, PromptPayload } from './types';

export async function generateAnswer(
  payload: PromptPayload,
): Promise<LlmCompletion> {
  console.info('[llmClient] request start', {
    model: env.LLM_MODEL,
    contextsCount: payload.contexts.length,
    promptCharLen: payload.system.length + payload.user.length,
  });

  const _t0 = Date.now();
  let response;
  try {
    response = await llmClient.chat.completions.create({
      model: env.LLM_MODEL,
      messages: [
        { role: 'system', content: payload.system },
        { role: 'user', content: payload.user },
      ],
      temperature: 0.2,
      max_tokens: 1024,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `LLM 调用失败（${env.LLM_API_BASE}，model=${env.LLM_MODEL}）：${detail}`,
      { cause: error instanceof Error ? error : undefined },
    );
  }

  const choice = response.choices[0];
  const content = choice?.message?.content;

  if (!content) {
    throw new Error(
      `LLM 返回空响应，请检查网关与模型配置（${env.LLM_API_BASE}，model=${env.LLM_MODEL}）`,
    );
  }

  const usage = response.usage;

  console.info('[llmClient] request done', {
    model: response.model,
    latencyMs: Date.now() - _t0,
    usage: usage
      ? {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        }
      : null,
  });

  return {
    content,
    model: response.model,
    finishReason: choice.finish_reason ?? undefined,
    usage: usage
      ? {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        }
      : undefined,
  };
}
