import { combineReducers, createStore } from './mini-redux'

// --------- action 类型与 action 定义 ----------

export type ClassicCounterAction =
  | { type: 'classic/increment' }
  | { type: 'classic/decrement' }

export type ClassicTodoAction =
  | { type: 'classic/addTodo'; payload: string }
  | { type: 'classic/toggleTodo'; payload: number }

export type ClassicRootAction = ClassicCounterAction | ClassicTodoAction

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

