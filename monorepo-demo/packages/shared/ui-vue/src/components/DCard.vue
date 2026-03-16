<template>
  <el-card
    :class="{ 'shadow-md': shadow }"
    :shadow="shadow ? 'hover' : 'never'"
    v-bind="$attrs"
  >
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>
    <slot />
  </el-card>
</template>

<script setup lang="ts">
import { ElCard } from 'element-plus';

interface Props {
  /** 是否显示阴影 */
  shadow?: boolean;
}

withDefaults(defineProps<Props>(), {
  shadow: true,
});
</script>
