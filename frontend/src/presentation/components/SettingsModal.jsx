import { useState, useEffect, useRef } from 'react';
import { X, Eye, EyeOff, ShieldCheck, CheckCircle, AlertCircle, Zap } from 'lucide-react';

// ── Provider definitions ──────────────────────────────────────────────────────
const PROVIDERS = [
  {
    id: 'anthropic',
    label: 'Anthropic',
    sublabel: 'Claude 3.5 / 4',
    color: '#D97706',
    description: 'Official Anthropic API — most capable Claude models',
    baseUrl: null,
    requiresKey: true,
    models: [
      { value: 'claude-opus-4-5',      label: 'Claude Opus 4.5 (Best)' },
      { value: 'claude-sonnet-4-5',    label: 'Claude Sonnet 4.5 (Fast)' },
      { value: 'claude-3-5-haiku-latest', label: 'Claude Haiku (Cheapest)' },
    ]
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    sublabel: 'deepseek-chat / coder',
    color: '#2563EB',
    description: 'High performance at very low cost — great for coding',
    baseUrl: 'https://api.deepseek.com/v1',
    requiresKey: true,
    models: [
      { value: 'deepseek-chat',      label: 'DeepSeek Chat (General)' },
      { value: 'deepseek-coder',     label: 'DeepSeek Coder (Code)' },
      { value: 'deepseek-reasoner',  label: 'DeepSeek Reasoner (CoT)' },
    ]
  },
  {
    id: 'openai',
    label: 'OpenAI',
    sublabel: 'GPT-4o / o1',
    color: '#10B981',
    description: 'OpenAI models routed through Claude Code',
    baseUrl: 'https://api.openai.com/v1',
    requiresKey: true,
    models: [
      { value: 'gpt-4o',        label: 'GPT-4o (Recommended)' },
      { value: 'gpt-4o-mini',   label: 'GPT-4o Mini (Fast)' },
      { value: 'o1-mini',       label: 'o1 Mini (Reasoning)' },
    ]
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    sublabel: 'gemini-2.0-flash',
    color: '#7C3AED',
    description: 'Google Gemini via OpenAI-compatible endpoint',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    requiresKey: true,
    models: [
      { value: 'gemini-2.0-flash',       label: 'Gemini 2.0 Flash (Fast)' },
      { value: 'gemini-1.5-pro',          label: 'Gemini 1.5 Pro (Best)' },
      { value: 'gemini-1.5-flash',        label: 'Gemini 1.5 Flash (Cheap)' },
    ]
  },
  {
    id: 'ollama',
    label: 'Ollama',
    sublabel: 'Local / Offline',
    color: '#059669',
    description: 'Run any model locally — 100% private, no API key needed',
    baseUrl: 'http://localhost:11434/v1',
    requiresKey: false,
    models: [
      { value: 'llama3.2',    label: 'Llama 3.2' },
      { value: 'codellama',   label: 'Code Llama' },
      { value: 'qwen2.5-coder', label: 'Qwen 2.5 Coder' },
      { value: 'mistral',     label: 'Mistral' },
    ]
  },
  {
    id: 'custom',
    label: 'Custom',
    sublabel: 'Any OpenAI-compatible',
    color: '#6B7280',
    description: 'Connect any OpenAI-compatible API endpoint',
    baseUrl: '',
    requiresKey: true,
    models: [
      { value: 'custom-model', label: 'Custom Model' },
    ]
  },
];

// ── Cost estimates per 1M tokens (input) in USD ───────────────────────────────
const COST_PER_M_IN = {
  'claude-opus-4-5': 15,
  'claude-sonnet-4-5': 3,
  'claude-3-5-haiku-latest': 0.8,
  'deepseek-chat': 0.14,
  'deepseek-coder': 0.14,
  'deepseek-reasoner': 0.55,
  'gpt-4o': 5,
  'gpt-4o-mini': 0.15,
  'o1-mini': 3,
  'gemini-2.0-flash': 0.1,
  'gemini-1.5-pro': 3.5,
  'gemini-1.5-flash': 0.075,
};
const COST_PER_M_OUT = {
  'claude-opus-4-5': 75,
  'claude-sonnet-4-5': 15,
  'claude-3-5-haiku-latest': 4,
  'deepseek-chat': 0.28,
  'deepseek-coder': 0.28,
  'deepseek-reasoner': 2.19,
  'gpt-4o': 15,
  'gpt-4o-mini': 0.6,
  'o1-mini': 12,
  'gemini-2.0-flash': 0.4,
  'gemini-1.5-pro': 10.5,
  'gemini-1.5-flash': 0.3,
};

