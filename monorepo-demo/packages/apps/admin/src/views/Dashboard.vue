<template>
  <div>
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover">
          <el-statistic title="用户总数" :value="1025" />
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover">
          <el-statistic title="今日访问" :value="328" />
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover">
          <el-statistic title="订单数量" :value="865" />
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover">
          <el-statistic title="营收金额" :value="formatMoney(125678.90)" prefix="¥" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="24">
        <DCard shadow>
          <template #header>
            <div>使用的共享包</div>
          </template>
          <el-space direction="vertical">
            <div><strong>@demo/ui-vue:</strong> Vue UI 组件库</div>
            <div><strong>@demo/utils:</strong> 工具函数库(日期、格式化、请求等)</div>
            <div><strong>@demo/types:</strong> TypeScript 类型定义</div>
            <div><strong>@demo/eslint-config:</strong> ESLint 配置</div>
            <div><strong>@demo/tsconfig:</strong> TypeScript 配置</div>
            <div><strong>@demo/vite-config:</strong> Vite 配置</div>
          </el-space>
        </DCard>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <DCard shadow>
          <template #header>
            <div>演示功能</div>
          </template>
          <el-space wrap>
            <DButton type="primary">主要按钮</DButton>
            <DButton type="success">成功按钮</DButton>
            <DButton type="warning">警告按钮</DButton>
            <DButton type="danger">危险按钮</DButton>
            <DButton type="info">信息按钮</DButton>
          </el-space>
        </DCard>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <DCard shadow>
          <template #header>
            <div>当前时间</div>
          </template>
          <el-space direction="vertical">
            <div>完整时间: {{ formatDate(new Date()) }}</div>
            <div>日期: {{ formatDate(new Date(), 'YYYY-MM-DD') }}</div>
            <div>时间: {{ formatDate(new Date(), 'HH:mm:ss') }}</div>
          </el-space>
        </DCard>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { DButton, DCard } from '@demo/ui-vue';
import { formatDate, formatMoney } from '@demo/utils';
</script>
