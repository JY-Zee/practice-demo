import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { vueDataSrcPlugin } from './plugins/vite-plugin-vue-data-src'

export default defineConfig({
  plugins: [vueDataSrcPlugin(), vue()],
})