// eslint-disable-next-line react-refresh/only-export-components
export function estimateCost(model, tokensIn, tokensOut) {
  const inCost  = ((tokensIn  || 0) / 1_000_000) * (COST_PER_M_IN[model]  || 2);
  const outCost = ((tokensOut || 0) / 1_000_000) * (COST_PER_M_OUT[model] || 8);
  return inCost + outCost;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function SettingsModal({ onClose }) {
  const [provider,    setProvider]    = useState('anthropic');
  const [apiKey,      setApiKey]      = useState('');
  const [model,       setModel]       = useState('');
  const [customUrl,   setCustomUrl]   = useState('');
  const [customModel, setCustomModel] = useState('');
  const [budget,      setBudget]      = useState(0);
  const [showKey,     setShowKey]     = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [hasKey,      setHasKey]      = useState(false);
  const [claudeAvailable, setClaudeAvailable] = useState(false);
  const [claudeVersion,   setClaudeVersion]   = useState(null);

  // Reset model when provider changes — derive default during render
  const providerDef = PROVIDERS.find(p => p.id === provider) || PROVIDERS[0];

  useEffect(() => {
    fetch('http://localhost:3001/api/config')
      .then(r => r.json())
      .then(c => {
        const prov = c.provider || 'anthropic';
        setProvider(prov);
        setModel(c.model || '');
        setHasKey(c.hasKey || false);
        setBudget(c.budget || 0);
        setClaudeAvailable(c.claudeAvailable || false);
        setClaudeVersion(c.claudeVersion || null);
        if (prov === 'custom') setCustomUrl(c.baseUrl || '');
      })
      .catch(() => {});
  }, []);

  // Reset model when provider changes — derive during render
  // Reset model when provider changes — schedule outside effect to avoid cascading render warning
  const prevProviderRef = useRef(provider);
  useEffect(() => {
    if (prevProviderRef.current !== provider) {
      prevProviderRef.current = provider;
      const def = PROVIDERS.find(p => p.id === provider);
      if (def && def.models.length > 0) {
        // Use microtask to defer state update outside the effect's synchronous execution
        queueMicrotask(() => setModel(def.models[0].value));
      }
    }
  }, [provider]);

  const handleSave = async () => {
    const body = {
      provider,
      model: provider === 'custom' ? customModel : model,
      budget: Number(budget) || 0,
      baseUrl: provider === 'custom' ? customUrl : (providerDef.baseUrl || null),
    };
    if (apiKey.trim()) body.apiKey = apiKey;

    await fetch('http://localhost:3001/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    setSaved(true);
    setHasKey(!!apiKey || hasKey);
    setTimeout(() => { setSaved(false); onClose(); }, 900);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '560px', maxHeight: '90vh', overflowY: 'auto',
          background: 'rgba(8,14,26,0.97)',
          border: '1px solid rgba(0,255,213,0.25)',
          borderRadius: '12px',
          boxShadow: '0 0 60px rgba(0,255,213,0.1)',
          padding: '28px',
          fontFamily: "'Share Tech Mono', monospace",
          color: 'var(--text)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <div style={{ fontFamily: 'Orbitron', fontSize: '1rem', color: 'var(--primary)', letterSpacing: '2px' }}>
              ⚙ AI PROVIDER SETTINGS
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              Configure Claude Code to use any AI model
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        {/* Claude Code status bar */}
        <div style={{
          padding: '10px 14px', borderRadius: '8px', marginBottom: '20px',
          background: claudeAvailable ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${claudeAvailable ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.65rem'
        }}>
          {claudeAvailable
            ? <><CheckCircle size={13} color="#22c55e" /> <span style={{ color: '#22c55e' }}>Claude Code {claudeVersion} — installed & ready</span></>
            : <><AlertCircle size={13} color="#ef4444" /> <span style={{ color: '#ef4444' }}>Claude Code not found — <code>npm i -g @anthropic-ai/claude-code</code></span></>
          }
        </div>

        {/* Provider Cards */}
        <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', marginBottom: '10px', letterSpacing: '1.5px' }}>
          SELECT AI PROVIDER
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '20px' }}>
          {PROVIDERS.map(p => (
            <button
              key={p.id}
              onClick={() => setProvider(p.id)}
              style={{
                background: provider === p.id ? `rgba(${hexToRgb(p.color)},0.15)` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${provider === p.id ? p.color : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '8px', padding: '10px 8px', cursor: 'pointer',
                textAlign: 'left', transition: 'all 0.2s ease',
                boxShadow: provider === p.id ? `0 0 12px ${p.color}40` : 'none',
              }}
            >
              <div style={{ fontSize: '0.7rem', fontWeight: '700', color: provider === p.id ? p.color : 'var(--text)', fontFamily: 'Orbitron' }}>
                {p.label}
              </div>
              <div style={{ fontSize: '0.52rem', color: 'var(--text-dim)', marginTop: '3px' }}>
                {p.sublabel}
              </div>
            </button>
          ))}
        </div>

        {/* Provider description */}
        <div style={{
          fontSize: '0.6rem', color: 'var(--accent)', padding: '8px 12px',
          background: 'rgba(0,184,255,0.06)', borderRadius: '6px',
          border: '1px solid rgba(0,184,255,0.15)', marginBottom: '20px'
        }}>
          <Zap size={10} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          {providerDef.description}
        </div>

        {/* API Key */}
        {providerDef.requiresKey && (
          <>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', marginBottom: '6px', letterSpacing: '1.5px' }}>
              API KEY
            </div>
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder={hasKey ? '••••••••••••(saved)' : 'Paste your API key here...'}
                autoComplete="new-password"
                style={{
                  width: '100%', padding: '10px 40px 10px 12px', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,255,213,0.2)',
                  borderRadius: '6px', color: 'var(--text)', fontFamily: 'monospace', fontSize: '0.7rem',
                  outline: 'none'
                }}
              />
              <button onClick={() => setShowKey(!showKey)} style={{
                position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)'
              }}>
                {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
            {hasKey && !apiKey && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.55rem', color: '#22c55e', marginBottom: '16px' }}>
                <ShieldCheck size={11} /> Key is saved securely on disk
              </div>
            )}
          </>
        )}

        {/* Custom URL (only for custom/ollama) */}
        {(provider === 'custom' || provider === 'ollama') && (
          <>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', marginBottom: '6px', letterSpacing: '1.5px' }}>
              BASE URL
            </div>
            <input
              value={provider === 'ollama' ? providerDef.baseUrl : customUrl}
              onChange={e => setCustomUrl(e.target.value)}
              readOnly={provider === 'ollama'}
              placeholder="https://your-api-endpoint/v1"
              style={{
                width: '100%', padding: '10px 12px', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,255,213,0.2)',
                borderRadius: '6px', color: 'var(--text)', fontFamily: 'monospace', fontSize: '0.7rem',
                outline: 'none', marginBottom: '16px',
                opacity: provider === 'ollama' ? 0.6 : 1
              }}
            />
          </>
        )}

        {/* Model Selection */}
        <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', marginBottom: '6px', letterSpacing: '1.5px' }}>
          MODEL
        </div>
        {provider === 'custom' ? (
          <input
            value={customModel}
            onChange={e => setCustomModel(e.target.value)}
            placeholder="e.g. my-custom-model-v2"
            style={{
              width: '100%', padding: '10px 12px', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,255,213,0.2)',
              borderRadius: '6px', color: 'var(--text)', fontFamily: 'monospace', fontSize: '0.7rem',
              outline: 'none', marginBottom: '16px'
            }}
          />
        ) : (
          <select
            value={model}
            onChange={e => setModel(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px', marginBottom: '16px',
              background: 'rgba(8,14,26,0.97)', border: '1px solid rgba(0,255,213,0.2)',
              borderRadius: '6px', color: 'var(--text)', fontFamily: 'monospace', fontSize: '0.7rem',
              outline: 'none', cursor: 'pointer'
            }}
          >
            {providerDef.models.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        )}

        {/* Pricing hint */}
        {COST_PER_M_IN[model] && (
          <div style={{ fontSize: '0.55rem', color: 'var(--text-dim)', marginBottom: '16px', opacity: 0.7 }}>
            💰 Pricing: ${COST_PER_M_IN[model]}/M input tokens · ${COST_PER_M_OUT[model]}/M output tokens
          </div>
        )}

        {/* Budget Limit */}
        <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', marginBottom: '6px', letterSpacing: '1.5px' }}>
          SESSION BUDGET LIMIT (USD) — set 0 for unlimited
        </div>
        <input
          type="number"
          min="0"
          step="0.1"
          value={budget}
          onChange={e => setBudget(e.target.value)}
          placeholder="e.g. 1.00"
          style={{
            width: '100%', padding: '10px 12px', boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,255,213,0.2)',
            borderRadius: '6px', color: 'var(--text)', fontFamily: 'monospace', fontSize: '0.7rem',
            outline: 'none', marginBottom: '24px'
          }}
        />

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '9px 20px', background: 'transparent',
            border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px',
            color: 'var(--text-dim)', cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.7rem'
          }}>
            CANCEL
          </button>
          <button onClick={handleSave} style={{
            padding: '9px 24px', background: saved ? 'rgba(34,197,94,0.15)' : 'rgba(0,255,213,0.1)',
            border: `1px solid ${saved ? '#22c55e' : 'var(--primary)'}`,
            borderRadius: '6px', color: saved ? '#22c55e' : 'var(--primary)',
            cursor: 'pointer', fontFamily: 'Orbitron', fontSize: '0.65rem', letterSpacing: '1px',
            transition: 'all 0.3s ease',
            boxShadow: saved ? '0 0 15px rgba(34,197,94,0.3)' : '0 0 10px rgba(0,255,213,0.15)'
          }}>
            {saved ? '✓ SAVED' : 'SAVE CONFIG'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Utility: hex color to rgb string
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
