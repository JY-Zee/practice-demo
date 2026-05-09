# Pinia 完整指南

> 基于 Vue 3 + TypeScript，涵盖原理、API、组件用法、封装、生产目录结构

---

## 一、Pinia 原理

Pinia 本质是基于 Vue 的响应式系统 (`reactive`/`ref`) + 插件机制构建的状态管理库。

```
defineStore()
  └── 内部调用 reactive() 包裹 state
  └── 注册到 Pinia 实例 (app.use(pinia))
  └── 通过 inject/provide 在组件树中共享
  └── 每个 store 是单例 (同一 id 只创建一次)
```

**四个核心机制：**

1. **单例共享** — 同一 `id` 的 store 全局只有一个实例，任何组件调用 `useXxxStore()` 拿到的是同一个对象
2. **响应式** — state 用 `reactive()` 包裹，自动追踪依赖，state 变化时组件自动重新渲染
3. **插件系统** — `pinia.use(plugin)` 可扩展每个 store（如持久化插件 `pinia-plugin-persistedstate`）
4. **Devtools 集成** — 每次 action 调用都会被记录，支持时间旅行调试

---

## 二、两种 Store 写法

### Options Store（类似 Vuex，熟悉 Vuex 的人容易上手）

```ts
// stores/user.ts
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  // state: 必须是函数，保证每个 pinia 实例的状态独立
  state: () => ({
    name: '',
    token: '',
    isLoading: false,
  }),

  // getters: 类似 computed，基于 state 派生数据，有缓存
  getters: {
    isLoggedIn: (state) => !!state.token,
    displayName: (state) => state.name || '游客',
  },

  // actions: 同步/异步操作，this 指向 store 实例
  actions: {
    async login(username: string, password: string) {
      this.isLoading = true
      try {
        await fetch('/api/login', { method: 'POST' })
        this.token = 'jwt-token'
        this.name = username
      } finally {
        this.isLoading = false
      }
    },
    logout() {
      this.token = ''
      this.name = ''
    },
  },
})
```

### Setup Store（推荐，类似 Composition API）

```ts
// stores/cart.ts
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', () => {
  // state → ref / reactive
  const items = ref<{ id: number; name: string; price: number; quantity: number }[]>([])
  const couponCode = ref('')

  // getters → computed
  const totalCount = computed(() => items.value.reduce((s, i) => s + i.quantity, 0))
  const subtotal = computed(() => items.value.reduce((s, i) => s + i.price * i.quantity, 0))
  const discount = computed(() => couponCode.value === 'VIP10' ? subtotal.value * 0.1 : 0)
  const total = computed(() => subtotal.value - discount.value)

  // actions → 普通函数
  function addItem(product: { id: number; name: string; price: number }) {
    const existing = items.value.find((i) => i.id === product.id)
    if (existing) {
      existing.quantity++
    } else {
      items.value.push({ ...product, quantity: 1 })
    }
  }

  function removeItem(id: number) {
    items.value = items.value.filter((i) => i.id !== id)
  }

  function clearCart() {
    items.value = []
    couponCode.value = ''
  }

  // 手动实现 $reset（Setup Store 没有内置 $reset）
  function $reset() {
    items.value = []
    couponCode.value = ''
  }

  return { items, couponCode, totalCount, subtotal, discount, total, addItem, removeItem, clearCart, $reset }
})
```

### 两种写法对比

| 特性 | Options Store | Setup Store（推荐） |
|---|---|---|
| state | `state: () => ({})` | `ref()` / `reactive()` |
| getters | `getters: { x: s => s.x }` | `computed(() => ...)` |
| actions | `actions: { fn() {} }` | 普通函数 `function fn()` |
| `$reset()` | 内置支持 | 需手动实现 |
| watch/watchEffect | 不支持 | 支持 |
| 代码组织 | 强制三段分离 | 灵活，按业务分组 |
| 跨 store 引用 | 在 action 内 `useOtherStore()` | 同左 |

---

## 三、组件中使用

### 基础用法

```vue
<template>
  <p>{{ counter.count }}</p>
  <p>{{ counter.doubleCount }}</p>
  <button @click="counter.increment()">+1</button>
  <!-- 简单场景可直接赋值修改 state -->
  <button @click="counter.count = 0">reset</button>
</template>

<script setup lang="ts">
import { useCounterStore } from '@/stores'
const counter = useCounterStore()
</script>
```

### storeToRefs — 解构保持响应式（重要）

