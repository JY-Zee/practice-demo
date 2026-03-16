import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import './index.css'
import App from './App.tsx'
import { rtkStore } from './store/rtkStore'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={rtkStore}>
      <App />
    </Provider>
  </StrictMode>,
)
