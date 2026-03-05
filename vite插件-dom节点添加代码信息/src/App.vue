<template>
  <main class="page-root">
    <header class="block">
      <h1>Vite Vue3 插件学习 Demo</h1>
      <p>打开浏览器 Elements 面板查看每个节点上的 data-src 属性。</p>
    </header>

    <section class="block">
      <ul>
        <li>每个模板元素都会被注入 data-src</li>
        <li>值格式为：文件相对路径:行号</li>
        <li>当前仅在 vite dev 生效</li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.page-root {
  max-width: 760px;
  margin: 40px auto;
  font-family: Arial, sans-serif;
  line-height: 1.5;
  color: #1f2328;
}

.block {
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 8px;
  background: #f5f7fb;
}
</style>
