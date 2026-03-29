<template>
  <n-config-provider>
    <n-message-provider>
      <div class="shell">
        <header class="shell__header">
          <div>
            <p class="eyebrow">Vue 3 Playground</p>
            <h1>基础项目已经接好</h1>
          </div>
          <nav class="shell__nav">
            <RouterLink to="/">首页</RouterLink>
          </nav>
        </header>

        <main class="shell__main">
          <RouterView />
        </main>
      </div>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { NConfigProvider, NMessageProvider } from 'naive-ui'
import { RouterLink, RouterView } from 'vue-router'
</script>
