# ============================================================
# RAG 后端服务 — 多阶段 Docker 构建
# ============================================================

# ---- 依赖安装阶段 ----
FROM node:24-alpine AS deps
RUN corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
RUN pnpm install --frozen-lockfile
RUN pnpm prisma:generate

# ---- 构建阶段 ----
FROM node:24-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ---- 运行阶段 ----
FROM node:24-alpine AS runner
RUN corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

RUN mkdir -p /app/uploads && chown appuser:nodejs /app/uploads

USER appuser
EXPOSE 8000

CMD ["node", "dist/app.js"]
