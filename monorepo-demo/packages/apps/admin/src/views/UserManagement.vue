<template>
  <div>
    <h2>用户管理</h2>
    
    <DTable
      :data-source="paginationData"
      show-pagination
      @page-change="handlePageChange"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="nickname" label="昵称" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column prop="phone" label="手机号">
        <template #default="{ row }">
          {{ formatPhone(row.phone) }}
        </template>
      </el-table-column>
      <el-table-column prop="gender" label="性别">
        <template #default="{ row }">
          {{ getGenderText(row.gender) }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.createdAt, 'YYYY-MM-DD HH:mm') }}
        </template>
      </el-table-column>
    </DTable>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { DTable } from '@demo/ui-vue';
import type { User, Gender, UserStatus, PaginationResponse } from '@demo/types';
import { formatDate, formatPhone } from '@demo/utils';

// 模拟用户数据
const mockUsers: User[] = Array.from({ length: 50 }, (_, i) => ({
  id: String(i + 1),
  username: `user${i + 1}`,
  nickname: `用户${i + 1}`,
  email: `user${i + 1}@example.com`,
  phone: `138${String(i + 1).padStart(8, '0')}`,
  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
  gender: (i % 3) as Gender,
  status: (i % 2) as UserStatus,
  roles: [],
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  updatedAt: new Date(Date.now() - i * 43200000).toISOString(),
}));

const currentPage = ref(1);
const currentPageSize = ref(10);

const paginationData = computed((): PaginationResponse<User> => {
  const start = (currentPage.value - 1) * currentPageSize.value;
  const end = start + currentPageSize.value;
  const list = mockUsers.slice(start, end);

  return {
    list,
    total: mockUsers.length,
    page: currentPage.value,
    pageSize: currentPageSize.value,
    totalPages: Math.ceil(mockUsers.length / currentPageSize.value),
    hasNext: end < mockUsers.length,
    hasPrev: currentPage.value > 1,
  };
});

const handlePageChange = (page: number, pageSize: number) => {
  currentPage.value = page;
  currentPageSize.value = pageSize;
};

const getGenderText = (gender: Gender): string => {
  const genderMap = {
    [0]: '未知',
    [1]: '男',
    [2]: '女',
  };
  return genderMap[gender];
};

const getStatusText = (status: UserStatus): string => {
  const statusMap = {
    [-1]: '已删除',
    [0]: '禁用',
    [1]: '正常',
  };
  return statusMap[status];
};

const getStatusType = (status: UserStatus): 'success' | 'danger' | 'info' => {
  const typeMap = {
    [-1]: 'info' as const,
    [0]: 'danger' as const,
    [1]: 'success' as const,
  };
  return typeMap[status];
};
</script>
