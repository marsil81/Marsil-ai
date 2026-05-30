import { useState, useRef, useEffect } from 'react';
import { Wifi, WifiOff, Clock, Cpu, HardDrive, Activity, Terminal, Settings, XCircle, Zap, BarChart3 } from 'lucide-react';

function formatUptime(seconds) {
  if (!seconds) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getLatencyColor(ms) {
  if (ms == null) return 'rgba(255,255,255,0.15)';
  if (ms < 50) return '#22c55e';
  if (ms < 150) return '#eab308';
  return '#ef4444';
}

function getLatencyLabel(ms) {
  if (ms == null) return '--';
  if (ms < 50) return `${ms}ms`;
  if (ms < 150) return `${ms}ms`;
  return `${ms}ms`;
}

/**
 * Mini sparkline for hover tooltip preview.
 * Renders a tiny inline bar chart showing recent values.
 */
function MiniSparkline({ values = [], maxValue = 100, color = '#00a2ff', width = 60, height = 16 }) {
  if (values.length < 2) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1px', width, height }}>
      {values.slice(-20).map((v, i) => {
        const h = Math.max(2, (v / maxValue) * (height - 2));
        return <div key={i} style={{
          flex: 1, height: `${h}px`,
          background: color,
          borderRadius: '1px',
          opacity: 0.4 + (v / maxValue) * 0.6,
        }} />;
      })}
    </div>
  );
}

/**
 * Live mini-sparkline that auto-updates with rolling data.
 * Collects values over time and renders a compact bar chart.
 */
function LiveSparkline({ getValue, interval = 2000, maxPoints = 30, maxValue = 100, color = '#00a2ff', width = 50, height = 14 }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    const id = setInterval(() => {
      const val = typeof getValue === 'function' ? getValue() : (getValue || 0);
      setData(prev => [...prev.slice(-(maxPoints - 1)), Math.min(val, maxValue)]);
    }, interval);
    return () => clearInterval(id);
  }, [getValue, interval, maxPoints, maxValue]);

  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1px', width, height }}>
      {data.map((v, i) => {
        const h = Math.max(1.5, (v / max) * (height - 2));
        return <div key={i} style={{
          flex: 1, height: `${h}px`,
          background: color,
          borderRadius: '1px',
          opacity: 0.35 + (v / max) * 0.65,
          transition: 'height 0.3s ease',
        }} />;
      })}
    </div>
  );
}

