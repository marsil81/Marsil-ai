import { useState, useEffect, useRef } from 'react';

/**
 * Cybernetic HUD SystemStatus dashboard.
 * Renders animated SVG rings with real-time diagnostics,
 * orbital status indicators, and a pulsing reactor core.
 * Inspired by ARWES / Open.Jarvis cybernetic aesthetics.
 */
function useAnimatedValue(target, duration = 800) {
  const [current, setCurrent] = useState(0);
  const animRef = useRef(null);

  useEffect(() => {
    const startVal = current;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(startVal + (target - startVal) * eased);
      if (progress < 1) animRef.current = requestAnimationFrame(animate);
    };

    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return current;
}

/**
 * An orbital ring segment — an SVG arc with glow.
 */
function OrbitalRing({ radius, strokeWidth = 2, color = '#00a2ff', progress = 0.75, rotation = 0, label, value, reverse = false }) {
  const size = (radius + strokeWidth + 8) * 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);
  const animRotation = useAnimatedValue(rotation, 1200);

  return (
    <div style={{ position: 'absolute', width: size, height: size, top: '50%', left: '50%', marginLeft: -center, marginTop: -center }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: `rotate(${animRotation}deg)`, transition: 'transform 0.3s ease' }}>
        <defs>
          <filter id={`orbital-glow-${label}`}>
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Background ring */}
        <circle
          cx={center} cy={center} r={radius}
          fill="none"
          stroke="rgba(0,162,255,0.07)"
          strokeWidth={strokeWidth}
        />
        {/* Active arc — reverse direction if needed */}
        <circle
          cx={center} cy={center} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={reverse ? circumference - dashOffset : dashOffset}
          filter={`url(#orbital-glow-${label})`}
          style={{
            transform: reverse ? 'scaleX(-1)' : 'none',
            transformOrigin: 'center',
            transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s ease',
          }}
        />
      </svg>
      {label && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          textAlign: 'center', pointerEvents: 'none',
        }}>
          <div style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: '0.45rem', color: 'rgba(180,220,255,0.5)',
            letterSpacing: '1px',
          }}>{label}</div>
          {value != null && (
            <div style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: '0.75rem', fontWeight: 700,
              color, textShadow: `0 0 10px ${color}60`,
              letterSpacing: '1px',
            }}>{value}</div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * A single diagnostic status line with animated dot.
 */
function StatusDot({ label, ok, sub }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '5px',
      fontSize: '0.48rem', fontFamily: "'Share Tech Mono', monospace",
      color: ok ? 'var(--accent)' : 'rgba(255,255,255,0.15)',
      transition: 'color 0.4s ease',
    }}>
      <span style={{
        width: '5px', height: '5px', borderRadius: '50%',
        background: ok ? '#22c55e' : '#ef4444',
        boxShadow: ok ? '0 0 6px rgba(34,197,94,0.6)' : 'none',
        display: 'inline-block',
        transition: 'all 0.4s ease',
        animation: ok ? 'pulse 2s infinite' : 'none',
      }} />
      <span style={{ letterSpacing: '1px' }}>{label}</span>
      {sub != null && <span style={{ opacity: 0.4, marginLeft: '2px' }}>{sub}</span>}
    </div>
  );
}

export function SystemStatus({ agentStatus, metrics, uptime, connectionStatus, wsLatency, diagState }) {
  const isActive = agentStatus === 'thinking' || agentStatus === 'executing_tool';
  const isConnected = connectionStatus === 'connected';

  // Animated ring progress values
  const cpuProgress = useAnimatedValue((metrics.cpu || 0) / 100, 600);
  const ramProgress = useAnimatedValue((metrics.ram || 0) / 100, 600);

  // Rotation speed varies with activity
  const baseRotation = useRef(0);
  const [rotation, setRotation] = useState(0);
  useEffect(() => {
    const speed = isActive ? 0.8 : 0.2;
    const id = setInterval(() => {
      baseRotation.current = (baseRotation.current + speed) % 360;
      setRotation(baseRotation.current);
    }, 50);
    return () => clearInterval(id);
  }, [isActive]);

  const statusLabel = isActive ? 'ACTIVE'
    : agentStatus === 'idle' ? 'STANDBY'
    : agentStatus === 'error' ? 'ERROR'
    : agentStatus.toUpperCase();

  const statusColor = isActive ? '#00ffd5'
    : agentStatus === 'error' ? '#ef4444'
    : '#00a2ff';

  return (
    <div className="tech-panel" style={{
      position: 'absolute', top: '120px', left: '50%',
      transform: 'translateX(-50%)',
      width: '220px', height: '220px',
      zIndex: 5,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(3,14,35,0.5)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(0,162,255,0.15)',
      borderRadius: '50%',
      overflow: 'visible',
      pointerEvents: 'none',
    }}>
      <span className="corner-tl" style={{ borderRadius: '0' }} />
      <span className="corner-br" style={{ borderRadius: '0' }} />

      {/* Outer orbital ring — system activity */}
      <OrbitalRing
        radius={88}
        strokeWidth={2}
        color={isActive ? '#00ffd5' : '#00a2ff'}
        progress={isActive ? 0.85 : 0.45}
        rotation={rotation}
        label="MARSIL"
        value={statusLabel}
        reverse={!isActive}
      />

      {/* CPU ring */}
      <OrbitalRing
        radius={68}
        strokeWidth={1.5}
        color="#00a2ff"
        progress={cpuProgress}
        rotation={rotation * 0.7}
        label="CPU"
        value={`${metrics.cpu || 0}%`}
      />

      {/* RAM ring */}
      <OrbitalRing
        radius={48}
        strokeWidth={1.5}
        color="#00ffd5"
        progress={ramProgress}
        rotation={rotation * 0.5 + 45}
        label="RAM"
        value={`${metrics.ram || 0}%`}
      />

      {/* Central pulsing core */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: '20px', height: '20px',
        marginLeft: '-10px', marginTop: '-10px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${statusColor} 0%, transparent 70%)`,
        boxShadow: `0 0 20px ${statusColor}40, 0 0 60px ${statusColor}20`,
        animation: isActive ? 'pulseCircle 1.5s ease-in-out infinite' : 'none',
        transition: 'all 0.5s ease',
      }} />

      {/* Diagnostics dots around the ring */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '180px', height: '180px',
        pointerEvents: 'none',
      }}>
        {/* Positioned around the ring perimeter */}
        <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)' }}>
          <StatusDot label="WS" ok={isConnected} sub={wsLatency != null ? `${wsLatency}ms` : null} />
        </div>
        <div style={{ position: 'absolute', bottom: '-14px', left: '50%', transform: 'translateX(-50%)' }}>
          <StatusDot label="API" ok={diagState?.keyValid} />
        </div>
        <div style={{ position: 'absolute', top: '50%', left: '-50px', transform: 'translateY(-50%)' }}>
          <StatusDot label="CLD" ok={diagState?.claudeAvailable} />
        </div>
        <div style={{ position: 'absolute', top: '50%', right: '-50px', transform: 'translateY(-50%)' }}>
          <StatusDot label="PRX" ok={diagState?.proxyRunning} />
        </div>
      </div>

      {/* Uptime displayed at bottom */}
      <div style={{
        position: 'absolute', bottom: '8px',
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '0.4rem', color: 'rgba(180,220,255,0.3)',
        letterSpacing: '1px',
      }}>
        UPTIME {uptime}
      </div>
    </div>
  );
}
