import { useState, useEffect } from 'react';

/**
 * Cyber Loading Splash (shown while i18n initializes).
 * Features a sequential diagnostic boot sequence with subsystem checks.
 * Extracted to its own file for Fast Refresh compatibility.
 */
export function CyberSplash() {
  const [bootPhase, setBootPhase] = useState(0);
  const [subsystems, setSubsystems] = useState([
    { label: 'WS', name: 'WEBSOCKET PROTOCOL', done: false, ok: false },
    { label: 'API', name: 'API GATEWAY', done: false, ok: false },
    { label: 'CLD', name: 'CLAUDE ENGINE', done: false, ok: false },
    { label: 'PRX', name: 'PROXY SERVICE', done: false, ok: false },
    { label: 'MEM', name: 'MEMORY CORE', done: false, ok: false },
    { label: 'SYS', name: 'SYSTEM INTEGRITY', done: false, ok: false },
  ]);

  // Progress: 0=startup, 1-6=each subsystem, 7=complete
  useEffect(() => {
    if (bootPhase >= 6) return;
    const delay = 200 + Math.random() * 400;
    const timer = setTimeout(() => {
      setBootPhase(prev => prev + 1);
      setSubsystems(prev => prev.map((s, i) =>
        i === bootPhase ? { ...s, done: true, ok: Math.random() > 0.15 } : s
      ));
    }, delay);
    return () => clearTimeout(timer);
  }, [bootPhase]);

  const isComplete = bootPhase >= 6;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '16px',
      background: '#000a1a',
      fontFamily: "'Orbitron', monospace",
    }}>
      {/* Background grid pattern */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `
          radial-gradient(circle at 50% 50%, rgba(0, 162, 255, 0.08) 0%, transparent 70%),
          linear-gradient(rgba(0, 162, 255, 0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 162, 255, 0.04) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 30px 30px, 30px 30px',
      }} />

      {/* Corner bracket decorations */}
      <div style={{ position: 'fixed', top: '20px', left: '20px', zIndex: 1 }}>
        <div style={{ width: '30px', height: '30px', borderTop: '2px solid rgba(0,255,213,0.3)', borderLeft: '2px solid rgba(0,255,213,0.3)' }} />
      </div>
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1 }}>
        <div style={{ width: '30px', height: '30px', borderTop: '2px solid rgba(0,255,213,0.3)', borderRight: '2px solid rgba(0,255,213,0.3)' }} />
      </div>
      <div style={{ position: 'fixed', bottom: '20px', left: '20px', zIndex: 1 }}>
        <div style={{ width: '30px', height: '30px', borderBottom: '2px solid rgba(0,255,213,0.3)', borderLeft: '2px solid rgba(0,255,213,0.3)' }} />
      </div>
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1 }}>
        <div style={{ width: '30px', height: '30px', borderBottom: '2px solid rgba(0,255,213,0.3)', borderRight: '2px solid rgba(0,255,213,0.3)' }} />
      </div>

      {/* Top scanline */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '2px', zIndex: 2,
        background: 'linear-gradient(90deg, transparent, rgba(0,255,213,0.3), transparent)',
        animation: 'splashScan 2s ease-in-out infinite',
      }} />

      {/* Central logo */}
      <div style={{
        fontFamily: 'Orbitron', fontSize: '2.5rem', fontWeight: 700,
        color: '#00a2ff', letterSpacing: '8px',
        textShadow: '0 0 30px rgba(0,162,255,0.5), 0 0 60px rgba(0,162,255,0.2)',
        opacity: isComplete ? 1 : 0.7,
        transition: 'opacity 0.5s ease',
        position: 'relative', zIndex: 1,
      }}>
        MARSIL
      </div>

      {/* Version text */}
      <div style={{
        fontSize: '0.45rem', color: 'rgba(0,184,255,0.3)',
        letterSpacing: '3px', marginTop: '-8px',
        position: 'relative', zIndex: 1,
      }}>
        v2.0 // CYBERNETIC CORE
      </div>

      {/* Animated scan line */}
      <div style={{
        width: '160px', height: '1px',
        background: 'linear-gradient(90deg, transparent, #00ffd5, transparent)',
        animation: 'splashScan 1.5s ease-in-out infinite',
        position: 'relative', zIndex: 1,
      }} />

      {/* Subsystem diagnostic boot sequence */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '5px',
        marginTop: '16px', minWidth: '280px',
        position: 'relative', zIndex: 1,
        border: '1px solid rgba(0,162,255,0.08)',
        padding: '16px 20px',
        background: 'rgba(0,5,15,0.5)',
      }}>
        <div style={{
          fontSize: '0.4rem', color: 'rgba(0,184,255,0.3)',
          letterSpacing: '2px', marginBottom: '8px',
          fontFamily: "'Share Tech Mono', monospace",
        }}>
          [DIAGNOSTIC BOOT SEQUENCE]
        </div>
        {subsystems.map((sub, i) => (
          <div key={sub.label} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            opacity: i <= bootPhase ? 1 : 0.15,
            transition: 'opacity 0.3s ease',
          }}>
            {/* Status indicator */}
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: !sub.done ? 'rgba(0,184,255,0.3)'
                : sub.ok ? '#22c55e' : '#eab308',
              boxShadow: sub.done ? `0 0 8px ${sub.ok ? 'rgba(34,197,94,0.6)' : 'rgba(234,179,8,0.6)'}` : 'none',
              transition: 'all 0.3s ease',
            }} />

            {/* Label */}
            <span style={{
              fontSize: '0.5rem', color: 'rgba(0,184,255,0.5)',
              letterSpacing: '1px', width: '28px',
              fontFamily: "'Share Tech Mono', monospace",
            }}>
              {sub.label}
            </span>

            {/* Name */}
            <span style={{
              fontSize: '0.5rem', color: sub.done ? 'rgba(180,220,255,0.7)' : 'rgba(0,184,255,0.25)',
              letterSpacing: '1.5px', width: '150px',
              transition: 'color 0.3s ease',
            }}>
              {sub.name}
            </span>

            {/* Progress bar */}
            <div style={{
              flex: 1, height: '2px', background: 'rgba(0,184,255,0.08)',
              borderRadius: '1px', overflow: 'hidden', maxWidth: '80px',
            }}>
              <div style={{
                height: '100%', width: sub.done ? '100%' : (i === bootPhase ? '40%' : '0%'),
                background: sub.ok
                  ? 'linear-gradient(90deg, #00a2ff, #22c55e)'
                  : 'linear-gradient(90deg, #00a2ff, #eab308)',
                boxShadow: sub.done ? '0 0 6px rgba(0,255,213,0.3)' : 'none',
                transition: 'width 0.5s ease, background 0.3s ease',
              }} />
            </div>

            {/* Status text */}
            <span style={{
              fontSize: '0.45rem',
              color: !sub.done ? 'rgba(0,184,255,0.2)'
                : sub.ok ? '#22c55e' : '#eab308',
              width: '50px', textAlign: 'right',
              fontFamily: "'Share Tech Mono', monospace",
            }}>
              {!sub.done ? 'PENDING'
                : sub.ok ? 'ONLINE' : 'WARN'}
            </span>
          </div>
        ))}
      </div>

      {/* Status message */}
      <div style={{
        fontSize: '0.55rem', color: isComplete ? 'rgba(0,255,213,0.6)' : 'rgba(0,184,255,0.4)',
        letterSpacing: '2px', marginTop: '8px',
        transition: 'color 0.5s ease',
        position: 'relative', zIndex: 1,
      }}>
        {isComplete ? 'ALL SYSTEMS NOMINAL' : 'INITIALIZING NEURAL INTERFACE...'}
      </div>

      {/* Bottom status bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: '20px', zIndex: 2,
        background: 'rgba(2,8,20,0.9)',
        borderTop: '1px solid rgba(0,184,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px',
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '0.4rem',
        color: 'rgba(180,220,255,0.25)',
      }}>
        <span>MARSIL v2.0 // {isComplete ? 'READY' : 'BOOTING'}</span>
        <span>{new Date().toLocaleTimeString('en-US', { hour12: false })} UTC</span>
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
