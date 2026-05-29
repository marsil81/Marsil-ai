import { createRoot } from 'react-dom/client'
import App from './presentation/pages/App.jsx'
import { ErrorBoundary } from './presentation/components/ErrorBoundary.jsx'
import './application/i18n.js'

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
