import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './presentation/pages/App.jsx'
import './application/i18n.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
