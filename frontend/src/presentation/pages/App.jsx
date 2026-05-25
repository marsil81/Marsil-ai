import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, SendHorizontal, Mic, MicOff, Volume2 } from 'lucide-react';
import '../styles/App.css';
import { ParticleReactor } from '../components/ParticleReactor';
import { SettingsModal, estimateCost } from '../components/SettingsModal';
import { FileTreeHUD } from '../components/FileTreeHUD';
import { CodeEditor } from '../components/CodeEditor';
import { useAgentConnection } from '../../application/useAgentConnection';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { useVoiceSystem } from '../hooks/useVoiceSystem';

function MiniRadar() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const c = canvasRef.current, ctx = c.getContext('2d');
    let angle = 0, id;
    function draw() {
      ctx.clearRect(0, 0, 90, 90);
      const cx = 45, cy = 45;
      
      ctx.strokeStyle = 'rgba(0,184,255,0.15)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, 40, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, 25, 0, Math.PI * 2); ctx.stroke();
      
      ctx.beginPath(); ctx.moveTo(cx - 40, cy); ctx.lineTo(cx + 40, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - 40); ctx.lineTo(cx, cy + 40); ctx.stroke();

      angle += 0.025;
      ctx.strokeStyle = 'rgba(0,255,213,0.5)'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * 40, cy + Math.sin(angle) * 40);
      ctx.stroke();
      
      ctx.fillStyle = 'rgba(0,255,213,0.8)';
      ctx.beginPath(); ctx.arc(cx + 18, cy - 15, 2.5, 0, Math.PI * 2); ctx.fill();
      
      id = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(id);
  }, []);
  return <canvas ref={canvasRef} width={90} height={90} style={{ width: '90px', height: '90px' }} />;
}

