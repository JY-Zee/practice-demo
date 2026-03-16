export function ReduxCompareNotes() {
  return (
    <section style={{ marginTop: 24 }}>
      <h2>经典 Redux vs Redux Toolkit 对比</h2>
      <ul>
        <li>
          <strong>经典 Redux</strong>：需要手写 action type 字符串、action
          creator、switch...case reducer，并手动组合 reducer、配置中间件。
        </li>
        <li>
          <strong>Redux Toolkit</strong>：用 <code>createSlice</code>{' '}
          一次性声明 name、initialState 和 reducers，自动生成 action
          函数和 reducer。
        </li>
        <li>
          <strong>不可变更新</strong>：
          经典 Redux 需要返回新的对象，不能直接修改原 state；RTK 内部基于
          Immer，可以在 reducer 里直接“修改 state”，由它生成不可变的新对象。
        </li>
        <li>
          <strong>异步逻辑</strong>：
          经典写法里通常要引入 redux-thunk 或 saga；RTK 直接提供{' '}
          <code>createAsyncThunk</code> 并在 <code>extraReducers</code>{' '}
          里集中处理。
        </li>
        <li>
          <strong>实际项目建议</strong>：
          官方推荐优先使用 Redux Toolkit，经典 Redux
          更适合作为理解原理和阅读老代码的基础。
        </li>
      </ul>
    </section>
  )
}

