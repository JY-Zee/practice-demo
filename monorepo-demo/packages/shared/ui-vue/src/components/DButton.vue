<template>
  <el-button
    :class="{ 'w-full': fullWidth }"
    v-bind="$attrs"
  >
    <slot />
  </el-button>
</template>

<script setup lang="ts">
import { ElButton } from 'element-plus';

interface Props {
  /** 是否为全宽按钮 */
  fullWidth?: boolean;
}

defineProps<Props>();
</script>
