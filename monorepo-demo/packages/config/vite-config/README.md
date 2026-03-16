# @demo/vite-config

共享的 Vite 配置包,提供预配置的 Vite 设置。

## 使用方法

### React 项目

\`\`\`js
// vite.config.js
import { createReactConfig } from '@demo/vite-config/react';

export default createReactConfig({
  port: 3000,
});
\`\`\`

### Vue 项目

\`\`\`js
// vite.config.js
import { createVueConfig } from '@demo/vite-config/vue';

export default createVueConfig({
  port: 3001,
});
\`\`\`

## 配置选项

- **root**: 项目根目录(默认: `process.cwd()`)
- **port**: 开发服务器端口(React 默认 3000, Vue 默认 3001)

## 包含的功能

- ✅ 自动配置路径别名 `@` -> `src`
- ✅ 开发服务器自动打开浏览器
- ✅ 生产构建启用 sourcemap
- ✅ 自动代码分割(vendor chunks)
- ✅ 优化的打包配置

## 自定义配置

如果需要扩展配置:

\`\`\`js
import { createReactConfig } from '@demo/vite-config/react';
import { mergeConfig } from 'vite';

const baseConfig = createReactConfig({ port: 3000 });

export default mergeConfig(baseConfig, {
  // 你的自定义配置
  define: {
    __APP_VERSION__: JSON.stringify('1.0.0'),
  },
});
\`\`\`
