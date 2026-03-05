# vite-plugin-vue-data-src 学习示例

这是一个 Vue3 + Vite 的学习项目，演示如何编写一个开发态 Vite 插件，在 `.vue` 模板的元素节点上自动注入 `data-src` 属性。

## 需求实现

- 作用范围：仅 `vite dev`
- 处理目标：仅 `.vue` 文件中的 `<template>` 元素节点
- 注入格式：`data-src="相对路径:行号"`

## 插件流程

1. 在 `transform` 钩子拦截 `.vue` 文件源码（`apply: 'serve'` 确保仅开发模式生效）。
2. 用 `@vue/compiler-sfc` 解析 SFC，拿到 `<template>` 内容与位置信息。
3. 用 `@vue/compiler-dom` 把模板解析成 AST，遍历元素节点。
4. 根据节点 `loc.start.line` 计算行号，拼出 `data-src` 值。
5. 把属性插入到元素起始标签并回写到原始 SFC 代码。

## 关键文件

- `plugins/vite-plugin-vue-data-src.ts`：插件核心实现
- `vite.config.ts`：插件注册（在 `vue()` 前执行）
- `src/App.vue`：用于观察 `data-src` 注入效果

## 验证方式

```bash
npm install
npm run dev
```

然后打开浏览器开发者工具（Elements），可看到模板元素上有类似：

```html
<h1 data-src="src/App.vue:4">...</h1>
```
