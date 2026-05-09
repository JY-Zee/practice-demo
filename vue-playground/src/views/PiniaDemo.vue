<template>
  <div class="demo">
    <h1>Pinia 完整演示</h1>

    <!-- ===== 1. 基础用法 ===== -->
    <section>
      <h2>1. 直接读写 State</h2>
      <!-- store 属性可直接绑定到模板，是响应式的 -->
      <p>count: {{ counter.count }}</p>
      <p>doubleCount (getter): {{ counter.doubleCount }}</p>
      <button @click="counter.increment()">+1 (action)</button>
      <!-- 直接修改 state（简单场景可以，复杂场景建议走 action） -->
      <button @click="counter.count = 0">reset (直接赋值)</button>
      <!-- $reset() 仅 Options Store 支持，Setup Store 需自己实现 -->
    </section>

    <!-- ===== 2. storeToRefs — 解构保持响应式 ===== -->
    <section>
      <h2>2. storeToRefs 解构</h2>
      <p>count: {{ count }}</p>
      <p>doubleCount: {{ doubleCount }}</p>
      <!-- 注意：action 不需要 storeToRefs，直接从 store 解构即可 -->
      <button @click="increment">increment</button>
      <button @click="validCountRef">验证ref</button>
    </section>

    <!-- ===== 3. 用户 Store (Options 风格) ===== -->
    <section>
      <h2>3. 用户登录 (Options Store)</h2>
      <div v-if="!user.isLoggedIn">
        <input v-model="username" placeholder="用户名" />
        <button :disabled="user.isLoading" @click="handleLogin">
          {{ user.isLoading ? '登录中...' : '登录' }}
        </button>
      </div>
      <div v-else>
        <p>欢迎，{{ user.displayName }} ({{ user.userInfo?.role }})</p>
        <p>isAdmin: {{ user.isAdmin }}</p>
        <button @click="user.logout()">退出</button>
      </div>
    </section>

    <!-- ===== 4. 购物车 Store (Setup 风格) ===== -->
    <section>
      <h2>4. 购物车 (Setup Store)</h2>
      <div class="products">
        <button v-for="p in products" :key="p.id" @click="cart.addItem(p)">
          添加 {{ p.name }} (¥{{ p.price }})
        </button>
      </div>
      <div v-if="cart.items.length">
        <div v-for="item in cart.items" :key="item.id" class="cart-item">
          <span>{{ item.name }} × {{ item.quantity }}</span>
          <span>¥{{ item.price * item.quantity }}</span>
          <button @click="cart.removeItem(item.id)">删除</button>
        </div>
        <p>小计: ¥{{ cart.subtotal }}</p>
        <input v-model="cart.couponCode" placeholder="优惠码: VIP10" />
        <p v-if="cart.discount > 0">优惠: -¥{{ cart.discount.toFixed(2) }}</p>
        <p><strong>合计: ¥{{ cart.total.toFixed(2) }}</strong></p>
        <button @click="handleCheckout">{{ checkoutMsg }}</button>
      </div>
      <p v-else>购物车为空</p>
    </section>

    <!-- ===== 5. $subscribe 监听 state 变化 ===== -->
    <section>
      <h2>5. $subscribe 监听 (state mutation log)</h2>
      <ul>
        <li v-for="(log, i) in mutationLogs" :key="i">{{ log }}</li>
      </ul>
    </section>

    <!-- ===== 6. $patch 批量更新 ===== -->
    <section>
      <h2>6. $patch 批量更新</h2>
      <button @click="batchUpdate">用 $patch 批量修改 user state</button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
// 推荐从统一出口导入
import { useCounterStore, useUserStore, useCartStore } from '@/stores'

// ---- 初始化 store ----
const counter = useCounterStore()
const user = useUserStore()
const cart = useCartStore()

// ---- storeToRefs：解构 state/getter 保持响应式 ----
// 注意：只对 state 和 getter 使用 storeToRefs，actions 直接解构
const { count, doubleCount } = storeToRefs(counter)
const { increment } = counter // action 直接解构，不需要 storeToRefs

const validCountRef = () => {
  // 可以正常访问到 ref 的值
  console.log('count', count, count.value)
}

// ---- 登录逻辑 ----
const username = ref('admin')
async function handleLogin() {
  await user.login(username.value, '123456')
}

// ---- 购物车数据 ----
const products = [
  { id: 1, name: '苹果', price: 5 },
  { id: 2, name: '香蕉', price: 3 },
  { id: 3, name: '橘子', price: 4 },
]

const checkoutMsg = ref('结账')
async function handleCheckout() {
  try {
    if (!user.isLoggedIn) {
      await user.login('admin', '123456')
    }
    checkoutMsg.value = '提交中...'
    const result = await cart.checkout()
    checkoutMsg.value = `订单 #${result.orderId} 成功！`
    setTimeout(() => (checkoutMsg.value = '结账'), 3000)
  } catch (e: any) {
    checkoutMsg.value = e.message
    setTimeout(() => (checkoutMsg.value = '结账'), 2000)
  }
}

// ---- $subscribe：监听 state 变化（类似 watch，但更精细）----
const mutationLogs = ref<string[]>([])
// $subscribe 返回取消订阅函数
const unsubscribe = cart.$subscribe((mutation, state) => {
  // mutation.type: 'direct' | 'patch object' | 'patch function'
  mutationLogs.value.unshift(`[${mutation.type}] items: ${state.items.length} 件`)
  if (mutationLogs.value.length > 5) mutationLogs.value.pop()
})
onUnmounted(unsubscribe) // 组件卸载时取消订阅，防止内存泄漏

// ---- $patch 批量更新 state（比逐个赋值更高效，只触发一次响应）----
function batchUpdate() {
  // 方式一：对象写法
  user.$patch({ token: 'patched-token' })
  // 方式二：函数写法（适合数组操作）
  user.$patch((state) => {
    state.userInfo = { id: 99, name: 'Patched User', role: 'user' }
  })
}
</script>

<style scoped>
.demo {
  max-width: 640px;
  margin: 0 auto;
  padding: 20px;
  font-family: monospace;
}

section {
  border: 1px solid #ddd;
  padding: 16px;
  margin-bottom: 16px;
  border-radius: 8px;
}

h2 {
  margin: 0 0 12px;
  font-size: 14px;
  color: #666;
}

button {
  margin: 4px;
  padding: 4px 12px;
  cursor: pointer;
}

input {
  margin: 4px;
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.cart-item {
  display: flex;
  gap: 12px;
  align-items: center;
  margin: 4px 0;
}
</style>
