<template>
  <section class="panel">
    <div class="panel__copy">
      <p class="eyebrow">Ready to extend</p>
      <h2>路由、Pinia 持久化、Naive UI 都已经装好了</h2>
      <p class="panel__text">
        现在这个页用一个最小示例把状态管理和组件库接起来，后面我们可以继续往业务结构里拆。
      </p>
    </div>

    <div class="panel__actions">
      <n-statistic label="当前计数" :value="counter.count" />
      <n-statistic label="双倍结果" :value="counter.doubleCount" />
      <n-button type="primary" size="large" @click="counter.increment">
        点击 +1
      </n-button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { NButton, NStatistic } from 'naive-ui'

import { useCounterStore } from '@/stores/counter'

const counter = useCounterStore()
</script>
