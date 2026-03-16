// 一个极简版 Redux 实现，帮助理解核心原理

/**
 * Reducer<S, A>
含义：一个 纯函数，接收当前 state 和 action，返回新的 state。
state 允许是 undefined，方便 reducer 在「第一次调用」时返回初始值。

Unsubscribe
就是取消订阅时返回的函数类型：调用它就会把这个订阅 listener 移除。

Store<S, A> 接口
三个核心方法，对应官方 Redux API：
getState(): S：拿当前全局状态。
dispatch(action: A): void：派发一个 action，触发 reducer 更新。
subscribe(listener: () => void): Unsubscribe：订阅变化；每次 dispatch 后，这些 listener 会被依次调用。返回一个 Unsubscribe 用于取消订阅。

*/
export type Reducer<S, A> = (state: S | undefined, action: A) => S

export type Unsubscribe = () => void

export interface Store<S, A> {
  getState: () => S
  dispatch: (action: A) => void
  subscribe: (listener: () => void) => Unsubscribe
}

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

type ReducersMapObject<S, A> = {
  [K in keyof S]: Reducer<S[K], A>
}

export function combineReducers<S, A>(
  reducers: ReducersMapObject<S, A>,
): Reducer<S, A> {
  return (state: S | undefined, action: A): S => {
    const nextState: Partial<S> = {}
    const currentState = state || ({} as S)

      ; (Object.keys(reducers) as Array<keyof S>).forEach((key) => {
        const reducer = reducers[key]
        const previousSliceState = currentState[key]
        const nextSliceState = reducer(previousSliceState, action)
        nextState[key] = nextSliceState
      })

    return nextState as S
  }
}

