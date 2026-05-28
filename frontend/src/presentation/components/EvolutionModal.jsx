import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RefreshCw, Zap } from 'lucide-react';
import { Terminal } from './Terminal';

export function EvolutionModal({ onClose, sendCommand, agentStatus, termOutput }) {
  const [changelog, setChangelog] = useState('');
  const [roadmap, setRoadmap] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Roadmap and Changelog
    Promise.all([
      fetch('http://localhost:3001/api/file?path=MARSIL_ROADMAP.md').then(r => r.json()),
      fetch('http://localhost:3001/api/file?path=MARSIL_CHANGELOG.md').then(r => r.json())
    ]).then(([roadData, logData]) => {
      setRoadmap(roadData.content || 'Roadmap is empty.');
      setChangelog(logData.content || 'Changelog is empty.');
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const triggerCycle = () => {
    sendCommand(`/EVOLUTION_TRIGGER`);
  };

  const isRunning = agentStatus === 'thinking' || agentStatus === 'executing_tool';

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100 }}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ width: '90%', height: '90%', maxWidth: '1400px', display: 'flex', flexDirection: 'column', background: 'rgba(5, 10, 20, 0.95)', border: '1px solid var(--primary)', boxShadow: '0 0 30px rgba(0, 162, 255, 0.2)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid rgba(0, 162, 255, 0.3)', paddingBottom: '10px' }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--primary)', fontFamily: 'Orbitron', fontSize: '1.4rem', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Zap size={24} /> NUCLEUS: AUTONOMOUS EVOLUTION
            </h2>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', marginTop: '4px' }}>MARSIL CONTINUOUS SELF-IMPROVEMENT PROTOCOL</div>
          </div>
          
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <button onClick={triggerCycle} disabled={isRunning} style={{
              background: isRunning ? 'rgba(0, 255, 213, 0.2)' : 'rgba(0, 162, 255, 0.1)', 
              border: `1px solid ${isRunning ? 'var(--accent)' : 'var(--primary)'}`, 
              color: isRunning ? 'var(--accent)' : 'var(--primary)',
              padding: '8px 24px', borderRadius: '4px', cursor: isRunning ? 'default' : 'pointer', fontFamily: 'Orbitron', fontSize: '0.8rem',
              display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s',
              boxShadow: isRunning ? '0 0 15px rgba(0, 255, 213, 0.4)' : 'none'
            }}>
              {isRunning ? <RefreshCw size={16} className="spin-animation" /> : <Play size={16} />}
              {isRunning ? 'RUNNING...' : 'START EVOLUTION'}
            </button>

            <button onClick={onClose} className="hud-btn hud-btn-icon" style={{ marginLeft: '10px' }}><X size={18} /></button>
          </div>
        </div>

        {/* 3-Pane Body */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', minHeight: 0 }}>
          
          {/* Top Half: ROADMAP & CHANGELOG */}
          <div style={{ flex: 1, display: 'flex', gap: '15px', minHeight: 0 }}>
            {/* Left Panel: ROADMAP */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid rgba(0, 255, 213, 0.2)', borderRadius: '4px', background: 'rgba(0,0,0,0.6)' }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0, 255, 213, 0.2)', color: 'var(--accent)', fontFamily: 'Orbitron', fontSize: '0.7rem', background: 'rgba(0, 255, 213, 0.05)' }}>
                MARSIL_ROADMAP.md [BRAIN]
              </div>
              <div style={{ flex: 1, padding: '15px', overflowY: 'auto' }}>
                {loading ? <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>LOADING NEURAL PATHWAYS...</div> : (
                  <pre style={{ margin: 0, color: 'var(--text)', fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                    {roadmap}
                  </pre>
                )}
              </div>
            </div>

            {/* Right Panel: CHANGELOG */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid rgba(0, 162, 255, 0.2)', borderRadius: '4px', background: 'rgba(0,0,0,0.6)' }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0, 162, 255, 0.2)', color: 'var(--primary)', fontFamily: 'Orbitron', fontSize: '0.7rem', background: 'rgba(0, 162, 255, 0.05)' }}>
                MARSIL_CHANGELOG.md [MEMORY]
              </div>
              <div style={{ flex: 1, padding: '15px', overflowY: 'auto' }}>
                {loading ? <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>LOADING EVOLUTION LOGS...</div> : (
                  <pre style={{ margin: 0, color: 'var(--text)', fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                    {changelog}
                  </pre>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Half: LIVE TERMINAL */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid rgba(0, 255, 213, 0.3)', borderRadius: '4px', background: '#000', overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0, 255, 213, 0.3)', color: 'var(--accent)', fontFamily: 'Orbitron', fontSize: '0.7rem', background: 'rgba(0, 255, 213, 0.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="terminal-bar-dot"><span style={{background: '#ff5f56', width:'10px', height:'10px', borderRadius:'50%', display:'inline-block'}}></span></div>
              LIVE EXECUTION TERMINAL [CONSCIOUSNESS]
            </div>
            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
              <Terminal output={termOutput || []} />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
