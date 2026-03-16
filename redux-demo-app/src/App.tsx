import { useState } from 'react'
import './App.css'
import { ClassicCounter } from './components/ClassicCounter'
import { ReduxCompareNotes } from './components/ReduxCompareNotes'
import { RtkCounter } from './features/counter/RtkCounter'
import { TodoList } from './features/todos/TodoList'

type TabKey = 'classic' | 'rtk'

function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('classic')

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Redux 学习 Demo：经典 Redux vs Redux Toolkit</h1>
        <p>
          通过一个计数器和待办列表示例，从“自己实现 Redux
          核心”到使用官方推荐的 Redux Toolkit，逐步理解 Redux 的数据流与原理。
        </p>
      </header>

      <nav className="tabs">
        <button
          type="button"
          className={activeTab === 'classic' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('classic')}
        >
          经典 Redux 实现（手写 store）
        </button>
        <button
          type="button"
          className={activeTab === 'rtk' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('rtk')}
        >
          Redux Toolkit 实现（推荐）
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'classic' ? (
          <ClassicCounter />
        ) : (
          <>
            <RtkCounter />
            <div style={{ marginTop: 24 }}>
              <TodoList />
            </div>
          </>
        )}

        <ReduxCompareNotes />
      </main>
    </div>
  )
}

export default App
