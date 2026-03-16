## Redux 学习 Demo 项目介绍

这个项目是一个用于学习 Redux 的小型 Demo，基于 **React + TypeScript + Vite** 搭建。

核心目标：

- **先通过手写一个极简 Redux 核心（mini-redux）理解原理**
- **再对比 Redux Toolkit（RTK）推荐写法，感受开发体验差异**

### 运行方式

在 `redux-demo-app` 目录下：

```bash
pnpm install
pnpm dev
```

浏览器访问终端输出的地址（通常是 `http://localhost:5173`）即可。

### 页面结构概览

- 顶部 Tab：
  - **经典 Redux 实现（手写 store）**
    - 使用 `src/store/mini-redux.ts` 中手写的 `createStore` 和 `combineReducers`
    - Store 定义在 `src/store/classicStore.ts`
    - Demo 组件是 `src/components/ClassicCounter.tsx`
  - **Redux Toolkit 实现（推荐）**
    - Slice 写在 `src/features/...`
    - Store 配置在 `src/store/rtkStore.ts`
    - Demo 组件是 `RtkCounter`（计数器）和 `TodoList`（含异步）
- 对比说明区：
  - `src/components/ReduxCompareNotes.tsx` 中，用文字对比了经典 Redux 与 RTK 的差异

### Redux 核心数据流（逻辑图）

```mermaid
flowchart LR
  view[View(React组件)] -->|dispatch(action)| dispatchNode[dispatch]
  dispatchNode --> reducer[Reducer(纯函数)]
  reducer --> state[New State]
  state --> store[Store]
  store -->|subscribe(listener)| view
```

解释：

1. **View 触发 dispatch**：组件中调用 `dispatch(action)`。
2. **Reducer 计算新状态**：Reducer 是纯函数，根据旧 `state` 和 `action` 计算出新 `state`。
3. **Store 保存状态并通知订阅者**：Store 内部保存当前 `state`，`dispatch` 后遍历所有订阅者。
4. **View 重新渲染**：React 组件通过 `getState()` 或 `useSelector` 读取最新 `state`，触发更新。

---

## mini-redux 源码讲解（核心原理）

文件路径：`src/store/mini-redux.ts`

```ts
// 一个极简版 Redux 实现，帮助理解核心原理

export type Reducer<S, A> = (state: S | undefined, action: A) => S

export type Unsubscribe = () => void

export interface Store<S, A> {
  getState: () => S
  dispatch: (action: A) => void
  subscribe: (listener: () => void) => Unsubscribe
}
```

### 1. 类型定义：Reducer / Store / Unsubscribe

- `Reducer<S, A>`：Redux 中最核心的概念之一，**纯函数**：
  - 入参：`state`（允许是 `undefined`，方便初始化）；`action`。
  - 出参：新的 `state`。
- `Unsubscribe`：取消订阅时返回的函数类型。
- `Store<S, A>`：简化版 Store 接口，暴露三个方法：
  - `getState()`：获取当前全局状态。
  - `dispatch(action)`：派发 action，触发状态更新。
  - `subscribe(listener)`：订阅状态变化；返回一个 `Unsubscribe` 用于取消订阅。

这部分是在给 Redux 「概念模型」定类型，后面的实现需要满足这个接口。

```ts
export function createStore<S, A>(
  reducer: Reducer<S, A>,
  preloadedState?: S,
): Store<S, A> {
  let currentState = preloadedState as S
  const listeners: Array<() => void> = []

  const getState = () => currentState

  const dispatch = (action: A) => {
    currentState = reducer(currentState, action)
    listeners.forEach((listener) => listener())
  }

  const subscribe = (listener: () => void): Unsubscribe => {
    listeners.push(listener)
    return () => {
      const index = listeners.indexOf(listener)
      if (index !== -1) {
        listeners.splice(index, 1)
      }
    }
  }

  // 初始化 state
  dispatch({} as A)

  return {
    getState,
    dispatch,
    subscribe,
  }
}
```

