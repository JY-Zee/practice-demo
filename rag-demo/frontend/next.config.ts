import type { NextConfig } from 'next';

/**
 * Next.js 配置
 *
 * - `rewrites`: 把 `/api/*` 代理到后端 Koa 服务，避免浏览器跨域问题。
 *   后端默认跑在 `http://localhost:8000`，可通过 `NEXT_PUBLIC_API_BASE` 覆盖。
 * - 这样前端代码里任何请求都可以直接写 `/api/documents` 等相对路径。
 */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_BASE}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
