import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';

/**
 * React 项目的 Vite 配置工厂函数
 * @param {Object} options - 配置选项
 * @param {string} options.root - 项目根目录
 * @param {number} options.port - 开发服务器端口
 * @returns {import('vite').UserConfig}
 */
export function createReactConfig(options = {}) {
  const { root = process.cwd(), port = 3000 } = options;

  return defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(root, './src'),
      },
    },
    server: {
      port,
      open: true,
      host: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
  });
}

export default createReactConfig;
