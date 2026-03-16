import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from '../../store/rtkStore'
import { addByAmount, decrement, increment } from './counterSlice'

export function RtkCounter() {
  const value = useSelector((state: RootState) => state.counter.value)
  const dispatch = useDispatch<AppDispatch>()
  const [input, setInput] = useState('5')

  const amount = Number.isNaN(Number(input)) ? 0 : Number(input)

  return (
    <div>
      <h2>Redux Toolkit 计数器</h2>
      <p>
        使用 <code>createSlice</code> 定义 reducer 和 action，直接在 reducer 里“修改
        state”，由 Immer 帮你生成不可变更新。
      </p>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button type="button" onClick={() => dispatch(decrement())}>
          -1
        </button>
        <span>当前值：{value}</span>
        <button type="button" onClick={() => dispatch(increment())}>
          +1
        </button>
      </div>

      <div style={{ marginTop: 12 }}>
        <input
          type="number"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ width: 80 }}
        />
        <button
          type="button"
          onClick={() => dispatch(addByAmount(amount))}
          style={{ marginLeft: 8 }}
        >
          加上指定数值
        </button>
      </div>
    </div>
  )
}

