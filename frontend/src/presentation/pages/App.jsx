import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { SendHorizontal, Mic, MicOff, Volume2, VolumeX, Radio, X } from 'lucide-react';
import '../styles/App.css';
import { ParticleReactor } from '../components/ParticleReactor';
import { SettingsModal, estimateCost } from '../components/SettingsModal';
import { FileTreeHUD } from '../components/FileTreeHUD';
import { CodeEditor } from '../components/CodeEditor';
import { Terminal } from '../components/Terminal';
import { EvolutionModal } from '../components/EvolutionModal';
import { KeyboardShortcuts } from '../components/KeyboardShortcuts';
import { StatusBar } from '../components/StatusBar';
import { CircularGauge } from '../components/CircularGauge';
import { HexGrid } from '../components/HexGrid';
import { PerfMonitor } from '../components/PerfMonitor';
import { DataFlow } from '../components/DataFlow';
import { AudioVisualizer } from '../components/AudioVisualizer';
import { useAgentConnection } from '../../application/useAgentConnection';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { useVoiceSystem } from '../hooks/useVoiceSystem';

// VoicePulseVisualizer replaced by the standalone AudioVisualizer component

// ── Diagnostics Dot ────────────────────────────────────────────────────────────
function DiagDot({ label, ok, sub }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px',
      fontSize: '0.45rem',
      color: ok ? 'var(--accent)' : 'rgba(255,255,255,0.2)',
      fontFamily: "'Share Tech Mono', monospace",
    }}>
      <span style={{
        width: '5px', height: '5px', borderRadius: '50%',
        background: ok ? '#22c55e' : '#ef4444',
        boxShadow: ok ? '0 0 6px rgba(34,197,94,0.6)' : 'none',
        display: 'inline-block',
      }} />
      {label}{sub != null && <span style={{ opacity: 0.5, marginLeft: '1px' }}>{sub}</span>}
    </span>
  );
}

// ── Skeleton Panel (loading placeholder) ─────────────────────────────────────────
function SkeletonPanel({ lines = 6 }) {
  // Deterministic widths to avoid Math.random() in render (React purity rule)
  const widths = [55, 70, 45, 60, 50, 65, 40, 75, 52, 58];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px' }}>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="skeleton-box" style={{
            width: `${widths[i % widths.length]}%`, height: '8px', borderRadius: '2px',
          }} />
        </div>
      ))}
    </div>
  );
}

// ── Network Quality Indicator ────────────────────────────────────────────────────
function NetworkQuality({ latency }) {
  const label = latency == null ? 'OFFLINE'
    : latency < 30 ? 'EXCELLENT'
    : latency < 80 ? 'GOOD'
    : latency < 150 ? 'FAIR'
    : 'POOR';
  const color = latency == null ? '#ef4444'
    : latency < 30 ? '#22c55e'
    : latency < 80 ? '#86efac'
    : latency < 150 ? '#eab308'
    : '#ef4444';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      fontSize: '0.45rem', color: 'rgba(255,255,255,0.2)',
      fontFamily: "'Share Tech Mono', monospace",
      marginLeft: '4px',
    }}>
      <span style={{
        width: '5px', height: '5px', borderRadius: '50%',
        background: color,
        boxShadow: `0 0 6px ${color}`,
        display: 'inline-block',
      }} />
      NET: {label}
    </span>
  );
}

