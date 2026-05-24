import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAgentConnection } from '../../application/useAgentConnection';

export function EditorPane() {
  const { t } = useTranslation();
  const { agentStatus } = useAgentConnection();

  let reactorClass = 'reactor';
  if (agentStatus === 'thinking' || agentStatus === 'executing_tool') reactorClass += ' thinking';
  if (agentStatus === 'error') reactorClass += ' error';

  const labels = { idle: 'SYSTEM ONLINE', thinking: 'PROCESSING', executing_tool: 'EXECUTING', error: 'ERROR' };

  // Generate tick marks around the reactor
  const ticks = [];
  for (let i = 0; i < 36; i++) {
    ticks.push(
      <div key={i} style={{
        position: 'absolute',
        width: '1.5px',
        height: i % 3 === 0 ? '10px' : '5px',
        background: i % 3 === 0 ? 'rgba(96,165,250,0.6)' : 'rgba(96,165,250,0.25)',
        top: '0',
        left: '50%',
        transformOrigin: '50% 170px',
        transform: `rotate(${i * 10}deg)`,
      }} />
    );
  }

  return (
    <div className="reactor-container">
      <div className={reactorClass}>
        <div className="reactor-ring reactor-ring-1"></div>
        <div className="reactor-ring reactor-ring-2"></div>
        <div className="reactor-ring reactor-ring-3"></div>
        <div className="reactor-ring reactor-ring-4"></div>
        <div className="reactor-ring reactor-ring-5"></div>
        <div className="reactor-ring reactor-ring-6"></div>
        <div className="reactor-ticks">{ticks}</div>
        <div className="reactor-core"></div>
      </div>
      <div className="reactor-label">{labels[agentStatus] || 'SYSTEM ONLINE'}</div>
    </div>
  );
}
