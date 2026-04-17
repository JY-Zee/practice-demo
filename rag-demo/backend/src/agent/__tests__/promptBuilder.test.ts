import test from 'node:test';
import assert from 'node:assert/strict';

import { buildPrompt } from '../promptBuilder';
import type { ChatHistoryItem, RetrievedContext } from '../types';

const makeContext = (i: number, content = `content of chunk ${i}`): RetrievedContext => ({
  documentId: `00000000-0000-0000-0000-00000000000${i + 1}`,
  documentName: `doc${i}.md`,
  chunkId: `chunk-${i}`,
  chunkIndex: i,
  content,
  score: 0.9 - i * 0.05,
});

// ── 基础行为（无历史） ───────────────────────────────────────────────────────

test('buildPrompt: 返回 system / user / contexts 字段', () => {
  const ctx = makeContext(0, 'RAG is retrieval augmented generation.');
  const result = buildPrompt('What is RAG?', [ctx]);

  assert.equal(typeof result.system, 'string');
  assert.ok(result.system.length > 0, 'system prompt 不应为空');
  assert.ok(result.user.includes('What is RAG?'), 'user prompt 应包含问题');
  assert.ok(result.user.includes('RAG is retrieval augmented generation.'), 'user prompt 应包含 context');
  assert.deepEqual(result.contexts, [ctx]);
});

test('buildPrompt: 无 context 时展示兜底提示', () => {
  const result = buildPrompt('Unknown question?', []);
  assert.ok(result.user.includes('没有检索到相关资料'), '应有无资料兜底文本');
  assert.deepEqual(result.contexts, []);
});

test('buildPrompt: 无历史时 user prompt 不包含"对话历史"字样', () => {
  const result1 = buildPrompt('Q?', [makeContext(0)]);
  const result2 = buildPrompt('Q?', [makeContext(0)], []);

  assert.ok(!result1.user.includes('对话历史'), '无历史时不应有历史区块');
  assert.ok(!result2.user.includes('对话历史'), '空历史数组时不应有历史区块');
});

test('buildPrompt: 超大 context 列表时触发截断', () => {
  const bigContexts = Array.from({ length: 20 }, (_, i) =>
    makeContext(i, 'x'.repeat(700)),
  );
  const result = buildPrompt('question?', bigContexts);
  assert.ok(result.contexts.length < bigContexts.length, '超出字符上限时应截断 contexts');
  assert.ok(result.contexts.length > 0, '截断后仍应保留部分 contexts');
});

// ── 多轮历史 ────────────────────────────────────────────────────────────────

test('buildPrompt: 传入历史时 user prompt 包含"对话历史"区块', () => {
  const history: ChatHistoryItem[] = [
    { role: 'user', content: 'First question about databases' },
    { role: 'assistant', content: 'Databases store structured data.' },
  ];
  const result = buildPrompt('Follow-up question', [makeContext(0)], history);

  assert.ok(result.user.includes('对话历史'), '应有历史区块标题');
  assert.ok(result.user.includes('First question about databases'), '应包含用户历史消息');
  assert.ok(result.user.includes('Databases store structured data.'), '应包含助手历史消息');
  assert.ok(result.user.includes('Follow-up question'), '应包含当前问题');
});

test('buildPrompt: 历史区块出现在参考资料之后、当前问题之前', () => {
  const history: ChatHistoryItem[] = [
    { role: 'user', content: 'Old question' },
    { role: 'assistant', content: 'Old answer' },
  ];
  const result = buildPrompt('New question', [makeContext(0)], history);
  const refIdx = result.user.indexOf('参考资料');
  const histIdx = result.user.indexOf('对话历史');
  const qIdx = result.user.indexOf('用户问题');

  assert.ok(refIdx < histIdx, '参考资料应在历史之前');
  assert.ok(histIdx < qIdx, '历史应在当前问题之前');
});

test('buildPrompt: chatHistory 字段被透传到返回值', () => {
  const history: ChatHistoryItem[] = [
    { role: 'user', content: 'Previous Q' },
  ];
  const result = buildPrompt('Current Q', [makeContext(0)], history);
  assert.deepEqual(result.chatHistory, history);
});

test('buildPrompt: 无历史时 chatHistory 字段为 undefined', () => {
  const result = buildPrompt('Q', [makeContext(0)]);
  assert.equal(result.chatHistory, undefined);
});