### 2. `createStore`：闭包里维护 state 和 listeners

- **内部状态与订阅者列表**
  - `currentState`：当前整棵 Redux 状态树，保存在闭包变量中，对外不可直接修改。
  - `listeners`：订阅者列表（通常是 React 组件的刷新函数）。
- **`getState`**
  - 直接返回 `currentState`。
  - 关键点：**外界无法直接改 `currentState`，只能通过 `dispatch` 改，这就是 Redux 把“修改入口统一”的核心**。
- **`dispatch`**
  - `currentState = reducer(currentState, action)`：
    - 实际的业务逻辑完全交给 reducer（纯函数），store 本身只负责「转发」和「存结果」。
  - `listeners.forEach(listener => listener())`：
    - 每次 `dispatch` 后通知所有订阅者，React 组件会在 listener 里 `setState` 触发重渲染。
- **`subscribe`**
  - 把 listener 推入 `listeners` 数组。
  - 返回一个取消订阅函数：调用时会从数组中删除这个 listener。
- **初始化 state：`dispatch({} as A)`**
  - 刚创建 store 时，`currentState` 还没经过 reducer 计算。
  - 通过一次“假 action”的 `dispatch`，所有 reducer 会在「state 为 undefined」时返回各自的初始值，最终组合出完整的初始根状态。
  - 正式 Redux 实现里会 dispatch 一个特殊类型 `@@redux/INIT...`，这里出于简化直接用空对象强转为 `A`。

总结：**`createStore` 本质就是一个闭包对象，内部保存 `state + listeners`，并提供统一的 `dispatch` 和 `subscribe` 接口。**

```ts
type ReducersMapObject<S, A> = {
  [K in keyof S]: Reducer<S[K], A>
}

export function combineReducers<S, A>(
  reducers: ReducersMapObject<S, A>,
): Reducer<S, A> {
  return (state: S | undefined, action: A): S => {
    const nextState: Partial<S> = {}
    const currentState = state || ({} as S)

    ;(Object.keys(reducers) as Array<keyof S>).forEach((key) => {
      const reducer = reducers[key]
      const previousSliceState = currentState[key]
      const nextSliceState = reducer(previousSliceState, action)
      nextState[key] = nextSliceState
    })

    return nextState as S
  }
}
```

### 3. `combineReducers`：把多颗小树组合成一棵大树

- `ReducersMapObject<S, A>`：
  - 表示「根 state 的每个字段」对应一个自己的 reducer。
  - 例如：
    ```ts
    interface RootState {
      counter: CounterState
      todos: TodosState
    }

    const reducers: ReducersMapObject<RootState, Action> = {
      counter: counterReducer,
      todos: todosReducer,
    }
    ```

- `combineReducers` 返回的是一个「根 reducer」函数 `(state, action) => newState`：
  1. `currentState = state || ({} as S)`：
     - 第一次调用时 `state` 为 `undefined`，用空对象占位。
  2. 遍历每个 key：
     - 拿到对应的子 reducer。
     - 取出这一块旧 state `previousSliceState`。
     - 调用子 reducer，得到新的 `nextSliceState`。
     - 放到 `nextState[key]` 上。
  3. 返回合成后的 `nextState`。

这就是 Redux 的「模块化状态树」思想：**每个 slice 只关心自己的那块 state，根 reducer 负责按 key 把它们拼起来。**

---

## 推荐的阅读顺序

1. **先读 `src/store/mini-redux.ts`（本文件所讲）**
   - 搞清楚 `createStore` 如何保存 state、如何 dispatch、如何通知订阅者。
   - 搞清楚 `combineReducers` 如何把多个 reducer 组合成一个根 reducer。
2. **再看 `src/store/classicStore.ts` + `src/components/ClassicCounter.tsx`**
   - 看看基于 `mini-redux`，经典 Redux 写法长什么样。
