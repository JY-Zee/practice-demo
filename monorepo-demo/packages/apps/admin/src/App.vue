<template>
  <el-container style="min-height: 100vh">
    <el-aside width="200px" style="background-color: #001529">
      <div style="color: white; padding: 16px; font-size: 18px">
        Vue Admin
      </div>
      <el-menu
        :default-active="currentRoute"
        router
        background-color="#001529"
        text-color="#fff"
        active-text-color="#ffd04b"
      >
        <el-menu-item index="/">
          <el-icon><el-icon-house /></el-icon>
          <span>Dashboard</span>
        </el-menu-item>
        <el-menu-item index="/users">
          <el-icon><el-icon-user /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header style="background-color: #fff; box-shadow: 0 1px 4px rgba(0,21,41,.08)">
        <div style="display: flex; align-items: center; height: 100%">
          <h2>Monorepo Admin 后台</h2>
        </div>
      </el-header>

      <el-main>
        <router-view />
      </el-main>

      <el-footer style="text-align: center">
        Vue Admin ©{{ new Date().getFullYear() }} Created with Monorepo
      </el-footer>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { House as ElIconHouse, User as ElIconUser } from '@element-plus/icons-vue';

const route = useRoute();
const currentRoute = computed(() => route.path);
</script>

<style scoped>
.el-aside {
  color: #fff;
}

.el-header {
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.el-main {
  background-color: #f0f2f5;
  padding: 20px;
}
</style>
