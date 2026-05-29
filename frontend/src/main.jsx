import { createRoot } from 'react-dom/client'
import App from './presentation/pages/App.jsx'
import { ErrorBoundary } from './presentation/components/ErrorBoundary.jsx'
import './application/i18n.js'
import { Suspense } from 'react'

// ═══ Cyber Loading Splash (shown while i18n initializes) ═══
function CyberSplash() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '24px',
      background: '#00152b',
      fontFamily: "'Orbitron', monospace",
    }}>
      <div style={{
        fontFamily: 'Orbitron', fontSize: '2.5rem', fontWeight: 700,
        color: '#00a2ff', letterSpacing: '8px',
        textShadow: '0 0 30px rgba(0,162,255,0.5)',
      }}>
        MARSIL
      </div>
      <div style={{
        width: '120px', height: '2px',
        background: 'linear-gradient(90deg, transparent, #00ffd5, transparent)',
        animation: 'splashScan 1.5s ease-in-out infinite',
      }} />
      <div style={{
        fontSize: '0.65rem', color: 'rgba(0,184,255,0.5)',
        letterSpacing: '3px',
      }}>
        INITIALIZING NEURAL INTERFACE...
      </div>
      <style>{`
        @keyframes splashScan {
          0% { transform: scaleX(0.3); opacity: 0.3; }
          50% { transform: scaleX(1); opacity: 1; }
          100% { transform: scaleX(0.3); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <Suspense fallback={<CyberSplash />}>
      <App />
    </Suspense>
  </ErrorBoundary>
)
