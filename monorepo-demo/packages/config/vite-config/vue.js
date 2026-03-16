import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import path from 'path';

/**
 * Vue 项目的 Vite 配置工厂函数
 * @param {Object} options - 配置选项
 * @param {string} options.root - 项目根目录
 * @param {number} options.port - 开发服务器端口
 * @returns {import('vite').UserConfig}
 */
export function createVueConfig(options = {}) {
  const { root = process.cwd(), port = 3001 } = options;

  return defineConfig({
    plugins: [vue()],
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
            'vue-vendor': ['vue', 'vue-router'],
          },
        },
      },
    },
  });
}

export default createVueConfig;
