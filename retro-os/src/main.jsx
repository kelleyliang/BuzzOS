import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import BootScreen from './components/BootScreen.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BootScreen><App /></BootScreen>
  </StrictMode>,
)
