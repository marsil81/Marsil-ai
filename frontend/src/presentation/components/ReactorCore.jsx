/**
 * 🌌 MARSIL AI — ReactorCore Status Component
 * Arc-reactor style animated status indicator that replaces
 * the small status dot with a cinematic multi-layer visual.
 */
import { useEffect, useRef } from 'react';
import './ReactorCore.css';

const STATUS_CONFIG = {
  idle:           { color: '#10b981', glow: 'rgba(16,185,129,0.4)',  speed: 8,  pulse: false, label: 'STANDBY' },
  thinking:       { color: '#818cf8', glow: 'rgba(129,140,248,0.5)', speed: 2,  pulse: true,  label: 'PROCESSING' },
  executing_tool: { color: '#f59e0b', glow: 'rgba(245,158,11,0.5)',  speed: 0.8,pulse: true,  label: 'EXECUTING' },
  speaking:       { color: '#06b6d4', glow: 'rgba(6,182,212,0.4)',   speed: 4,  pulse: false, label: 'SPEAKING' },
};

export function ReactorCore({ status = 'idle' }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.idle;

  return (
    <div className="reactor-core" style={{ '--rc-color': cfg.color, '--rc-glow': cfg.glow }}>
      {/* Outer ring */}
      <div className="rc-ring rc-ring-outer" style={{ animationDuration: `${cfg.speed * 1.4}s` }} />
      {/* Mid ring */}
      <div className="rc-ring rc-ring-mid"   style={{ animationDuration: `${cfg.speed}s` }} />
      {/* Inner ring */}
      <div className="rc-ring rc-ring-inner" style={{ animationDuration: `${cfg.speed * 0.6}s`, animationDirection: 'reverse' }} />
      {/* Core dot */}
      <div className={`rc-core-dot${cfg.pulse ? ' pulsing' : ''}`} />
      {/* Status label */}
      <span className="rc-label">{cfg.label}</span>
    </div>
  );
}
