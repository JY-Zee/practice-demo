# @demo/ui-vue

Vue 3 UI 组件库,基于 Element Plus 封装。

## 安装

\`\`\`bash
pnpm add @demo/ui-vue
\`\`\`

## 使用

### 引入样式

在应用入口文件引入:

\`\`\`ts
import 'element-plus/dist/index.css';
\`\`\`

### DButton 组件

\`\`\`vue
<template>
  <DButton type="primary">主要按钮</DButton>
  <DButton full-width>全宽按钮</DButton>
</template>

<script setup lang="ts">
import { DButton } from '@demo/ui-vue';
</script>
\`\`\`

### DInput 组件

\`\`\`vue
<template>
  <DInput
    v-model="username"
    label="用户名"
    required
    placeholder="请输入用户名"
  />
  <DInput v-model="password" placeholder="无标签输入框" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { DInput } from '@demo/ui-vue';

const username = ref('');
const password = ref('');
</script>
\`\`\`

### DCard 组件

\`\`\`vue
<template>
  <DCard shadow>
    <template #header>
      <div>卡片标题</div>
    </template>
    卡片内容
  </DCard>
</template>

<script setup lang="ts">
import { DCard } from '@demo/ui-vue';
</script>
\`\`\`

### DTable 组件

\`\`\`vue
<template>
  <DTable
    :data-source="paginationData"
    show-pagination
    @page-change="handlePageChange"
  >
    <el-table-column prop="id" label="ID" />
    <el-table-column prop="name" label="姓名" />
  </DTable>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { DTable } from '@demo/ui-vue';
import type { PaginationResponse } from '@demo/types';

const paginationData = ref<PaginationResponse<any>>({
  list: [],
  total: 100,
  page: 1,
  pageSize: 20,
  totalPages: 5,
  hasNext: true,
  hasPrev: false,
});

const handlePageChange = (page: number, pageSize: number) => {
  console.log('Page changed:', page, pageSize);
};
</script>
\`\`\`

## 组件列表

- **DButton** - 按钮组件
- **DInput** - 输入框组件(支持标签)
- **DCard** - 卡片组件(支持阴影)
- **DTable** - 表格组件(支持分页响应数据)

## 构建

\`\`\`bash
pnpm build
\`\`\`

## 特性

- ✅ 基于 Element Plus
- ✅ Vue 3 Composition API
- ✅ TypeScript 支持
- ✅ Tree-shaking 友好
- ✅ 支持 ESM 和 CJS
- ✅ 与 @demo/types 类型集成
