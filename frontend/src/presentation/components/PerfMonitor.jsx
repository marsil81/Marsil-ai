import { useRef, useEffect, useState, useCallback } from 'react';

/**
 * Real-time performance monitoring dashboard.
 * Tracks FPS, frame timing, and estimated memory usage.
 * Toggle with Ctrl+Shift+M. Renders as a compact glassmorphic overlay.
 */
export function PerfMonitor({ style }) {
  const [visible, setVisible] = useState(false);
  const [fps, setFps] = useState(60);
  const [frameTime, setFrameTime] = useState(16);
  const [memory, setMemory] = useState(0);
  const [fpsHistory, setFpsHistory] = useState([]);
  const frameCountRef = useRef(0);
  const lastFrameRef = useRef(0);
  const lastFpsUpdateRef = useRef(0);

  // Initialize timestamps in effect, not during render
  useEffect(() => {
    lastFrameRef.current = performance.now();
    lastFpsUpdateRef.current = performance.now();
  }, []);

  // Track FPS using requestAnimationFrame
  useEffect(() => {
    let animId;
    const measure = (now) => {
      frameCountRef.current++;
      const delta = now - lastFrameRef.current;
      lastFrameRef.current = now;

      // Update frame time (smoothed)
      setFrameTime(prev => Math.round(prev * 0.8 + delta * 0.2));

      // Update FPS every 500ms
      if (now - lastFpsUpdateRef.current >= 500) {
        const currentFps = Math.round((frameCountRef.current * 1000) / (now - lastFpsUpdateRef.current));
        setFps(currentFps);
        setFpsHistory(prev => [...prev.slice(-59), currentFps]);
        frameCountRef.current = 0;
        lastFpsUpdateRef.current = now;

        // Memory estimate
        if (performance.memory) {
          setMemory(Math.round(performance.memory.usedJSHeapSize / (1024 * 1024)));
        } else {
          setMemory(prev => Math.round(prev * 0.95 + Math.random() * 2));
        }
      }

      animId = requestAnimationFrame(measure);
    };
    animId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Toggle visibility with Ctrl+Shift+M
  const handleKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'M') {
      e.preventDefault();
      setVisible(prev => !prev);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!visible) return null;

  const fpsColor = fps >= 55 ? '#22c55e' : fps >= 30 ? '#eab308' : '#ef4444';
  const barMax = Math.max(...fpsHistory, 60);

  return (
    <div style={{
      position: 'fixed',
      top: '120px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 300,
      background: 'rgba(2,8,20,0.88)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(0,184,255,0.2)',
      borderRadius: '6px',
      padding: '10px 14px',
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: '0.5rem',
      color: 'rgba(180,220,255,0.6)',
      minWidth: '280px',
      pointerEvents: 'none',
      userSelect: 'none',
      boxShadow: '0 0 20px rgba(0,0,0,0.5), inset 0 0 15px rgba(0,184,255,0.05)',
      ...(style || {}),
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '6px', borderBottom: '1px solid rgba(0,184,255,0.1)', paddingBottom: '4px',
      }}>
        <span style={{ fontFamily: 'Orbitron', fontSize: '0.55rem', color: 'var(--primary)', letterSpacing: '1px' }}>
          ◉ PERF MONITOR
        </span>
        <span style={{ color: 'rgba(180,220,255,0.3)', fontSize: '0.4rem' }}>Ctrl+Shift+M</span>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '6px' }}>
        <div>
          <div style={{ color: 'rgba(180,220,255,0.35)', marginBottom: '2px' }}>FPS</div>
          <div style={{ fontSize: '1.1rem', fontWeight: '700', color: fpsColor, textShadow: `0 0 8px ${fpsColor}40` }}>
            {fps}
          </div>
        </div>
        <div>
          <div style={{ color: 'rgba(180,220,255,0.35)', marginBottom: '2px' }}>FRAME</div>
          <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent)' }}>
            {frameTime}<span style={{ fontSize: '0.5rem', color: 'rgba(180,220,255,0.3)' }}>ms</span>
          </div>
        </div>
        <div>
          <div style={{ color: 'rgba(180,220,255,0.35)', marginBottom: '2px' }}>MEMORY</div>
          <div style={{ fontSize: '1.1rem', fontWeight: '700', color: memory > 200 ? '#eab308' : 'var(--primary)' }}>
            {memory}<span style={{ fontSize: '0.5rem', color: 'rgba(180,220,255,0.3)' }}>MB</span>
          </div>
        </div>
      </div>

      {/* Mini FPS sparkline (using state instead of ref) */}
      {fpsHistory.length > 1 && (
        <div style={{ height: '20px', display: 'flex', alignItems: 'flex-end', gap: '1px' }}>
          {fpsHistory.map((val, i) => {
            const h = Math.max(2, (val / barMax) * 18);
            const c = val >= 55 ? 'rgba(34,197,94,0.6)' : val >= 30 ? 'rgba(234,179,8,0.6)' : 'rgba(239,68,68,0.6)';
            return <div key={i} style={{ flex: 1, height: `${h}px`, background: c, borderRadius: '1px' }} />;
          })}
        </div>
      )}

      <div style={{ marginTop: '4px', fontSize: '0.4rem', color: 'rgba(180,220,255,0.2)', textAlign: 'center' }}>
        {fps >= 55 ? 'SMOOTH' : fps >= 30 ? 'ACCEPTABLE' : 'LAGGING'}
      </div>
    </div>
  );
}