```ts
import { storeToRefs } from 'pinia'
import { useCounterStore } from '@/stores'

const counter = useCounterStore()

// ❌ 错误：直接解构 state/getter 会丢失响应式
const { count, doubleCount } = counter

// ✅ 正确：storeToRefs 包裹，保持响应式
const { count, doubleCount } = storeToRefs(counter)

// ✅ actions 直接解构，不需要 storeToRefs
const { increment } = counter
```

### 跨 Store 引用

```ts
// stores/cart.ts — 在 action 内部调用其他 store，避免循环依赖
async function checkout() {
  const userStore = useUserStore() // 在函数内部调用，不是顶层
  if (!userStore.isLoggedIn) {
    throw new Error('请先登录')
  }
  // ...
}
```

---

## 四、重要 API 详解

### $patch — 批量更新（推荐替代逐个赋值）

```ts
const store = useUserStore()

// 方式一：对象写法，适合简单字段更新
store.$patch({ name: 'Alice', token: 'new-token' })

// 方式二：函数写法，适合数组操作或条件逻辑
store.$patch((state) => {
  state.name = 'Alice'
  state.token = 'new-token'
  // 数组操作推荐用这种方式
})

// 优势：多个字段变更只触发一次响应式更新，性能更好
```

### $reset — 重置到初始 state

```ts
// 仅 Options Store 内置支持
store.$reset()

// Setup Store 需手动实现
function $reset() {
  count.value = 0
  name.value = ''
}
```

### $subscribe — 监听 state 变化

```ts
// 类似 watch store，但更精细
const unsubscribe = store.$subscribe((mutation, state) => {
  // mutation.type: 'direct' | 'patch object' | 'patch function'
  // mutation.storeId: store 的 id
  // state: 变化后的完整 state
  console.log(`[${mutation.type}] state changed:`, state)

  // 常用场景：自动同步到 localStorage
  localStorage.setItem('user', JSON.stringify(state))
})

// 组件卸载时记得取消订阅
onUnmounted(unsubscribe)
```

### $onAction — 监听 action 调用

```ts
store.$onAction(({ name, args, after, onError }) => {
  console.log(`action "${name}" called with`, args)

  // after：action 完成后执行
  after((result) => {
    console.log(`action "${name}" finished:`, result)
  })

  // onError：action 抛错时执行
  onError((error) => {
    console.error(`action "${name}" failed:`, error)
  })
})
```

---

## 五、封装 Pinia（生产级）

### 原则：stores 只放数据，composables 封装业务逻辑

直接在组件中使用 store 会导致：
- 组件与 store 强耦合，难以测试
- router、toast 等副作用混入 store，违反单一职责
- 相同逻辑在多个组件中重复

**解决方案：composables 作为中间层**

```ts
// composables/useAuth.ts
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores'

export function useAuth() {
  const user = useUserStore()
  const router = useRouter()

  async function loginAndRedirect(username: string, password: string) {
    await user.login(username, password)
    router.push('/dashboard')  // 副作用放在 composable，不放 store
  }

  function logoutAndRedirect() {
    user.logout()
    router.push('/login')
  }

  return {
    isLoggedIn: computed(() => user.isLoggedIn),
    displayName: computed(() => user.displayName),
    isAdmin: computed(() => user.isAdmin),
    loginAndRedirect,
    logoutAndRedirect,
  }
}
```

```ts
// composables/useCart.ts
import { useCartStore } from '@/stores'
import { useToast } from '@/composables/useToast'  // UI 提示

export function useCart() {
  const cart = useCartStore()
  const toast = useToast()

  async function checkoutWithFeedback() {
    try {
      const result = await cart.checkout()
      toast.success(`订单 #${result.orderId} 提交成功！`)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  return {
    items: cart.items,
    total: cart.total,
    addItem: cart.addItem,
    checkoutWithFeedback,
  }
}
```

组件只依赖 composable，不直接操作 store：

```vue
<script setup lang="ts">
// ✅ 组件依赖 composable，不直接依赖 store
import { useAuth } from '@/composables/useAuth'
import { useCart } from '@/composables/useCart'

const { isLoggedIn, displayName, logoutAndRedirect } = useAuth()
const { items, total, addItem, checkoutWithFeedback } = useCart()
</script>
```

### 为什么组件不直接操作 store？

**1. 单一职责，store 保持纯粹**

store 只管数据状态，副作用（路由跳转、toast、埋点）放在 composable。

```ts
// ❌ store 里混入副作用
actions: {
  async login() {
    this.token = await api.login()
    router.push('/dashboard')   // store 不该知道路由
    toast.success('登录成功')   // store 不该知道 UI
  }
}

