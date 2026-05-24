import React from 'react';
import { useTranslation } from 'react-i18next';

export function HudMetrics({ metrics, totalTokens }) {
  const { t } = useTranslation();
  const circumference = 2 * Math.PI * 27;
  const cpuOffset = circumference - (circumference * (parseFloat(metrics.cpu) || 0)) / 100;
  const ramOffset = circumference - (circumference * (parseFloat(metrics.ram) || 0)) / 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        <div className="metric-card" style={{ flex: 1 }}>
          <div className="metric-ring-container">
            <svg width="65" height="65" viewBox="0 0 65 65">
              <circle className="metric-ring-bg" cx="32.5" cy="32.5" r="27" />
              <circle className="metric-ring-fill" cx="32.5" cy="32.5" r="27"
                strokeDasharray={circumference} strokeDashoffset={cpuOffset} />
            </svg>
            <div className="metric-value">{metrics.cpu}%</div>
          </div>
          <div className="metric-label">{t('cpu_load')}</div>
        </div>
        <div className="metric-card" style={{ flex: 1 }}>
          <div className="metric-ring-container">
            <svg width="65" height="65" viewBox="0 0 65 65">
              <circle className="metric-ring-bg" cx="32.5" cy="32.5" r="27" />
              <circle className="metric-ring-fill" cx="32.5" cy="32.5" r="27"
                strokeDasharray={circumference} strokeDashoffset={ramOffset}
                style={{ stroke: '#67e8f9', filter: 'drop-shadow(0 0 4px rgba(103,232,249,0.3))' }} />
            </svg>
            <div className="metric-value">{metrics.ram}%</div>
          </div>
          <div className="metric-label">{t('mem_usage')}</div>
        </div>
      </div>
      <div className="metric-card">
        <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--cyan-300)', fontFamily: 'Orbitron' }}>
          {(totalTokens || 0).toLocaleString()}
        </div>
        <div className="metric-label">{t('tokens_used')}</div>
      </div>
    </div>
  );
}
