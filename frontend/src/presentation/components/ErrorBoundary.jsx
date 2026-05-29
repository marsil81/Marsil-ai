import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error) {
    console.warn('ErrorBoundary caught:', error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#00152b',
          fontFamily: "'Share Tech Mono', monospace",
        }}>
          <div style={{
            textAlign: 'center', maxWidth: '480px', padding: '40px',
          }}>
            <AlertTriangle size={40} style={{ color: '#ef4444', marginBottom: '16px' }} />
            <div style={{
              fontFamily: 'Orbitron', fontSize: '1rem', color: '#ef4444',
              letterSpacing: '2px', marginBottom: '12px',
            }}>
              SYSTEM MALFUNCTION
            </div>
            <div style={{
              fontSize: '0.65rem', color: 'var(--text-dim)',
              lineHeight: '1.6', marginBottom: '24px',
            }}>
              A critical rendering error occurred. The interface has been halted to prevent data corruption.
            </div>
            <div style={{
              padding: '8px 14px', background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)', borderRadius: '6px',
              fontSize: '0.55rem', color: '#f87171', marginBottom: '24px',
              fontFamily: 'monospace', wordBreak: 'break-all',
            }}>
              {this.state.error?.message || 'Unknown error'}
            </div>
            <button onClick={() => window.location.reload()} style={{
              padding: '10px 28px', background: 'rgba(0,162,255,0.1)',
              border: '1px solid var(--primary)', borderRadius: '6px',
              color: 'var(--primary)', cursor: 'pointer',
              fontFamily: 'Orbitron', fontSize: '0.65rem', letterSpacing: '1px',
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              transition: 'all 0.2s',
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,162,255,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,162,255,0.1)'}
            >
              <RefreshCw size={14} /> REBOOT INTERFACE
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
