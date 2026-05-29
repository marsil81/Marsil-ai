import { useState, useRef } from 'react';
import { Wifi, WifiOff, Clock, Cpu, HardDrive, Activity, Terminal, Settings, XCircle } from 'lucide-react';

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
      padding: '8px 10px',
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: '0.45rem',
      color: 'rgba(180,220,255,0.6)',
      pointerEvents: 'none',
      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      minWidth: '120px',
    }}>
      <div style={{ fontFamily: 'Orbitron', fontSize: '0.5rem', color: 'var(--primary)', marginBottom: '4px', letterSpacing: '1px' }}>
        {hoveredItem === 'cpu' ? '◉ CPU LOAD' : '◉ MEMORY USAGE'}
      </div>
      <div style={{ fontSize: '0.8rem', fontWeight: '700', color: hoveredItem === 'cpu' ? '#00a2ff' : '#00ffd5', marginBottom: '4px' }}>
        {hoveredItem === 'cpu' ? metrics.cpu || 0 : metrics.ram || 0}%
      </div>
      <MiniSparkline
        values={hoveredItem === 'cpu' ? cpuPreview : ramPreview}
        maxValue={100}
        color={hoveredItem === 'cpu' ? '#00a2ff' : '#00ffd5'}
      />
      <div style={{ fontSize: '0.4rem', color: 'rgba(180,220,255,0.3)', marginTop: '3px', textAlign: 'center' }}>
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
        height: '22px',
        zIndex: 50,
        background: 'rgba(2,8,20,0.92)',
        borderTop: '1px solid rgba(0,184,255,0.12)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '0.48rem',
        color: 'rgba(180,220,255,0.45)',
        userSelect: 'none',
      }}>
        {/* Left: Connection Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {isConnected ? (
              <Wifi size={9} color="#22c55e" />
            ) : (
              <WifiOff size={9} color="#ef4444" />
            )}
            <span style={{
              color: isConnected ? '#22c55e' : (isReconnecting ? '#eab308' : '#ef4444'),
            }}>
              {isConnected ? 'CONNECTED' : isReconnecting ? 'RECONNECTING' : 'DISCONNECTED'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Activity size={9} style={{ color: getLatencyColor(wsLatency) }} />
            <span style={{ color: getLatencyColor(wsLatency) }}>
              {getLatencyLabel(wsLatency)}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Clock size={9} />
            <span>{formatUptime(uptime)}</span>
          </div>
        </div>

        {/* Center: Agent Status + Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontFamily: 'Orbitron', fontSize: '0.5rem', letterSpacing: '1.5px',
          }}>
            <span style={{
              width: '5px', height: '5px', borderRadius: '50%',
              background: agentStatus === 'thinking' || agentStatus === 'executing_tool'
                ? '#00ffd5' : (agentStatus === 'error' ? '#ef4444' : '#22c55e'),
              boxShadow: agentStatus === 'thinking' || agentStatus === 'executing_tool'
                ? '0 0 6px rgba(0,255,213,0.6)' : 'none',
              animation: agentStatus === 'thinking' ? 'pulse 0.8s infinite' : 'none',
            }} />
            <span style={{ color: 'rgba(180,220,255,0.6)' }}>
              {agentStatus.toUpperCase()}
            </span>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', gap: '2px', borderLeft: '1px solid rgba(0,184,255,0.1)', paddingLeft: '8px' }}>
            <button onClick={onConsoleToggle} title="Toggle Console (Ctrl+Shift+C)" style={{
              background: 'transparent', border: 'none', color: 'rgba(180,220,255,0.35)', cursor: 'pointer',
              padding: '1px 4px', display: 'flex', alignItems: 'center', borderRadius: '2px',
              transition: 'all 0.2s',
            }} onMouseEnter={e => e.target.style.color = 'rgba(180,220,255,0.8)'}
               onMouseLeave={e => e.target.style.color = 'rgba(180,220,255,0.35)'}>
              <Terminal size={9} />
            </button>
            <button onClick={onSettingsToggle} title="Toggle Settings (Ctrl+Shift+S)" style={{
              background: 'transparent', border: 'none', color: 'rgba(180,220,255,0.35)', cursor: 'pointer',
              padding: '1px 4px', display: 'flex', alignItems: 'center', borderRadius: '2px',
              transition: 'all 0.2s',
            }} onMouseEnter={e => e.target.style.color = 'rgba(180,220,255,0.8)'}
               onMouseLeave={e => e.target.style.color = 'rgba(180,220,255,0.35)'}>
              <Settings size={9} />
            </button>
            <button onClick={onAbort} title="Abort Agent (Ctrl+Shift+X)" style={{
              background: 'transparent', border: 'none', color: 'rgba(239,68,68,0.4)', cursor: 'pointer',
              padding: '1px 4px', display: 'flex', alignItems: 'center', borderRadius: '2px',
              transition: 'all 0.2s',
            }} onMouseEnter={e => e.target.style.color = 'rgba(239,68,68,0.8)'}
               onMouseLeave={e => e.target.style.color = 'rgba(239,68,68,0.4)'}>
              <XCircle size={9} />
            </button>
          </div>
        </div>

        {/* Right: System Info with hover previews */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'default', position: 'relative' }}
            onMouseEnter={(e) => handleHoverEnter('cpu', e)}
            onMouseLeave={handleHoverLeave}
          >
            <Cpu size={9} />
            <span>CPU {metrics.cpu || 0}%</span>
          </div>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'default', position: 'relative' }}
            onMouseEnter={(e) => handleHoverEnter('ram', e)}
            onMouseLeave={handleHoverLeave}
          >
            <HardDrive size={9} />
            <span>RAM {metrics.ram || 0}%</span>
          </div>
          <div style={{
            padding: '1px 6px',
            background: 'rgba(0,162,255,0.1)',
            borderRadius: '3px',
            border: '1px solid rgba(0,162,255,0.15)',
            color: 'rgba(0,184,255,0.5)',
            letterSpacing: '0.5px',
          }}>
            {sysConfig.provider?.toUpperCase() || 'ANTHROPIC'} / {sysConfig.model || '--'}
          </div>
        </div>
      </div>
    </>
  );
}
