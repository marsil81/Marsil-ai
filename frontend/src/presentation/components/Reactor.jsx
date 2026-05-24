import React from 'react';

export function Reactor({ status }) {
  let cls = 'reactor';
  if (status === 'thinking' || status === 'executing_tool') cls += ' thinking';

  const ticks = [];
  for (let i = 0; i < 72; i++) {
    const isMajor = i % 6 === 0;
    ticks.push(
      <div key={i} className={`r-tick ${isMajor ? 'major' : 'minor'}`}
        style={{ transform: `rotate(${i * 5}deg)` }} />
    );
  }

  const labels = { idle: 'SYSTEM ONLINE', thinking: 'PROCESSING...', executing_tool: 'EXECUTING', error: 'SYSTEM ERROR' };

  return (
    <div className="reactor-wrapper">
      <div className={cls}>
        <div className="r-ring r1"></div>
        <div className="r-ring r2"></div>
        <div className="r-ring r3"></div>
        <div className="r-ring r4"></div>
        <div className="r-ring r5"></div>
        <div className="r-ring r6"></div>
        <div className="r-ring r7"></div>
        <div className="r-ring r8"></div>
        {ticks}
        <div className="r-core"></div>
      </div>
      <div className="reactor-status">{labels[status] || 'SYSTEM ONLINE'}</div>
    </div>
  );
}
