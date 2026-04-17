import test from 'node:test';
import assert from 'node:assert/strict';

import { formatAgentAnswer } from '../answerFormatter';
import type { LlmCompletion, RetrievedContext } from '../types';

const makeContext = (score: number): RetrievedContext => ({
  documentId: '00000000-0000-0000-0000-000000000001',
  documentName: 'test.md',
  chunkId: 'chunk-1',
  chunkIndex: 0,
  content: 'test chunk content',
  score,
});

const makeCompletion = (): LlmCompletion => ({
  content: 'This is the answer.',
  model: 'gpt-4o-mini',
  finishReason: 'stop',
  usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
});

test('formatAgentAnswer: 正常映射 references 和 meta', () => {
  const result = formatAgentAnswer({
    completion: makeCompletion(),
    contexts: [makeContext(0.85)],
    topK: 5,
  });

  assert.equal(result.answer, 'This is the answer.');
  assert.equal(result.references.length, 1);
  assert.equal(result.references[0].score, 0.85);
  assert.equal(result.references[0].documentName, 'test.md');
  assert.equal(result.references[0].chunkIndex, 0);
  assert.equal(result.meta.topK, 5);
  assert.equal(result.meta.retrievedCount, 1);
  assert.equal(result.meta.model, 'gpt-4o-mini');
  assert.deepEqual(result.meta.usage, {
    promptTokens: 100,
    completionTokens: 50,
    totalTokens: 150,
  });
});

test('formatAgentAnswer: score > 1 被截断为 1', () => {
  const result = formatAgentAnswer({
    completion: makeCompletion(),
    contexts: [makeContext(1.5)],
    topK: 5,
  });
  assert.equal(result.references[0].score, 1);
});

test('formatAgentAnswer: score < 0 被截断为 0', () => {
  const result = formatAgentAnswer({
    completion: makeCompletion(),
    contexts: [makeContext(-0.3)],
    topK: 5,
  });
  assert.equal(result.references[0].score, 0);
});

test('formatAgentAnswer: NaN score 被截断为 0', () => {
  const result = formatAgentAnswer({
    completion: makeCompletion(),
    contexts: [makeContext(NaN)],
    topK: 5,
  });
  assert.equal(result.references[0].score, 0);
});

test('formatAgentAnswer: 无 contexts 时 references 为空数组', () => {
  const result = formatAgentAnswer({
    completion: makeCompletion(),
    contexts: [],
    topK: 5,
  });
  assert.deepEqual(result.references, []);
  assert.equal(result.meta.retrievedCount, 0);
});
