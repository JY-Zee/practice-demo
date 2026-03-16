import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';

import App from './App.vue';
import Dashboard from './views/Dashboard.vue';
import UserManagement from './views/UserManagement.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Dashboard',
      component: Dashboard,
    },
    {
      path: '/users',
      name: 'UserManagement',
      component: UserManagement,
    },
  ],
});

const app = createApp(App);

app.use(router);
app.use(ElementPlus);

app.mount('#app');
