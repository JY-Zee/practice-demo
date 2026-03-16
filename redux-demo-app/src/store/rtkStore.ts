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

