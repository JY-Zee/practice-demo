import test from 'node:test';
import assert from 'node:assert/strict';

import {
  assertEmbeddingDimensions,
  buildEmbeddingRequest,
  formatEmbeddingError,
  getEmbeddingStartupWarning,
} from './embedding';

test('buildEmbeddingRequest 不再发送 dimensions 参数', () => {
  const request = buildEmbeddingRequest({
    model: 'text-embedding-3-small',
    input: ['hello world'],
  });

  assert.deepEqual(request, {
    model: 'text-embedding-3-small',
    input: ['hello world'],
  });
  assert.equal('dimensions' in request, false);
});

test('assertEmbeddingDimensions 在返回维度不匹配时抛出可读错误', () => {
  assert.throws(
    () => assertEmbeddingDimensions([[1, 2, 3]], 1536),
    /EMBEDDING_DIMENSION=1536/,
  );
});

test('formatEmbeddingError 会把地区限制错误包装成可操作提示', () => {
  const error = formatEmbeddingError(
    {
      status: 403,
      message: '403 Country, region, or territory not supported',
    },
    {
      apiBase: 'https://api.openai.com/v1',
      model: 'text-embedding-3-small',
    },
  );

  assert.match(error.message, /当前服务器所在地区无法访问该向量接口/);
  assert.match(error.message, /EMBEDDING_API_BASE/);
});

test('getEmbeddingStartupWarning 在官方 OpenAI 地址下返回预警', () => {
  const warning = getEmbeddingStartupWarning('https://api.openai.com/v1');

  assert.match(warning ?? '', /受限地区/);
});
