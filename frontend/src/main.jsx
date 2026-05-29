import { createRoot } from 'react-dom/client'
import App from './presentation/pages/App.jsx'
import { ErrorBoundary } from './presentation/components/ErrorBoundary.jsx'
import { CyberSplash } from './presentation/components/CyberSplash.jsx'
import './application/i18n.js'
import { Suspense } from 'react'

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <Suspense fallback={<CyberSplash />}>
      <App />
    </Suspense>
  </ErrorBoundary>
)