export function StatusBar({ connectionStatus, wsLatency, uptime, metrics, agentStatus, sysConfig, onConsoleToggle, onSettingsToggle, onAbort }) {
  const isConnected = connectionStatus === 'connected';
  const isReconnecting = connectionStatus === 'reconnecting';

  // Hover preview state
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const hoverTimeoutRef = useRef(null);

  // Sparkline data — static preview values for hover tooltip
  const cpuPreview = [15, 22, 18, 35, 28, 42, 30, 25, 38, 20, 32, 28, 45, 35, 22, 40, 30, 25, 35, 28];
  const ramPreview = [55, 58, 52, 60, 55, 62, 58, 55, 60, 58, 62, 55, 58, 60, 55, 58, 62, 55, 58, 60];

  const handleHoverEnter = (item, e) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
    setHoveredItem(item);
  };

  const handleHoverLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => setHoveredItem(null), 100);
  };

  const hoverPreview = hoveredItem ? (
    <div style={{
      position: 'fixed',
      left: hoverPos.x,
      top: hoverPos.y,
      transform: 'translate(-50%, -100%)',
      zIndex: 999,
      background: 'rgba(2,8,20,0.95)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(0,184,255,0.2)',
      borderRadius: '4px',
      padding: '10px 12px',
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: '0.78rem',
      color: 'rgba(180,220,255,0.7)',
      pointerEvents: 'none',
      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      minWidth: '135px',
    }}>
      <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '4px', letterSpacing: '0.5px' }}>
        {hoveredItem === 'cpu' ? '◉ CPU LOAD' : '◉ MEMORY USAGE'}
      </div>
      <div style={{ fontSize: '1.1rem', fontWeight: '700', color: hoveredItem === 'cpu' ? '#00a2ff' : '#00ffd5', marginBottom: '4px' }}>
        {hoveredItem === 'cpu' ? metrics.cpu || 0 : metrics.ram || 0}%
      </div>
      <MiniSparkline
        values={hoveredItem === 'cpu' ? cpuPreview : ramPreview}
        maxValue={100}
        color={hoveredItem === 'cpu' ? '#00a2ff' : '#00ffd5'}
      />
      <div style={{ fontSize: '0.7rem', color: 'rgba(180,220,255,0.4)', marginTop: '3px', textAlign: 'center' }}>
        {hoveredItem === 'cpu'
          ? (metrics.cpu > 70 ? 'HIGH LOAD' : metrics.cpu > 30 ? 'MODERATE' : 'IDLE')
          : (metrics.ram > 80 ? 'CRITICAL' : metrics.ram > 50 ? 'ELEVATED' : 'NOMINAL')}
      </div>
    </div>
  ) : null;

  return (
    <>
      {hoverPreview}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '26px',
        zIndex: 50,
        background: 'rgba(2,8,20,0.92)',
        borderTop: '1px solid rgba(0,184,255,0.12)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '0.78rem',
        color: 'rgba(180,220,255,0.55)',
        userSelect: 'none',
        boxShadow: '0 -1px 12px rgba(0,162,255,0.06)',
      }}>
        {/* Left: Connection Status + Live Sparklines */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {isConnected ? (
              <Wifi size={12} color="#22c55e" />
            ) : (
              <WifiOff size={12} color="#ef4444" />
            )}
            <span style={{
              color: isConnected ? '#22c55e' : (isReconnecting ? '#eab308' : '#ef4444'),
            }}>
              {isConnected ? 'CONNECTED' : isReconnecting ? 'RECONNECTING' : 'DISCONNECTED'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Activity size={12} style={{ color: getLatencyColor(wsLatency) }} />
            <span style={{ color: getLatencyColor(wsLatency) }}>
              {getLatencyLabel(wsLatency)}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Clock size={12} />
            <span>{formatUptime(uptime)}</span>
          </div>

          {/* Live CPU sparkline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.7 }}>
            <BarChart3 size={10} />
            <LiveSparkline getValue={() => metrics.cpu || 0} interval={3000} maxValue={100} color="#00a2ff" width={40} height={12} />
          </div>
        </div>

        {/* Center: Agent Status + Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontFamily: 'Outfit, sans-serif', fontSize: '0.78rem', fontWeight: 'bold',
          }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: agentStatus === 'thinking' || agentStatus === 'executing_tool'
                ? '#00ffd5' : (agentStatus === 'error' ? '#ef4444' : '#22c55e'),
              boxShadow: agentStatus === 'thinking' || agentStatus === 'executing_tool'
                ? '0 0 6px rgba(0,255,213,0.6)' : 'none',
              animation: agentStatus === 'thinking' ? 'pulse 0.8s infinite' : 'none',
            }} />
            <span style={{ color: 'rgba(180,220,255,0.7)' }}>
              {agentStatus.toUpperCase()}
            </span>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', gap: '4px', borderLeft: '1px solid rgba(0,184,255,0.1)', paddingLeft: '8px' }}>
            <button onClick={onConsoleToggle} title="Toggle Console (Ctrl+Shift+C)" style={{
              background: 'transparent', border: 'none', color: 'rgba(180,220,255,0.35)', cursor: 'pointer',
              padding: '2px 4px', display: 'flex', alignItems: 'center', borderRadius: '2px',
              transition: 'all 0.2s',
            }} onMouseEnter={e => e.target.style.color = 'rgba(180,220,255,0.8)'}
               onMouseLeave={e => e.target.style.color = 'rgba(180,220,255,0.35)'}>
              <Terminal size={12} />
            </button>
            <button onClick={onSettingsToggle} title="Toggle Settings (Ctrl+Shift+S)" style={{
              background: 'transparent', border: 'none', color: 'rgba(180,220,255,0.35)', cursor: 'pointer',
              padding: '2px 4px', display: 'flex', alignItems: 'center', borderRadius: '2px',
              transition: 'all 0.2s',
            }} onMouseEnter={e => e.target.style.color = 'rgba(180,220,255,0.8)'}
               onMouseLeave={e => e.target.style.color = 'rgba(180,220,255,0.35)'}>
              <Settings size={12} />
            </button>
            <button onClick={onAbort} title="Abort Agent (Ctrl+Shift+X)" style={{
              background: 'transparent', border: 'none', color: 'rgba(239,68,68,0.4)', cursor: 'pointer',
              padding: '2px 4px', display: 'flex', alignItems: 'center', borderRadius: '2px',
              transition: 'all 0.2s',
            }} onMouseEnter={e => e.target.style.color = 'rgba(239,68,68,0.8)'}
               onMouseLeave={e => e.target.style.color = 'rgba(239,68,68,0.4)'}>
              <XCircle size={12} />
            </button>
          </div>
        </div>

        {/* Right: System Info with hover previews + Provider badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'default', position: 'relative' }}
            onMouseEnter={(e) => handleHoverEnter('cpu', e)}
            onMouseLeave={handleHoverLeave}
          >
            <Cpu size={12} />
            <span>CPU {metrics.cpu || 0}%</span>
          </div>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'default', position: 'relative' }}
            onMouseEnter={(e) => handleHoverEnter('ram', e)}
            onMouseLeave={handleHoverLeave}
          >
            <HardDrive size={12} />
            <span>RAM {metrics.ram || 0}%</span>
          </div>
          <div style={{
            padding: '2px 8px',
            background: 'rgba(0,162,255,0.1)',
            borderRadius: '3px',
            border: '1px solid rgba(0,162,255,0.15)',
            color: 'rgba(0,184,255,0.7)',
            letterSpacing: '0.5px',
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '0.78rem',
          }}>
            <Zap size={10} />
            {sysConfig.provider?.toUpperCase() || 'ANTHROPIC'} / {sysConfig.model || '--'}
          </div>
        </div>
      </div>
    </>
  );
}
