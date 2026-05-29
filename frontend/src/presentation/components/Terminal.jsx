import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export function Terminal({ output }) {
  const { t } = useTranslation();
  const terminalRef = useRef(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="terminal-bar">
        <div className="terminal-bar-dot">
          <span></span><span></span><span></span>
        </div>
        <span>marsil-cmd</span>
        <span>session:active</span>
      </div>
      <div ref={terminalRef} className="terminal-wrapper" dir="ltr">
        {output.length === 0 ? (
          <div className="terminal-line">
            <span className="prompt">❯</span>
            <span>{t('terminal_init')}</span>
          </div>
        ) : (
          output.map((line, i) => (
            <div className="terminal-line" key={i}>
              <span className="prompt">❯</span>
              <span>{line}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
