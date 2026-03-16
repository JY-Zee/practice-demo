<template>
  <div v-if="label" class="input-wrapper">
    <label class="input-label">
      <span v-if="required" class="text-red-500">* </span>
      {{ label }}
    </label>
    <el-input v-bind="$attrs" :model-value="modelValue" @update:model-value="handleInput" />
  </div>
  <el-input v-else v-bind="$attrs" :model-value="modelValue" @update:model-value="handleInput" />
</template>

<script setup lang="ts">
import { ElInput } from 'element-plus';

interface Props {
  /** 输入框标签 */
  label?: string;
  /** 是否必填 */
  required?: boolean;
  /** 绑定值 */
  modelValue?: string;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const handleInput = (value: string) => {
  emit('update:modelValue', value);
};
</script>
