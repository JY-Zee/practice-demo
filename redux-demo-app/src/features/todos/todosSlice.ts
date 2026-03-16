import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export interface Todo {
  id: number
  title: string
  completed: boolean
}

export interface TodosState {
  items: Todo[]
  loading: boolean
  error: string | null
}

const initialState: TodosState = {
  items: [],
  loading: false,
  error: null,
}

// 模拟异步获取 todo 列表
export const fetchTodos = createAsyncThunk<Todo[]>('todos/fetchTodos', async () => {
  await new Promise((resolve) => setTimeout(resolve, 800))
  return [
    { id: 1, title: '学习 Redux 核心原理', completed: false },
    { id: 2, title: '对比经典 Redux 与 RTK', completed: false },
  ]
})

export const todosSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    toggleTodo(state, action: PayloadAction<number>) {
      const todo = state.items.find((t) => t.id === action.payload)
      if (todo) {
        todo.completed = !todo.completed
      }
    },
    addTodo(state, action: PayloadAction<string>) {
      const nextId =
        state.items.length > 0
          ? Math.max(...state.items.map((t) => t.id)) + 1
          : 1
      state.items.push({
        id: nextId,
        title: action.payload,
        completed: false,
      })
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodos.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTodos.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchTodos.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? '加载失败'
      })
  },
})

export const { toggleTodo, addTodo } = todosSlice.actions

