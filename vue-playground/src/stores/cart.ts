/**
 * Setup Store 风格 (推荐，类似 Composition API)
 * 适合：复杂逻辑、需要 watch/watchEffect、组合多个 store
 */
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useUserStore } from './user'

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
}

export const useCartStore = defineStore('cart', () => {
  // ---- State (ref/reactive) ----
  const items = ref<CartItem[]>([])
  const couponCode = ref('')

  // ---- Getters (computed) ----
  const totalCount = computed(() => items.value.reduce((sum, i) => sum + i.quantity, 0))

  const subtotal = computed(() => items.value.reduce((sum, i) => sum + i.price * i.quantity, 0))

  const discount = computed(() => (couponCode.value === 'VIP10' ? subtotal.value * 0.1 : 0))

  const total = computed(() => subtotal.value - discount.value)

  // ---- Actions (functions) ----
  function addItem(product: Omit<CartItem, 'quantity'>) {
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

  // 跨 store 调用：结账时需要检查用户登录状态
  async function checkout() {
    const userStore = useUserStore() // 在 action 内部调用，避免循环依赖
    if (!userStore.isLoggedIn) {
      throw new Error('请先登录')
    }
    // 模拟提交订单
    await new Promise((r) => setTimeout(r, 800))
    clearCart()
    return { orderId: Date.now() }
  }

  return {
    items,
    couponCode,
    totalCount,
    subtotal,
    discount,
    total,
    addItem,
    removeItem,
    clearCart,
    checkout,
  }
})
