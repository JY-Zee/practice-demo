<template>
  <el-table
    :data="actualDataSource"
    v-bind="$attrs"
  >
    <slot />
  </el-table>
  <el-pagination
    v-if="showPagination && isPaginationData"
    v-model:current-page="currentPage"
    v-model:page-size="currentPageSize"
    :total="paginationData.total"
    layout="total, sizes, prev, pager, next, jumper"
    @current-change="handlePageChange"
    @size-change="handleSizeChange"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ElTable, ElPagination } from 'element-plus';
import type { PaginationResponse } from '@demo/types';

interface Props {
  /** 数据源(支持分页响应) */
  dataSource?: any[] | PaginationResponse<any>;
  /** 是否显示分页 */
  showPagination?: boolean;
}

interface Emits {
  (e: 'pageChange', page: number, pageSize: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  showPagination: true,
});

const emit = defineEmits<Emits>();

const currentPage = ref(1);
const currentPageSize = ref(20);

const isPaginationData = computed(() => {
  return props.dataSource && typeof props.dataSource === 'object' && 'list' in props.dataSource;
});

const paginationData = computed(() => {
  return isPaginationData.value ? (props.dataSource as PaginationResponse<any>) : null;
});

const actualDataSource = computed(() => {
  return isPaginationData.value
    ? (props.dataSource as PaginationResponse<any>).list
    : props.dataSource;
});

watch(
  () => paginationData.value,
  (data) => {
    if (data) {
      currentPage.value = data.page;
      currentPageSize.value = data.pageSize;
    }
  },
  { immediate: true }
);

const handlePageChange = (page: number) => {
  emit('pageChange', page, currentPageSize.value);
};

const handleSizeChange = (pageSize: number) => {
  emit('pageChange', currentPage.value, pageSize);
};
</script>
