import { useState, useEffect, useRef } from 'react';

/**
 * Cybernetic animated SVG circular gauge for system metrics.
 * Renders a semi-circular arc with animated fill, neon glow, and digital readout.
 * Uses state for the displayed value (animated) so it can be read during render.
 */
export function CircularGauge({ label, value, maxValue = 100, unit = '%', size = 80 }) {
  const [displayValue, setDisplayValue] = useState(0);
  const animRef = useRef(null);

  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * Math.PI; // semi-circle

  useEffect(() => {
    const target = Math.min(value, maxValue);
    const start = displayValue;
    const duration = 600;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (target - start) * eased;
      setDisplayValue(current);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, maxValue]);

  const pct = Math.min(displayValue / maxValue, 1);
  const dashOffset = circumference * (1 - pct);

  // Color interpolation based on value
  const hue = 190 - pct * 100;
  const gaugeColor = `hsl(${hue}, 100%, ${50 + pct * 15}%)`;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
      fontFamily: "'Share Tech Mono', monospace",
    }}>
      <svg width={size} height={size / 2 + 12} viewBox={`0 0 ${size} ${size / 2 + 12}`}>
        <defs>
          <filter id={`glow-${label}`}>
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background arc */}
        <path
          d={`M ${strokeWidth} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth} ${size / 2}`}
          fill="none"
          stroke="rgba(0, 162, 255, 0.1)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Filled arc */}
        <path
          d={`M ${strokeWidth} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth} ${size / 2}`}
          fill="none"
          stroke={gaugeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          filter={`url(#glow-${label})`}
          style={{ transition: 'stroke 0.4s ease' }}
        />

        {/* Digital readout */}
        <text
          x={size / 2} y={size / 2 + 4}
          textAnchor="middle"
          fill={gaugeColor}
          fontFamily="'Orbitron', monospace"
          fontSize={size * 0.18}
          fontWeight="700"
          filter={`url(#glow-${label})`}
        >
          {Math.round(displayValue)}{unit}
        </text>
      </svg>
      <span style={{
        fontSize: '0.45rem', color: 'rgba(180,220,255,0.5)',
        letterSpacing: '1.5px', fontFamily: "'Orbitron', monospace",
      }}>
        {label}
      </span>
    </div>
  );
}