3. **最后对比 RTK 的 `counterSlice` / `todosSlice` / `rtkStore`**
   - 感受同样的业务逻辑，在 Redux Toolkit 下代码量和思维负担都明显下降。

---

## classicStore.ts 讲解：基于 mini-redux 的经典 Redux 写法

文件路径：`src/store/classicStore.ts`

```ts
import { combineReducers, createStore } from './mini-redux'

// --------- action 类型与 action 定义 ----------

export type ClassicCounterAction =
  | { type: 'classic/increment' }
  | { type: 'classic/decrement' }

export type ClassicTodoAction =
  | { type: 'classic/addTodo'; payload: string }
  | { type: 'classic/toggleTodo'; payload: number }

export type ClassicRootAction = ClassicCounterAction | ClassicTodoAction
```

### 1. Action 类型定义：手写 action type + payload

- 这里故意使用了「字符串常量类型」表示 action type，例如 `'classic/increment'`。
- `ClassicCounterAction`：
  - 只关注计数器业务（加一 / 减一）。
- `ClassicTodoAction`：
  - 包含了 `payload`：
    - `addTodo` 需要一个 `string` 文本。
    - `toggleTodo` 需要一个 `number` id。
- `ClassicRootAction`：
  - 把两种 action 合并成一个联合类型，作为整个应用的「顶层 action 类型」。

在经典 Redux 中，这一步通常会拆成：

- 单独定义一堆常量字符串（`INCREMENT`、`DECREMENT`、`ADD_TODO` 等）。
- 写 action creator 函数返回这些对象。

在这个 Demo 中，为了直观，直接用 TypeScript 类型把这些对象结构写死。

```ts
// --------- counter reducer ----------

export interface ClassicCounterState {
  value: number
}

const initialCounterState: ClassicCounterState = {
  value: 0,
}

function counterReducer(
  state: ClassicCounterState | undefined,
  action: ClassicRootAction,
): ClassicCounterState {
  if (!state) {
    return initialCounterState
  }

  switch (action.type) {
    case 'classic/increment':
      return { ...state, value: state.value + 1 }
    case 'classic/decrement':
      return { ...state, value: state.value - 1 }
    default:
      return state
  }
}
```

### 2. 计数器 reducer：纯函数 + 不可变更新

- `ClassicCounterState`：仅包含一个 `value`。
- `initialCounterState`：初始值为 0，对应 `state` 为 `undefined` 时的返回。
- `counterReducer`：
  - 第一次调用（`state === undefined`）时返回 `initialCounterState`。
  - 之后每次根据 `action.type`：
    - 加一：返回一个新的对象 `{ ...state, value: state.value + 1 }`。
    - 减一：同理。
  - 注意：**不会直接修改传入的 `state`，而是返回一个新对象（不可变更新）。**

这一段是标准、教科书式的 Redux reducer 写法：

- 使用 `switch(action.type)`。
- 每个 case 返回新的 state。
- default 分支必须返回原来的 state（保证未知 action 时不会「乱改 state」）。

```ts
// --------- todos reducer ----------

export interface ClassicTodo {
  id: number
  text: string
  completed: boolean
}

export interface ClassicTodosState {
  list: ClassicTodo[]
}

const initialTodosState: ClassicTodosState = {
  list: [],
}

function todosReducer(
  state: ClassicTodosState | undefined,
  action: ClassicRootAction,
): ClassicTodosState {
  if (!state) {
    return initialTodosState
  }

  switch (action.type) {
    case 'classic/addTodo': {
      const newTodo: ClassicTodo = {
        id: state.list.length + 1,
        text: action.payload,
        completed: false,
      }
      return { ...state, list: [...state.list, newTodo] }
    }
    case 'classic/toggleTodo': {
      return {
        ...state,
        list: state.list.map((todo) =>
          todo.id === action.payload
            ? { ...todo, completed: !todo.completed }
            : todo,
        ),
      }
    }
    default:
      return state
  }
}
```

