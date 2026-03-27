const OPENAI_OFFICIAL_HOST = 'api.openai.com';

interface BuildEmbeddingRequestParams {
  model: string;
  input: string[];
}

interface EmbeddingErrorContext {
  apiBase: string;
  model: string;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return '未知错误';
}

function getErrorStatus(error: unknown) {
  if (typeof error !== 'object' || error === null || !('status' in error)) {
    return null;
  }

  const status = (error as { status?: unknown }).status;
  return typeof status === 'number' ? status : null;
}

export function isOfficialOpenAIBase(apiBase: string) {
  try {
    return new URL(apiBase).hostname === OPENAI_OFFICIAL_HOST;
  } catch {
    return false;
  }
}

export function getEmbeddingStartupWarning(apiBase: string) {
  if (!isOfficialOpenAIBase(apiBase)) {
    return null;
  }

  return [
    '⚠️ 当前 EMBEDDING_API_BASE 指向 OpenAI 官方地址。',
    '如果 Worker 部署在受限地区，embed 步骤可能会直接返回 403 Country, region, or territory not supported。',
    '请优先改成你服务器可访问的 OpenAI 兼容网关地址。',
  ].join(' ');
}

export function buildEmbeddingRequest({
  model,
  input,
}: BuildEmbeddingRequestParams) {
  return {
    model,
    input,
  };
}

export function assertEmbeddingDimensions(
  embeddings: number[][],
  expectedDimension: number,
) {
  const mismatchIndex = embeddings.findIndex(
    (embedding) => embedding.length !== expectedDimension,
  );

  if (mismatchIndex === -1) {
    return;
  }

  const actualDimension = embeddings[mismatchIndex]?.length ?? 0;
  throw new Error(
    `Embedding 维度不匹配：第 ${mismatchIndex + 1} 个切块返回 ${actualDimension} 维，` +
      `但当前 EMBEDDING_DIMENSION=${expectedDimension}。` +
      '请确认 Embedding 模型的实际输出维度，并同步更新 .env 与 Qdrant 集合配置。',
  );
}

export function formatEmbeddingError(
  error: unknown,
  context: EmbeddingErrorContext,
) {
  const message = getErrorMessage(error);
  const status = getErrorStatus(error);

  if (
    status === 403 &&
    /country|region|territory not supported/i.test(message)
  ) {
    return new Error(
      'Embedding 服务被目标供应商拒绝：当前服务器所在地区无法访问该向量接口。' +
        ` 当前配置为 ${context.apiBase}（model=${context.model}）。` +
        '请将 EMBEDDING_API_BASE 和 EMBEDDING_MODEL 改成你服务器可访问的 OpenAI 兼容网关后重试。',
      { cause: error instanceof Error ? error : undefined },
    );
  }

  if (status === 400 && /dimension/i.test(message)) {
    return new Error(
      'Embedding 请求被供应商拒绝，原因是维度参数或模型配置不兼容。' +
        ` 当前 model=${context.model}。请检查 EMBEDDING_DIMENSION 是否与模型输出一致。`,
      { cause: error instanceof Error ? error : undefined },
    );
  }

  return new Error(`Embedding 调用失败：${message}`, {
    cause: error instanceof Error ? error : undefined,
  });
}
