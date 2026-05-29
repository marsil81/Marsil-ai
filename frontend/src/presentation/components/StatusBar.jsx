import { Wifi, WifiOff, Clock, Cpu, HardDrive, Activity } from 'lucide-react';

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

export function StatusBar({ connectionStatus, wsLatency, uptime, metrics, agentStatus, sysConfig }) {
  const isConnected = connectionStatus === 'connected';
  const isReconnecting = connectionStatus === 'reconnecting';

  return (
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

      {/* Center: Agent Status */}
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

      {/* Right: System Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <Cpu size={9} />
          <span>CPU {metrics.cpu || 0}%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
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
  );
}