### 3. todos reducer：演示列表 + 不可变数组操作

- `ClassicTodo`：单条 todo 的结构。
- `ClassicTodosState`：内部维护一个 `list: ClassicTodo[]`。
- `todosReducer`：
  - 初次调用时返回 `initialTodosState`。
  - `classic/addTodo`：
    - 计算一个新的 `id`。
    - 构造 `newTodo` 对象。
    - 返回新的 state：`{ ...state, list: [...state.list, newTodo] }`。
  - `classic/toggleTodo`：
    - 使用 `map` 遍历 `list`，找到要修改的 todo，返回一个新的对象（用 `{ ...todo, completed: !todo.completed }`），其他保持不变。
    - 这里再次体现「不可变更新」：**不直接改原数组 / 原对象，而是构建新数组 / 新对象**。

这一段对比 RTK 的地方在于：RTK 写法里可以直接写 `todo.completed = !todo.completed`，因为有 Immer 帮你做不可变转换；而这里必须手动写拷贝逻辑。

```ts
// --------- 根 reducer 与 store ----------

export interface ClassicRootState {
  counter: ClassicCounterState
  todos: ClassicTodosState
}

const rootReducer = combineReducers<ClassicRootState, ClassicRootAction>({
  counter: counterReducer,
  todos: todosReducer,
})

export const classicStore = createStore<ClassicRootState, ClassicRootAction>(
  rootReducer,
)
```

### 4. 根 reducer 与 classicStore

- `ClassicRootState`：
  - 说明整个 Redux 状态树长什么样：有 `counter` 和 `todos` 两个分支。
- `rootReducer`：
  - 使用我们在 `mini-redux.ts` 手写的 `combineReducers`。
  - 将 `counterReducer` 和 `todosReducer` 组合成一个大的根 reducer。
- `classicStore`：
  - 使用我们手写的 `createStore` 创建 store：
    - 内部保存 `ClassicRootState` 类型的 `currentState`。
    - 暴露 `getState / dispatch / subscribe`。

结合 `ClassicCounter.tsx` 来看，你会发现：

- 这就是**早期 Redux 官方文档里的那套模式**，只是这里的 `createStore`、`combineReducers` 是我们自己实现的精简版。
- 比 RTK 更「啰嗦」，但非常直观、接近 Redux 源码思路。

---

## Redux Toolkit（RTK）部分讲解

RTK 相关的核心文件：

- `src/features/counter/counterSlice.ts`
- `src/features/todos/todosSlice.ts`
- `src/store/rtkStore.ts`

### 1. counterSlice：用 createSlice 写计数器

```ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface CounterState {
  value: number
}

const initialState: CounterState = {
  value: 0,
}

export const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment(state) {
      state.value += 1
    },
    decrement(state) {
      state.value -= 1
    },
    addByAmount(state, action: PayloadAction<number>) {
      state.value += action.payload
    },
  },
})

export const { increment, decrement, addByAmount } = counterSlice.actions
```

对比经典写法的几个关键点：

- **一个 `createSlice` 包办了 reducer + action type + action creator**：
  - `name`：会参与生成 action type，如 `counter/increment`。
  - `initialState`：初始状态。
  - `reducers` 对象：
    - 每个 key 对应一个 case reducer，相当于经典 Redux `switch` 中的一个 `case` 分支。
    - RTK 自动生成对应的 action creator，比如 `increment()`、`decrement()`。
- **可以“直接修改 state”**：
  - 例如 `state.value += 1`。
  - 实际上内部用 Immer 把这些「看起来可变」的写法转换成不可变更新，最终仍然符合 Redux 的不可变要求。

你可以把 `createSlice` 想象成：**帮你自动写了一堆模板代码（switch + action creator），你只专注于“这个 action 对 state 做了什么”。**

### 2. todosSlice：同步 + 异步（createAsyncThunk）

```ts
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'

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
```

