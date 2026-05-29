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
      background: '#00152b',
      fontFamily: "'Orbitron', monospace",
    }}>
      {/* Central logo */}
      <div style={{
        fontFamily: 'Orbitron', fontSize: '2.5rem', fontWeight: 700,
        color: '#00a2ff', letterSpacing: '8px',
        textShadow: '0 0 30px rgba(0,162,255,0.5)',
        opacity: isComplete ? 1 : 0.6,
        transition: 'opacity 0.5s ease',
      }}>
        MARSIL
      </div>

      {/* Animated scan line */}
      <div style={{
        width: '120px', height: '2px',
        background: 'linear-gradient(90deg, transparent, #00ffd5, transparent)',
        animation: 'splashScan 1.5s ease-in-out infinite',
      }} />

      {/* Subsystem diagnostic boot sequence */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '4px',
        marginTop: '12px', minWidth: '240px',
      }}>
        {subsystems.map((sub, i) => (
          <div key={sub.label} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            opacity: i <= bootPhase ? 1 : 0.2,
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
            }}>
              {sub.label}
            </span>

            {/* Name */}
            <span style={{
              fontSize: '0.5rem', color: sub.done ? 'rgba(180,220,255,0.7)' : 'rgba(0,184,255,0.25)',
              letterSpacing: '1.5px', width: '140px',
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
      }}>
        {isComplete ? 'ALL SYSTEMS NOMINAL' : 'INITIALIZING NEURAL INTERFACE...'}
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
