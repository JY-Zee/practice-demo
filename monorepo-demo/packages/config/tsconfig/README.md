# @demo/tsconfig

共享的 TypeScript 配置包,为不同类型的项目提供统一的 TS 配置。

## 使用方法

在你的项目的 `tsconfig.json` 中继承:

### React 项目

\`\`\`json
{
  "extends": "@demo/tsconfig/react.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"]
}
\`\`\`

### Vue 项目

\`\`\`json
{
  "extends": "@demo/tsconfig/vue.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"]
}
\`\`\`

### Node.js 项目

\`\`\`json
{
  "extends": "@demo/tsconfig/node.json",
  "include": ["src"]
}
\`\`\`

## 配置说明

- **base.json**: 基础配置,所有项目通用
- **react.json**: React 项目配置(jsx: react-jsx)
- **vue.json**: Vue 项目配置(jsx: preserve)
- **node.json**: Node.js 项目配置
