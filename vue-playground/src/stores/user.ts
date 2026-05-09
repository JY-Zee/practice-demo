/**
 * Options Store 风格 (类似 Vuex)
 * 适合：熟悉 Vuex、逻辑简单的 store
 */
import { defineStore } from 'pinia'

interface UserInfo {
  id: number
  name: string
  role: 'admin' | 'user' | 'guest'
}

export const useUserStore = defineStore('user', {
  // state: 返回初始状态的函数（必须是函数，保证响应式隔离）
  state: () => ({
    userInfo: null as UserInfo | null,
    token: '',
    isLoading: false,
  }),

  // getters: 类似 computed，基于 state 派生数据
  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.userInfo?.role === 'admin',
    displayName: (state) => state.userInfo?.name ?? '游客',
  },

  // actions: 同步/异步操作，直接修改 state
  actions: {
    async login(username: string, password: string) {
      this.isLoading = true
      try {
        // 模拟 API 请求
        await new Promise((r) => setTimeout(r, 500))
        this.token = 'mock-jwt-token'
        this.userInfo = { id: 1, name: username, role: 'admin' }
      } finally {
        this.isLoading = false
      }
    },

    logout() {
      // $reset() 也可以重置 state，但这里手动清除更明确
      this.token = ''
      this.userInfo = null
    },
  },
})
