import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/btime-tokens.css'
import './styles/app-tokens.css'
import './styles/base.css'
import './styles/components.css'
import './styles/shell.css'
import './prototype/prototype.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
