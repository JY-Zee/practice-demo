import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from '../../store/rtkStore'
import { addTodo, fetchTodos, toggleTodo } from './todosSlice'

export function TodoList() {
  const { items, loading, error } = useSelector(
    (state: RootState) => state.todos,
  )
  const dispatch = useDispatch<AppDispatch>()
  const [text, setText] = useState('')

  return (
    <div>
      <h2>Redux Toolkit 待办列表（含异步）</h2>
      <p>
        使用 <code>createAsyncThunk</code> 处理异步请求，在{' '}
        <code>extraReducers</code> 里根据 pending / fulfilled / rejected 更新
        loading 和 error。
      </p>

      <button
        type="button"
        onClick={() => dispatch(fetchTodos())}
        disabled={loading}
      >
        {loading ? '加载中...' : '从「服务器」加载 Todo'}
      </button>
      {error && (
        <p style={{ color: 'red', marginTop: 8 }}>加载失败：{error}</p>
      )}

      <form
        style={{ marginTop: 12 }}
        onSubmit={(e) => {
          e.preventDefault()
          const value = text.trim()
          if (!value) return
          dispatch(addTodo(value))
          setText('')
        }}
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="本地添加一个 Todo"
        />
        <button type="submit" style={{ marginLeft: 8 }}>
          添加
        </button>
      </form>

      <ul style={{ marginTop: 12 }}>
        {items.map((todo) => (
          <li key={todo.id}>
            <label style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => dispatch(toggleTodo(todo.id))}
              />
              <span
                style={{
                  marginLeft: 8,
                  textDecoration: todo.completed ? 'line-through' : 'none',
                }}
              >
                {todo.title}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}