function App() {
  const { t, i18n } = useTranslation();
  const { agentStatus, metrics, termOutput, chatHistory, sendCommand, abortAgent, tokenData, clearTokens } = useAgentConnection();
  const [showSettings, setShowSettings] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [clock, setClock] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [sysConfig, setSysConfig] = useState({ provider: 'anthropic', model: 'claude-opus-4-5', budget: 0 });

  const fetchConfig = () => {
    fetch('http://localhost:3001/api/config')
      .then(r => r.json())
      .then(data => setSysConfig(data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    if (!showSettings) {
      fetchConfig();
    }
  }, [showSettings]);

  const { playChirp } = useSoundEffects(agentStatus);

  // Hook into voice system (STT & TTS)
  const { isListening, toggleListening, speak } = useVoiceSystem((text) => {
    setChatInput(text);
    playChirp(1200, 0.1);
  });

  useEffect(() => { document.body.dir = i18n.language === 'ar' ? 'rtl' : 'ltr'; }, [i18n.language]);
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const ms = String(d.getMilliseconds()).slice(0, 2).padStart(2, '0');
      setClock(d.toLocaleTimeString('en-US', { hour12: false }) + '.' + ms);
    };
    tick(); const id = setInterval(tick, 50); return () => clearInterval(id);
  }, []);

  // Voice Readout on new Agent response
  useEffect(() => {
    if (chatHistory.length > 0) {
      const lastMsg = chatHistory[chatHistory.length - 1];
      if (lastMsg.role === 'assistant') {
        speak(lastMsg.content);
      }
    }
  }, [chatHistory]);

  const toggleLang = () => {
    playChirp(1000, 0.05);
    i18n.changeLanguage(i18n.language === 'en' ? 'ar' : 'en');
  };

  const handleSend = () => {
    if (chatInput.trim()) {
      playChirp(1300, 0.08);
      sendCommand(chatInput);
      setChatInput('');
    }
  };

  let circleCls = 'status-circle';
  if (agentStatus === 'thinking' || agentStatus === 'executing_tool') circleCls += ' thinking';

  const dateStr = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

  return (
    <div className="hud-root">
      <div className="scan-line"></div>
      
      {/* Conditionally hide reactor if file is open, or render editor above it */}
      <ParticleReactor status={agentStatus} style={{ opacity: selectedFile ? 0.3 : 1 }} />
      {selectedFile && <CodeEditor filePath={selectedFile} onClose={() => setSelectedFile(null)} />}

      {/* TOP HEADER */}
      <div className="top-bar">
        <div className="top-row">
          <div className="logo-container">
            <div className={circleCls}></div>
            <div>
              <div className="logo">{t("app_title")}</div>
              <div className="logo-sub">MODULAR AGENTIC RUNTIME SYSTEM FOR INTELLIGENT LABOR</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="time-display">{clock}</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--accent)', letterSpacing: '1px' }}>{dateStr}</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
          <div className="nav-btns">
            <button className="nav-btn active">CONSOLE</button>
            <button className="nav-btn" onClick={() => setShowSettings(true)}>SETTINGS</button>
            <button className="nav-btn" onClick={toggleLang}>LANG</button>
            <button className="nav-btn" onClick={abortAgent} style={{ color: '#ff5555' }}>{t("emergency_stop")}</button>
          </div>
          <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>
            SYS.LOC: LAT 31.95°N | {t("active_threads")}
          </div>
        </div>
      </div>

      {/* LEFT: SYSTEM DETAILS */}
      <div className="tech-panel sys-details-panel">
        <div className="tech-panel-header">
          <span>⌂ {t("system_engine")}</span>
          <span style={{ fontSize: '0.45rem', color: 'var(--accent)' }}>{t("sec")}</span>
        </div>
        <div className="sys-row"><span>SIGNAL CORE</span><span className="val">{agentStatus.toUpperCase()}</span></div>
        <div className="sys-row"><span>{t("mem_usage")}</span><span className="val">{metrics.ram || 0}%</span></div>
        <div className="sys-row"><span>{t("cpu_load")}</span><span className="val">{metrics.cpu || 0}%</span></div>
        <div className="sys-row"><span>{t("temp")}</span><span className="val">54.8 °C</span></div>
        <div className="sys-row"><span>{t("link")}</span><span className="val">STABLE</span></div>
        <div className="sys-row"><span>{t("workspace")}</span><span className="val">D:\IRON MAN</span></div>
        
        {/* Holographic File Tree integrated natively */}
        <div style={{ marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
          <div style={{ fontSize: '0.45rem', color: 'var(--text-dim)', marginBottom: '5px', letterSpacing: '1px' }}>📁 LIVE WORKSPACE</div>
          <FileTreeHUD onFileSelect={setSelectedFile} />
        </div>
      </div>

      {/* LEFT: TELEMETRY */}
      <div className="tech-panel telemetry-panel">
        <div className="tech-panel-header">
          <span>⌁ {t("system_metrics")}</span>
          <span style={{ fontSize: '0.45rem', color: 'var(--accent)' }}>{t("live")}</span>
        </div>
        <div className="chat-msgs" style={{ height: 'calc(100% - 25px)' }}>
          {termOutput.length === 0 && <div className="log-line">Marsil AI Terminal Operational...</div>}
          {termOutput.slice(-30).map((line, i) => (
            <div key={i} className="log-line">{line}</div>
          ))}
        </div>
      </div>

      {/* RIGHT: DEPLOYMENT PROTOCOLS */}
      <div className="tech-panel priority-panel">
        <div className="tech-panel-header">
          <span>▸ {t("protocols")}</span>
        </div>
        <div className="sys-row"><span>01. ENGINE</span><span className="val">CLAUDE CODE</span></div>
        <div className="sys-row"><span>02. PROTOCOL</span><span className="val">WEBSOCKETS</span></div>
        <div className="sys-row"><span>03. GATEWAY</span><span className="val">CONNECTED</span></div>
      </div>

      {/* RIGHT: MINI RADAR */}
      <div className="tech-panel" style={{ top: '120px', right: '290px', padding: '8px' }}>
        <MiniRadar />
      </div>

      {/* RIGHT: RESOURCE METRICS */}
      <div className="tech-panel data-panel">
        <div className="tech-panel-header">
          <span>⚙ {t("gauges")}</span>
        </div>
        <div className="data-bar-row">
          <span className="data-bar-label">CPU</span>
          <div className="data-bar-track"><div className="data-bar-fill" style={{ width: `${metrics.cpu || 0}%` }}></div></div>
          <span className="data-bar-val">{metrics.cpu || 0}%</span>
        </div>
        <div className="data-bar-row">
          <span className="data-bar-label">RAM</span>
          <div className="data-bar-track"><div className="data-bar-fill" style={{ width: `${metrics.ram || 0}%` }}></div></div>
          <span className="data-bar-val">{metrics.ram || 0}%</span>
        </div>
        <div className="data-bar-row">
          <span className="data-bar-label">NET</span>
          <div className="data-bar-track"><div className="data-bar-fill" style={{ width: '48%' }}></div></div>
          <span className="data-bar-val">48%</span>
        </div>
      </div>

      {/* ═══ RIGHT PANEL: RESOURCE MONITORING (Swapped to bottom right) ═══ */}
      <div className="tech-panel resource-panel-right" style={{ minHeight: '195px' }}>
        <div className="tech-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>◉ {t("monitor")}</span>
          {tokenData.totalTokens > 0 && (
            <button onClick={clearTokens} style={{
              background: 'transparent', border: 'none', color: 'var(--accent)',
              fontSize: '0.45rem', cursor: 'pointer', fontFamily: 'monospace'
            }}>CLEAR</button>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', height: 'calc(100% - 25px)', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <Volume2 size={10} style={{ color: 'var(--accent)' }} /> 
              <span style={{ fontSize: '0.45rem', color: 'var(--text-muted)' }}>{sysConfig.provider?.toUpperCase()} / {sysConfig.model}</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
              <div>
                <div style={{ fontSize: '0.4rem', color: 'var(--text-dim)' }}>TOKENS IN</div>
                <div style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text)' }}>{(tokenData.tokensIn || 0).toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.4rem', color: 'var(--text-dim)' }}>TOKENS OUT</div>
                <div style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text)' }}>{(tokenData.tokensOut || 0).toLocaleString()}</div>
              </div>
            </div>

            <div style={{ fontSize: '0.45rem', color: 'var(--text-dim)', marginBottom: '2px' }}>TOTAL TOKENS</div>
            <div style={{
              fontFamily: 'Orbitron', fontSize: '1.05rem', fontWeight: '700',
              color: 'var(--primary)', textShadow: '0 0 10px var(--primary-glow)',
              marginBottom: '2px'
            }}>{(tokenData.totalTokens || 0).toLocaleString()} <span style={{ fontSize: '0.5rem', color: 'var(--text-dim)' }}>TKN</span></div>
          </div>
          
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--accent)', fontSize: '0.45rem', letterSpacing: '1px' }}>ESTIMATED COST</span>
              {sysConfig.budget > 0 && (
                <span style={{ fontSize: '0.45rem', color: 'var(--text-dim)' }}>LIMIT: ${sysConfig.budget}</span>
              )}
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text)', marginTop: '2px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              ${estimateCost(sysConfig.model, tokenData.tokensIn, tokenData.tokensOut).toFixed(5)}
              <span style={{ fontSize: '0.45rem', color: 'var(--text-dim)', fontWeight: 'normal' }}>USD</span>
            </div>

            {sysConfig.budget > 0 && (() => {
              const est = estimateCost(sysConfig.model, tokenData.tokensIn, tokenData.tokensOut);
              const pct = Math.min(100, (est / sysConfig.budget) * 100);
              const barColor = pct > 90 ? '#ef4444' : pct > 75 ? '#d97706' : 'var(--primary)';
              return (
                <div style={{ marginTop: '5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.4rem', color: 'var(--text-dim)', marginBottom: '2px' }}>
                    <span>BUDGET USED</span>
                    <span>{pct.toFixed(1)}%</span>
                  </div>
                  <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: barColor, boxShadow: `0 0 8px ${barColor}` }}></div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ═══ BOTTOM CENTER PANEL: SYSTEM DIRECTIVES (Swapped to bottom center wide) ═══ */}
      <div className="bottom-chat-container">
        <div className="bottom-chat-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '4px', marginBottom: '6px' }}>
            <span style={{ fontFamily: 'Orbitron', fontSize: '0.58rem', letterSpacing: '1.5px', color: 'var(--primary)' }}>◉ {t("directives")}</span>
            <span style={{ fontSize: '0.45rem', color: 'var(--accent)' }}>AWAITING COMMANDS</span>
          </div>
          <div className="chat-msgs">
            {chatHistory.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.52rem', letterSpacing: '1px' }}>{t("placeholder_command")}</div>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role === 'user' ? 'user' : 'agent'}`}>
                <div className="chat-tag">{msg.role === 'user' ? t("you") : t("ironman")}</div>
                <div>{msg.content}</div>
              </div>
            ))}
          </div>
          <div className="chat-input-row" style={{ alignItems: 'center', marginTop: '6px' }}>
            {/* Micro microphone toggle */}
            <button className="hud-btn hud-btn-icon" onClick={toggleListening} style={{
              borderColor: isListening ? 'var(--accent)' : 'var(--border)',
              color: isListening ? 'var(--accent)' : 'var(--text-dim)'
            }}>
              {isListening ? <Mic size={12} className="thinking" /> : <MicOff size={12} />}
            </button>
            
            <input className="chat-input" value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={t("placeholder_command")} />
            
            <button className="hud-btn hud-btn-icon" onClick={handleSend}><SendHorizontal size={11} /></button>
          </div>
        </div>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}

export default App;