- `TodosState`：
  - 除了 `items` 外，还维护了 `loading` 和 `error`，方便展示异步状态。
- `createAsyncThunk`：
  - 第一个参数 `'todos/fetchTodos'` 是 action type 前缀。
  - 泛型 `<Todo[]>` 指定最终 `fulfilled` 时的 payload 类型。
  - 函数体里可以写真实的 `fetch` 调用，这里用 `setTimeout` 模拟网络请求。
  - 它会自动生成三个 action type：
    - `todos/fetchTodos/pending`
    - `todos/fetchTodos/fulfilled`
    - `todos/fetchTodos/rejected`

```ts
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
```

#### reducers 部分（同步逻辑）

- `toggleTodo`：
  - 查找对应 id 的 todo，直接改 `todo.completed`。
  - 再次体现「可变写法 + Immer 自动转换」。
- `addTodo`：
  - 计算一个新的 id。
  - `state.items.push(...)` 直接往数组里 push。

#### extraReducers 部分（异步逻辑）

- 使用 `builder.addCase(...)` 处理 `fetchTodos` 的三个生命周期：
  - `pending`：开始加载，`loading = true`，`error = null`。
  - `fulfilled`：请求成功，`loading = false`，用 payload 覆盖 `items`。
  - `rejected`：请求失败，`loading = false`，记录错误信息。

对比经典 Redux：

- 经典做法需要手写三种 action type + 对应的 case 分支。
- 如果不用 RTK，你还要自己写 thunk 中间件或手动管理异步。
- RTK 把这套「pending / fulfilled / rejected」模式封装成统一的 `createAsyncThunk`，大大减少模板代码。

### 3. rtkStore.ts：configureStore 汇总 slices

```ts
import { configureStore } from '@reduxjs/toolkit'
import { counterSlice } from '../features/counter/counterSlice'
import { todosSlice } from '../features/todos/todosSlice'

export const rtkStore = configureStore({
  reducer: {
    counter: counterSlice.reducer,
    todos: todosSlice.reducer,
  },
})

export type RootState = ReturnType<typeof rtkStore.getState>
export type AppDispatch = typeof rtkStore.dispatch
```

- `configureStore`：
  - 功能类似我们自己实现的 `createStore + combineReducers`，但包含更多默认配置：
    - 自动组合多个 slice reducer。
    - 默认集成 `redux-thunk`。
    - 开启 Redux DevTools 支持。
- `reducer` 字段：
  - 使用对象形式声明各个 slice 的 reducer：
    - `counter: counterSlice.reducer`
    - `todos: todosSlice.reducer`
  - 这会生成与经典 Redux `combineReducers` 等价的根 reducer。
- 类型导出：
  - `RootState`：整个 Redux 状态树的类型（供 `useSelector` 使用）。
  - `AppDispatch`：store 的 dispatch 类型（供 TS 推断 thunk 等中间件的类型）。

结合 `src/main.tsx`：

- 用 `<Provider store={rtkStore}>` 把 store 注入 React。
- 在组件里用 `useSelector<RootState>` 和 `useDispatch<AppDispatch>` 来读写 state。

---

## 小结：classicStore vs RTK 的本质区别

1. **代码结构**：
   - classic：手动维护 action type、reducer、store 组合。
   - RTK：`createSlice` + `configureStore` 一站式管理。
2. **不可变更新**：
   - classic：必须手动写 `return { ...state, ... }` / `map` / `filter`。
   - RTK：可以“直接改”，由 Immer 自动生成不可变更新。
3. **异步逻辑**：
   - classic：往往要手动配置 thunk / saga，并自己管理三种状态（请求中 / 成功 / 失败）。
   - RTK：`createAsyncThunk` + `extraReducers` 提供统一模式。
4. **推荐实践**：
   - 经典 Redux 更适合「理解原理、读老代码」。
   - 新项目、实际业务强烈推荐用 Redux Toolkit。