// ── Toast Notification System ───────────────────────────────────────────────────
function ToastContainer({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast-item ${t.type}`}>{t.message}</div>
      ))}
    </div>
  );
}

function useToasts(soundFx) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const addToast = (message, type = 'info', duration = 4000) => {
    const id = ++idRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    // Play sound based on toast type
    if (soundFx) {
      if (type === 'success') soundFx.playChirp(1800, 0.1, 'sine');
      else if (type === 'error') soundFx.playChirp(300, 0.2, 'sawtooth');
      else if (type === 'warning') soundFx.playChirp(800, 0.12, 'triangle');
      else soundFx.playChirp(1200, 0.06, 'sine');
    }
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  };

  return { toasts, addToast };
}

function App() {
  const { t, i18n } = useTranslation();
  const { agentStatus, connectionStatus, wsLatency, metrics, termOutput, chatHistory, sendCommand, abortAgent, tokenData, clearTokens, clearChat } = useAgentConnection();
  const soundFx = useSoundEffects(agentStatus);
  const { playChirp, playTick } = soundFx;
  const { toasts, addToast } = useToasts(soundFx);
  const [showSettings, setShowSettings] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [showEvolution, setShowEvolution] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [clock, setClock] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [sysConfig, setSysConfig] = useState({ provider: 'anthropic', model: 'claude-opus-4-5', budget: 0 });
  const [diagState, setDiagState] = useState({
    wsConnected: false,
    claudeAvailable: false,
    keyValid: false,
    proxyRunning: false,
  });
  const [uptime, setUptime] = useState('00:00:00');
  const [panelsLoaded, setPanelsLoaded] = useState(false);
  // Token history for sparkline (last 20 data points)
  const [tokenHistory, setTokenHistory] = useState([]);
  const tokenHistoryRef = useRef([]);

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

  const [handsFreeMode, setHandsFreeMode] = useState(false);
  const handsFreeModeRef = useRef(false);
  const isSpeakingRef = useRef(false);

  // Hook into voice system (STT & TTS) — declare before handleSend since it provides stopListening
  const { isListening, isSpeaking, toggleListening, startListening, stopListening, speak } = useVoiceSystem((text) => {
    // SECURITY GUARD: If the Agent is already busy thinking, running tools, or speaking,
    // we absolutely discard any background murmurs or accidental captures.
    if (agentStatus !== 'idle' || isSpeakingRef.current) {
      return;
    }

    // Ignore extremely short garbage words (e.g. less than 2 characters unless it's an Arabic word)
    const trimmed = text.trim();
    if (trimmed.length < 2) {
      return;
    }

    setChatInput(trimmed);
    playChirp(1200, 0.1);
    if (handsFreeModeRef.current && handleSendRef.current) {
      handleSendRef.current(trimmed);
    }
  });

  // Sync values to refs for use in voice callback (avoids hook ordering issues)
  const stopListeningRef = useRef(null);
  const handleSendRef = useRef(null);
  useEffect(() => { stopListeningRef.current = stopListening; }, [stopListening]);
  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);
  const chatInputRef = useRef(chatInput);
  useEffect(() => { chatInputRef.current = chatInput; }, [chatInput]);

  const handleSend = useCallback((textOverride) => {
    const textToSend = typeof textOverride === 'string' ? textOverride : chatInputRef.current;
    if (textToSend.trim()) {
      playChirp(1300, 0.08);
      if (stopListeningRef.current) stopListeningRef.current(); // SECURITY GATING
      sendCommand(textToSend, i18n.language);
      setChatInput('');
    }
  }, [playChirp, sendCommand, i18n.language]);
  // eslint-disable-next-line react-hooks/immutability
  useEffect(() => { handleSendRef.current = handleSend; }, [handleSend]);

  useEffect(() => { document.body.dir = i18n.language === 'ar' ? 'rtl' : 'ltr'; }, [i18n.language]);
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const ms = String(d.getMilliseconds()).slice(0, 2).padStart(2, '0');
      setClock(d.toLocaleTimeString('en-US', { hour12: false }) + '.' + ms);
    };
    tick(); const id = setInterval(tick, 50); return () => clearInterval(id);
  }, []);

  // ── Diagnostics Polling ────────────────────────────────────────────────────
  const prevConnectionRef = useRef(connectionStatus);
  useEffect(() => {
    if (prevConnectionRef.current !== connectionStatus) {
      prevConnectionRef.current = connectionStatus;
      if (connectionStatus === 'connected') {
        addToast('WebSocket connected', 'success', 3000);
      } else if (connectionStatus === 'reconnecting') {
        addToast('WebSocket reconnecting...', 'warning', 5000);
      } else if (connectionStatus === 'disconnected') {
        addToast('WebSocket disconnected', 'error', 5000);
      }
    }
  }, [connectionStatus, addToast]);
  useEffect(() => {
    const check = () => {
      fetch('http://localhost:3001/api/proxy/status')
        .then(r => r.json())
        .then(d => {
          setDiagState({
            wsConnected: connectionStatus === 'connected',
            claudeAvailable: d.claudeAvailable || false,
            keyValid: d.keyValid || false,
            proxyRunning: d.proxyRunning || false,
          });
        })
        .catch(() => {
          setDiagState({ wsConnected: false, claudeAvailable: false, keyValid: false, proxyRunning: false });
        });
    };
    check();
    const id = setInterval(check, 10000);
    return () => clearInterval(id);
  }, [connectionStatus]);

  // ── Uptime & Metrics Polling ────────────────────────────────────────────────
  useEffect(() => {
    const fetchMetrics = () => {
      fetch('http://localhost:3001/api/metrics')
        .then(r => r.json())
        .then(data => {
          if (data.uptime != null) {
            const hrs = Math.floor(data.uptime / 3600);
            const mins = Math.floor((data.uptime % 3600) / 60);
            const secs = Math.floor(data.uptime % 60);
            setUptime(
              String(hrs).padStart(2, '0') + ':' +
              String(mins).padStart(2, '0') + ':' +
              String(secs).padStart(2, '0')
            );
          }
        })
        .catch(() => {});
    };
    fetchMetrics();
    const id = setInterval(fetchMetrics, 5000);
    return () => clearInterval(id);
  }, []);

  // Mark panels as loaded once we have metrics data (derived state)
  const panelsReady = panelsLoaded || (metrics.cpu !== 0 && metrics.ram !== 0);
  if (!panelsLoaded && panelsReady) {
    // Trigger once outside render cycle via setTimeout
    setTimeout(() => setPanelsLoaded(true), 0);
  }

  // ── Token History Sparkline ──────────────────────────────────────────────────
  const prevTotalRef = useRef(0);
  useEffect(() => {
    const total = tokenData.totalTokens || 0;
    if (total !== prevTotalRef.current) {
      prevTotalRef.current = total;
      tokenHistoryRef.current = [...tokenHistoryRef.current.slice(-19), total];
      setTokenHistory(tokenHistoryRef.current);
    }
  }, [tokenData.totalTokens]);


  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const lastSpokenIndexRef = useRef(-1);

  // Play mechanical ticking typing sounds on streaming character changes
  const prevStreamLengthRef = useRef(0);
  useEffect(() => {
    const lastMsg = chatHistory[chatHistory.length - 1];
    if (lastMsg && lastMsg.role === 'agent' && lastMsg.isStreaming) {
      const len = lastMsg.content.length;
      if (len > prevStreamLengthRef.current) {
        playTick();
        prevStreamLengthRef.current = len;
      }
    } else {
      prevStreamLengthRef.current = 0;
    }
  }, [chatHistory, playTick]);

  // Voice Readout on completed Agent response
  useEffect(() => {
    if (voiceEnabled && agentStatus === 'idle' && chatHistory.length > 0) {
      const lastIndex = chatHistory.length - 1;
      const lastMsg = chatHistory[lastIndex];
      if (lastMsg.role === 'agent' && lastSpokenIndexRef.current < lastIndex) {
        speak(lastMsg.content, () => {
          // Speak onEnd callback
          if (handsFreeModeRef.current) {
            setTimeout(() => {
              playChirp(1100, 0.05);
              startListening();
            }, 300);
          }
        });
        lastSpokenIndexRef.current = lastIndex;
      }
    }
  }, [chatHistory, agentStatus, voiceEnabled, speak, playChirp, startListening]);

  const toggleVoice = () => {
    playChirp(900, 0.06);
    const newVal = !voiceEnabled;
    setVoiceEnabled(newVal);
    if (newVal) {
      setTimeout(() => {
        speak(i18n.language === 'ar' ? 'تم تنشيط المساعد الصوتي.' : 'Voice system online.');
      }, 80);
    } else {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    }
  };

  const toggleHandsFree = () => {
    playChirp(1000, 0.08);
    const newVal = !handsFreeMode;
    setHandsFreeMode(newVal);
    handsFreeModeRef.current = newVal;

    if (newVal) {
      setVoiceEnabled(true);
      speak(i18n.language === 'ar' ? 'تم تفعيل الاتصال المباشر. أنا أستمع إليك الآن.' : 'Hands-free dialog active. I am listening.', () => {
        if (handsFreeModeRef.current) {
          startListening();
        }
      });
    } else {
      stopListening();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    }
  };

  const toggleLang = useCallback(() => {
    playChirp(1000, 0.05);
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    sendCommand(`/SET_LANG ${newLang}`, newLang);
  }, [playChirp, i18n, sendCommand]);

  useEffect(() => {
    if (connectionStatus === 'connected') {
      sendCommand(`/SET_LANG ${i18n.language}`, i18n.language);
    }
  }, [connectionStatus, i18n.language, sendCommand]);

  // ── Global Keyboard Shortcuts ──────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.querySelector('.chat-input');
        if (input) input.focus();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        setShowConsole(prev => !prev);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        setShowSettings(prev => !prev);
        return;
      }
      if (e.key === 'Escape') {
        if (showShortcuts) { setShowShortcuts(false); return; }
        if (showSettings) { setShowSettings(false); return; }
        if (showConsole) { setShowConsole(false); return; }
        if (showEvolution) { setShowEvolution(false); return; }
        if (selectedFile) { setSelectedFile(null); return; }
        return;
      }
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = e.target?.tagName?.toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault();
          setShowShortcuts(prev => !prev);
          return;
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        setShowEvolution(prev => !prev);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        toggleLang();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'X') {
        e.preventDefault();
        abortAgent();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        clearChat();
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSettings, showConsole, showEvolution, showShortcuts, selectedFile, clearChat, toggleLang, abortAgent]);

  let circleCls = 'status-circle';
  if (agentStatus === 'thinking' || agentStatus === 'executing_tool') circleCls += ' thinking';
  const isConnected = connectionStatus === 'connected';

  const dateStr = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

  return (
    <div className="hud-root">
      <div className="scan-line"></div>
      <div className="crt-overlay" />
      <div className="vignette-overlay" />
      <div className="perspective-grid" />

      {/* Cybernetic hex grid background */}
      <HexGrid status={agentStatus} />
      <DataFlow active={agentStatus} />

      {/* Background Matrix Reactor */}
      <ParticleReactor status={agentStatus} style={{ opacity: 0.2 }} />

      {/* TOP HEADER */}
      <div className="top-bar data-stream">
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
            <button className={`nav-btn ${showConsole ? 'active' : ''}`} onClick={() => setShowConsole(prev => !prev)} title="Ctrl+Shift+C"><span className="kbd-hint">⌨</span> CONSOLE</button>
            <button className={`nav-btn ${showEvolution ? 'active' : ''}`} onClick={() => setShowEvolution(true)} title="Ctrl+Shift+E" style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}><span className="kbd-hint">⌨</span> EVOLUTION</button>
            <button className="nav-btn" onClick={() => setShowSettings(true)} title="Ctrl+Shift+S"><span className="kbd-hint">⌨</span> SETTINGS</button>
            <button className={`nav-btn ${voiceEnabled ? 'active' : ''}`} onClick={toggleVoice} title={voiceEnabled ? 'Mute Voice' : 'Unmute Voice'} style={{ color: voiceEnabled ? (handsFreeMode ? '#00ffd5' : 'var(--accent)') : 'var(--text-dim)' }}>
              VOICE: {voiceEnabled ? (handsFreeMode ? 'HANDS-FREE' : 'ACTIVE') : 'MUTED'}
            </button>
            <button className="nav-btn" onClick={toggleLang} title="Ctrl+Shift+L">LANG</button>
            <button className="nav-btn" onClick={abortAgent} title="Ctrl+Shift+X" style={{ color: '#ff5555' }}>{t("emergency_stop")}</button>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <DiagDot label="WS" ok={isConnected} sub={isConnected && wsLatency != null ? `${wsLatency}ms` : null} />
            <DiagDot label="API" ok={diagState.keyValid} />
            <DiagDot label="CLD" ok={diagState.claudeAvailable} />
            <DiagDot label="PRX" ok={diagState.proxyRunning} />
            <NetworkQuality latency={wsLatency} />
          </div>
        </div>
      </div>

      {/* ═══ CYBERNETIC IDE 3-COLUMN LAYOUT CONTAINER ═══ */}
      <div className="ide-layout-container" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        
        {/* ── COLUMN 1: LEFT SIDEBAR (File Manager & System details) ── */}
        <div className="ide-column ide-left-col">
          
          {/* Left Top Pane: Workspace Files */}
          <div className="tech-panel ide-panel left-top-pane">
            <div className="panel-scan" />
            <span className="corner-tl" /><span className="corner-br" />
            <div className="tech-panel-header">
              <span>📁 {t("workspace").toUpperCase()}</span>
              <span style={{ fontSize: '0.45rem', color: 'var(--accent)' }}>D:\IRON MAN</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', marginTop: '8px' }}>
              <FileTreeHUD onFileSelect={setSelectedFile} />
            </div>
          </div>

          {/* Left Bottom Pane: System Engine Diagnostics */}
          <div className="tech-panel ide-panel left-bottom-pane">
            <div className="panel-scan" />
            <span className="corner-tl" /><span className="corner-br" />
            <div className="tech-panel-header">
              <span>⌂ {t("system_engine")}</span>
              <span style={{ fontSize: '0.45rem', color: 'var(--accent)' }}>{t("sec")}</span>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', marginTop: '6px', fontSize: '0.55rem' }}>
              {!panelsLoaded ? <SkeletonPanel lines={6} /> : (
                <>
                  <div className="sys-row"><span>SIGNAL CORE</span><span className="val">{agentStatus.toUpperCase()}</span></div>
                  <div className="sys-row"><span>{t("mem_usage")}</span><span className="val">{metrics.ram || 0}%</span></div>
                  <div className="sys-row"><span>{t("cpu_load")}</span><span className="val">{metrics.cpu || 0}%</span></div>
                  <div className="sys-row"><span>UPTIME</span><span className="val">{uptime}</span></div>
                  <div className="sys-row"><span>{t("temp")}</span><span className="val">54.8 °C</span></div>
                  <div className="sys-row"><span>{t("link")}</span><span className="val">STABLE</span></div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── COLUMN 2: MIDDLE PANE (Code Editor & Live Terminal) ── */}
        <div className="ide-column ide-mid-col">
          
          {/* Middle Top Pane: The Code Editor or central landing core */}
          <div className="tech-panel ide-panel mid-top-pane" style={{ padding: 0 }}>
            <div className="panel-scan" />
            <span className="corner-tl" /><span className="corner-br" />
            {selectedFile ? (
              <CodeEditor filePath={selectedFile} onClose={() => setSelectedFile(null)} />
            ) : (
              <div className="reactor-editor-fallback">
                <div style={{
                  position: 'absolute', top: '16px', left: '16px',
                  fontFamily: 'Orbitron', fontSize: '0.6rem', color: 'rgba(0, 162, 255, 0.6)',
                  letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <span className="cursor-blink">▶</span> SYSTEM REACTOR CORE
                </div>
                <div style={{
                  fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem',
                  color: 'var(--text-dim)', letterSpacing: '1px', textAlign: 'center', zIndex: 10,
                  maxWidth: '320px', padding: '18px', background: 'rgba(3,12,30,0.85)',
                  border: '1px solid rgba(0,255,213,0.15)', borderRadius: '4px',
                  boxShadow: '0 0 20px rgba(0,184,255,0.15)',
                  animation: 'pulse 3s infinite'
                }}>
                  <div style={{ color: 'var(--accent)', fontWeight: 'bold', marginBottom: '4px' }}>NO BUFFER ACTIVE</div>
                  SELECT A SOURCE FILE FROM THE LEFT TREE PANEL TO MOUNT AND EDIT BUFFER IN ACTIVE MEMORY.
                </div>
              </div>
            )}
          </div>

          {/* Middle Bottom Pane: The Live Terminal (Always Open) */}
          <div className="tech-panel ide-panel mid-bottom-pane" style={{ padding: 0 }}>
            <div className="panel-scan" />
            <span className="corner-tl" /><span className="corner-br" />
            <Terminal output={termOutput || []} />
          </div>
        </div>

        {/* ── COLUMN 3: RIGHT PANEL (Spectrometer & Conversation Chat) ── */}
        <div className="ide-column ide-right-col">
          
          {/* Right Top Pane: Spectrometer, Circular gauges and Token flows */}
          <div className="tech-panel ide-panel" style={{ flex: 1.1, minHeight: 0 }}>
            <div className="panel-scan" />
            <span className="corner-tl" /><span className="corner-br" />
            <div className="tech-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>⌁ TELEMETRY</span>
              <button onClick={clearTokens} style={{
                background: 'transparent', border: 'none', color: 'var(--accent)',
                fontSize: '0.45rem', cursor: 'pointer', fontFamily: 'monospace'
              }}>{t("clear") || "CLEAR"}</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, marginTop: '6px', fontSize: '0.55rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                <AudioVisualizer
                  isListening={isListening}
                  isSpeaking={isSpeaking}
                  agentStatus={agentStatus}
                  size={75}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <CircularGauge label="CPU" value={metrics.cpu || 0} color="#00a2ff" size={54} />
                  <CircularGauge label="RAM" value={metrics.ram || 0} color="#00ffd5" size={54} />
                </div>
              </div>

              {/* Sparkline & Cost info */}
              <div style={{ borderTop: '1px solid rgba(0,255,213,0.1)', paddingTop: '6px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '4px' }}>
                  <div>
                    <div style={{ fontSize: '0.38rem', color: 'var(--text-dim)' }}>TOKENS IN</div>
                    <div style={{ fontSize: '0.55rem', fontWeight: 'bold', color: 'var(--text)' }}>{(tokenData.tokensIn || 0).toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.38rem', color: 'var(--text-dim)' }}>TOKENS OUT</div>
                    <div style={{ fontSize: '0.55rem', fontWeight: 'bold', color: 'var(--text)' }}>{(tokenData.tokensOut || 0).toLocaleString()}</div>
                  </div>
                </div>

                {tokenHistory.length > 1 && (
                  <div style={{ marginTop: '6px', marginBottom: '6px' }}>
                    <div style={{ height: '18px', display: 'flex', alignItems: 'flex-end', gap: '1px' }}>
                      {(() => {
                        const max = Math.max(...tokenHistory, 1);
                        return tokenHistory.slice(-25).map((val, i) => {
                          const h = Math.max(2, (val / max) * 16);
                          return (
                            <div key={i} style={{
                              flex: 1, height: `${h}px`,
                              background: `linear-gradient(to top, rgba(0,162,255,0.4), rgba(0,255,213,0.7))`
                            }} />
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', borderTop: '1px solid rgba(0,255,213,0.08)', paddingTop: '4px' }}>
                  <span style={{ color: 'var(--accent)', fontSize: '0.4rem', letterSpacing: '0.5px' }}>ESTIMATED COST</span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                    ${estimateCost(sysConfig.model, tokenData.tokensIn, tokenData.tokensOut).toFixed(5)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Bottom Pane: Conversational Chat Panel */}
          <div className="tech-panel ide-panel right-chat-pane" style={{ flex: 1.9, minHeight: 0 }}>
            <div className="panel-scan" />
            <span className="corner-tl" /><span className="corner-br" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '4px', marginBottom: '6px', cursor: 'default' }}>
              <span style={{ fontFamily: 'Orbitron', fontSize: '0.58rem', letterSpacing: '1.5px', color: 'var(--primary)' }}>◉ {t("directives")}</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {chatHistory.length > 0 && (
                  <button onClick={clearChat} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', fontSize: '0.45rem', cursor: 'pointer', fontFamily: 'monospace' }}>{t("clear") || "CLEAR"}</button>
                )}
                <span style={{ fontSize: '0.45rem', color: 'var(--accent)' }}>AWAITING</span>
              </div>
            </div>

            <div className="chat-msgs" style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
              {chatHistory.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.52rem', letterSpacing: '1px' }}>{t("placeholder_command")}</div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`chat-msg ${msg.role === 'user' ? 'user' : 'agent'}${msg.isStreaming ? ' streaming' : ''}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="chat-tag">{msg.role === 'user' ? t("you") : t("ironman")}</div>
                    {msg.ts && <span style={{ fontSize: '0.4rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{new Date(msg.ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</span>}
                  </div>
                  <div style={{ wordBreak: 'break-word', marginTop: '2px' }}>{msg.content}{msg.isStreaming && <span className="cursor-blink">▊</span>}</div>
                </div>
              ))}
            </div>

            <div className="chat-input-row" style={{ alignItems: 'center', marginTop: '8px', gap: '6px' }}>
              {/* Voice Response Toggle Button */}
              <button className={`hud-btn hud-btn-icon ${voiceEnabled ? 'active' : ''}`}
                      onClick={toggleVoice}
                      title={voiceEnabled ? "Mute Voice Response" : "Unmute Voice Response"}>
                {voiceEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
              </button>

              {/* Microphone Voice Input Button */}
              <button className={`hud-btn hud-btn-icon ${isListening && !handsFreeMode ? 'active' : ''}`}
                      onClick={toggleListening}
                      disabled={handsFreeMode}
                      title={isListening ? "Stop Recording" : "Record Voice"}>
                {isListening && !handsFreeMode ? <Mic size={12} className="thinking" /> : <MicOff size={12} />}
              </button>

              {/* Hands-Free Dialog Mode Button */}
              <button className={`hud-btn hud-btn-icon ${handsFreeMode ? 'active' : ''}`}
                      onClick={toggleHandsFree}
                      title={handsFreeMode ? "Disable Hands-Free Dialog" : "Enable Hands-Free Dialog"}>
                <Radio size={12} className={handsFreeMode ? "thinking" : ""} />
              </button>

              <input className="chat-input" value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder={handsFreeMode ? (i18n.language === 'ar' ? 'يتنصت الآن تلقائياً...' : 'Listening hands-free...') : t("placeholder_command")}
                style={{ flex: 1 }} />

              <button className="hud-btn hud-btn-icon" onClick={handleSend}><SendHorizontal size={11} /></button>
            </div>
          </div>
        </div>

      </div>

      <AnimatePresence>
        {showSettings && (
          <SettingsModal onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showEvolution && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <EvolutionModal onClose={() => setShowEvolution(false)} sendCommand={sendCommand} agentStatus={agentStatus} termOutput={termOutput} />
          </motion.div>
        )}
      </AnimatePresence>

      <StatusBar
        connectionStatus={connectionStatus}
        wsLatency={wsLatency}
        uptime={uptime}
        metrics={metrics}
        agentStatus={agentStatus}
        sysConfig={sysConfig}
        onConsoleToggle={() => setShowConsole(prev => !prev)}
        onSettingsToggle={() => setShowSettings(prev => !prev)}
        onAbort={abortAgent}
      />
      <ToastContainer toasts={toasts} />
      <AnimatePresence>
        {showShortcuts && (
          <KeyboardShortcuts onClose={() => setShowShortcuts(false)} />
        )}
      </AnimatePresence>
      <PerfMonitor />
      <AnimatePresence>
      {showConsole && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="modal-overlay" onClick={() => setShowConsole(false)} style={{ zIndex: 100 }}>
          <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="modal-box" onClick={e => e.stopPropagation()} style={{ width: '85%', height: '85%', maxWidth: '1200px', display: 'flex', flexDirection: 'column', background: 'rgba(5, 10, 20, 0.95)', border: '1px solid var(--accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <h2 style={{ margin: 0, color: 'var(--primary)', fontFamily: 'Orbitron', fontSize: '1.2rem', letterSpacing: '2px' }}>SYSTEM CONSOLE</h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button onClick={() => clearChat()} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-dim)', padding: '4px 12px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.55rem', borderRadius: '3px' }}>CLEAR</button>
                <button onClick={() => setShowConsole(false)} className="hud-btn hud-btn-icon"><X size={16} /></button>
              </div>
            </div>
            <div style={{ flex: 1, minHeight: 0, border: '1px solid rgba(0, 255, 213, 0.2)', background: '#000', borderRadius: '4px', overflow: 'hidden' }}>
              <Terminal output={termOutput} />
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

export default App;