// ✅ store 只改 state，composable 处理副作用
actions: {
  async login() { this.token = await api.login() }
}
async function loginAndRedirect() {
  await user.login()
  router.push('/dashboard')
  toast.success('登录成功')
}
```

**2. 逻辑复用，避免组件间重复**

同一个业务操作在多个组件里调用，逻辑只写一次：

```ts
// ❌ 登录逻辑散落在多个组件
// LoginPage.vue  → await store.login(); router.push(...)
// HeaderBar.vue  → await store.login(); router.push(...)

// ✅ composable 封装一次，各组件直接用
const { loginAndRedirect } = useAuth()
```

**3. 易于测试**

测试组件时只需 mock composable，不需要搭建 store + router + toast 全套环境：

```ts
vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({
    isLoggedIn: ref(false),
    loginAndRedirect: vi.fn(),
  })
}))
```

**4. 屏蔽底层实现**

未来把 store 拆分、合并、或换成 `vue-query`，组件代码零改动——组件只知道 `useAuth()`，不关心内部用了哪个 store。

**一句话总结：**

> store 是**数据模型层**，composable 是**业务逻辑层**，组件是**展示层**。三层分离后每层只做一件事，改哪层不影响其他层。

### Pinia 插件（持久化示例）

```ts
// plugins/pinia.ts
import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'

export const pinia = createPinia()

pinia.use(
  createPersistedState({
    storage: localStorage,  // 默认 localStorage
  })
)

// main.ts
import { pinia } from '@/plugins/pinia'
app.use(pinia)
```

在 store 中开启持久化：

```ts
export const useUserStore = defineStore('user', {
  state: () => ({ token: '', name: '' }),
  // ...
  persist: true,  // 整个 state 持久化
  // 或精细控制：
  persist: {
    paths: ['token'],  // 只持久化 token 字段
    storage: sessionStorage,
  },
})
```

---

## 六、生产环境项目目录结构

```
src/
├── stores/                        # Pinia stores（纯数据层）
│   ├── index.ts                   # 统一出口
│   ├── user.ts                    # 用户 & 认证状态
│   ├── cart.ts                    # 购物车状态
│   └── app.ts                     # 全局 UI 状态（loading, theme, sidebar）
│
├── composables/                   # 业务逻辑层（store + 副作用的组合）
│   ├── useAuth.ts                 # 登录/登出 + router 跳转
│   ├── useCart.ts                 # 购物车操作 + toast 提示
│   └── usePermission.ts           # 基于 role 的权限判断
│
├── plugins/
│   └── pinia.ts                   # pinia 实例 + 插件注册
│
├── types/
│   └── store.ts                   # store 相关的 TypeScript 类型定义
│
└── main.ts
```

**`stores/index.ts` 统一出口：**

```ts
export { useUserStore } from './user'
export { useCartStore } from './cart'
export { useAppStore } from './app'
```

**`stores/app.ts` 全局 UI 状态示例：**

```ts
import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', () => {
  const isGlobalLoading = ref(false)
  const theme = ref<'light' | 'dark'>('light')
  const isSidebarOpen = ref(true)

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme.value)
  }

  return { isGlobalLoading, theme, isSidebarOpen, toggleTheme }
})
```

---

## 七、核心原则总结

| 原则 | 说明 |
|---|---|
| stores 只放纯数据逻辑 | 不引入 router/toast 等 UI 副作用 |
| composables 是组合层 | store + 副作用 = composable，组件的直接依赖 |
| storeToRefs 解构 state | 直接解构会丢失响应式 |
| actions 直接解构 | 不需要 storeToRefs |
| $patch 批量更新 | 比逐个赋值触发更少的响应 |
| $subscribe 要取消订阅 | onUnmounted 里调用返回的取消函数，防内存泄漏 |
| 跨 store 引用在函数内 | 避免循环依赖，不在顶层调用其他 store |

---

## 八、示例文件位置

本项目中的演示代码：

- `src/stores/user.ts` — Options Store 完整示例
- `src/stores/cart.ts` — Setup Store 完整示例
- `src/stores/counter.ts` — 带持久化的 Setup Store
- `src/stores/index.ts` — 统一出口
- `src/views/PiniaDemo.vue` — 所有 API 的交互演示（路由：`/pinia`）
