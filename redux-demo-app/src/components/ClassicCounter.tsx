import { useEffect, useSyncExternalStore, useState } from 'react'
import type { ClassicRootState, ClassicRootAction } from '../store/classicStore'
import { classicStore } from '../store/classicStore'

function useClassicSelector<T>(selector: (state: ClassicRootState) => T): T {
  return useSyncExternalStore(
    classicStore.subscribe,
    () => selector(classicStore.getState()),
  )
}

function useClassicDispatch() {
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    const unsubscribe = classicStore.subscribe(() => {
      forceUpdate((n) => n + 1)
    })
    return unsubscribe
  }, [])

  return (action: ClassicRootAction) => {
    classicStore.dispatch(action)
  }
}

export function ClassicCounter() {
  const count = useClassicSelector((state) => state.counter.value)
  const todos = useClassicSelector((state) => state.todos.list)
  const dispatch = useClassicDispatch()

  const [todoText, setTodoText] = useState('')

  return (
    <div>
      <h2>经典 Redux 实现（基于 mini-redux）</h2>
      <p>
        这里没有使用 Redux 官方 store，而是用我们在
        <code>mini-redux.ts</code> 里自己实现的 <code>createStore</code> 和
        <code>combineReducers</code>。
      </p>

      <section>
        <h3>计数器</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => dispatch({ type: 'classic/decrement' })}
          >
            -1
          </button>
          <span>当前值：{count}</span>
          <button
            type="button"
            onClick={() => dispatch({ type: 'classic/increment' })}
          >
            +1
          </button>
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h3>待办列表（Todos）</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const text = todoText.trim()
            if (!text) return
            dispatch({ type: 'classic/addTodo', payload: text })
            setTodoText('')
          }}
        >
          <input
            type="text"
            value={todoText}
            onChange={(e) => setTodoText(e.target.value)}
            placeholder="输入待办事项..."
          />
          <button type="submit" style={{ marginLeft: 8 }}>
            添加
          </button>
        </form>

        <ul style={{ marginTop: 12 }}>
          {todos.map((todo) => (
            <li key={todo.id}>
              <label style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() =>
                    dispatch({
                      type: 'classic/toggleTodo',
                      payload: todo.id,
                    })
                  }
                />
                <span
                  style={{
                    marginLeft: 8,
                    textDecoration: todo.completed ? 'line-through' : 'none',
                  }}
                >
                  {todo.text}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

