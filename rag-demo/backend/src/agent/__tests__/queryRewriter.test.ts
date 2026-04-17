import test from 'node:test';
import assert from 'node:assert/strict';

import { rewriteQuery } from '../queryRewriter';
import type { ChatHistoryItem } from '../types';

test('rewriteQuery: 去除首尾空格', async () => {
  const result = await rewriteQuery('  hello world  ');
  assert.equal(result, 'hello world');
});

test('rewriteQuery: 纯空格输入返回空字符串', async () => {
  const result = await rewriteQuery('   ');
  assert.equal(result, '');
});

test('rewriteQuery: 无历史时直通（向后兼容）', async () => {
  const result = await rewriteQuery('some question');
  assert.equal(result, 'some question');
});

test('rewriteQuery: 传入历史时仍直通（占位实现）', async () => {
  const history: ChatHistoryItem[] = [
    { role: 'user', content: 'previous question' },
    { role: 'assistant', content: 'previous answer' },
  ];
  const result = await rewriteQuery('current question', history);
  assert.equal(result, 'current question');
});

test('rewriteQuery: 传入空历史数组时直通', async () => {
  const result = await rewriteQuery('question', []);
  assert.equal(result, 'question');
});
