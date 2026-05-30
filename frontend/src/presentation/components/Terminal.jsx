import { useEffect, useRef, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';

// ── ANSI to CSS color mapping ─────────────────────────────────────────────────
const ANSI_COLORS = {
  '30': '#000000', '31': '#ef4444', '32': '#22c55e', '33': '#eab308',
  '34': '#3b82f6', '35': '#a855f7', '36': '#06b6d4', '37': '#e2e8f0',
  '90': '#64748b', '91': '#f87171', '92': '#4ade80', '93': '#facc15',
  '94': '#60a5fa', '95': '#c084fc', '96': '#22d3ee', '97': '#f8fafc',
};

// ── ANSI escape sequence parser ───────────────────────────────────────────────
// Supports: \x1b[0m (reset), \x1b[31m (color), \x1b[1m (bold), \x1b[90m (bright)
function parseAnsi(text) {
  if (!text) return [{ text: '', bold: false, color: null }];
  const parts = [];
  let bold = false;
  let color = null;
  let lastIdx = 0;
  const ESC = String.fromCharCode(27);
  const regex = new RegExp(ESC + '\\[(\\d+(?:;\\d+)*)m', 'g');
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Push text before this escape
    if (match.index > lastIdx) {
      parts.push({ text: text.slice(lastIdx, match.index), bold, color });
    }

    const codes = match[1].split(';').map(Number);
    for (const code of codes) {
      if (code === 0) { bold = false; color = null; }
      else if (code === 1) bold = true;
      else if (code === 22) bold = false;
      else if (code >= 30 && code <= 37) color = ANSI_COLORS[String(code)];
      else if (code >= 90 && code <= 97) color = ANSI_COLORS[String(code)];
    }
    lastIdx = match.index + match[0].length;
  }

  // Push remaining text
  if (lastIdx < text.length) {
    parts.push({ text: text.slice(lastIdx), bold, color });
  }

  return parts;
}

// ── Terminal Component ────────────────────────────────────────────────────────
export function Terminal({ output }) {
  const { t } = useTranslation();
  const terminalRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output, autoScroll]);

  // Auto-focus search input when shown
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // Parse and filter output
  const parsedLines = useMemo(() => {
    return output.map(line => parseAnsi(line));
  }, [output]);

  const filteredIndices = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const indices = [];
    for (let i = 0; i < output.length; i++) {
      if (output[i].toLowerCase().includes(q)) {
        indices.push(i);
      }
    }
    return indices;
  }, [output, searchQuery]);

  const currentFilteredSet = useMemo(() => {
    if (!filteredIndices) return null;
    return new Set(filteredIndices);
  }, [filteredIndices]);

  const toggleSearch = () => {
    setShowSearch(prev => !prev);
    if (showSearch) setSearchQuery('');
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Terminal Bar */}
      <div className="terminal-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="terminal-bar-dot">
            <span></span><span></span><span></span>
          </div>
          <span style={{ fontWeight: 'bold' }}>marsil-cmd</span>
          <span style={{ color: 'var(--accent)', animation: 'pulse 1.5s infinite', fontSize: '0.78rem', opacity: 0.8 }}>● active</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Scroll Toggle Button */}
          <button
            onClick={() => setAutoScroll(prev => !prev)}
            title="Toggle Auto-Scroll Lock"
            style={{
              background: 'transparent',
              border: `1px solid ${autoScroll ? 'var(--accent)' : 'rgba(0, 162, 255, 0.25)'}`,
              color: autoScroll ? 'var(--accent)' : 'var(--text-dim)',
              fontSize: '0.78rem',
              padding: '3px 8px',
              borderRadius: '3px',
              cursor: 'pointer',
              fontFamily: "'Share Tech Mono', monospace",
              letterSpacing: '0.5px',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: autoScroll ? '0 0 6px rgba(0, 255, 213, 0.2)' : 'none'
            }}
          >
            <span style={{
              width: '4px', height: '4px', borderRadius: '50%',
              background: autoScroll ? 'var(--accent)' : 'transparent',
              border: `1px solid ${autoScroll ? 'transparent' : 'var(--text-dim)'}`,
              display: 'inline-block'
            }} />
            {autoScroll ? 'SCROLL:LOCK' : 'SCROLL:FREE'}
          </button>

          {/* Search Toggle Button */}
          <button
            onClick={toggleSearch}
            title="Search logs"
            style={{
              background: 'transparent',
              border: `1px solid ${showSearch ? 'var(--accent)' : 'rgba(0, 162, 255, 0.25)'}`,
              color: showSearch ? 'var(--accent)' : 'var(--text-dim)',
              fontSize: '0.78rem',
              padding: '3px 8px',
              borderRadius: '3px',
              cursor: 'pointer',
              fontFamily: "'Share Tech Mono', monospace",
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              transition: 'all 0.2s'
            }}
          >
            <Search size={12} />
            FIND
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '4px 10px',
          background: 'rgba(0,162,255,0.06)',
          borderBottom: '1px solid rgba(0,255,213,0.12)',
        }}>
          <Search size={12} style={{ color: 'var(--text-dim)' }} />
          <input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter output..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text)',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
          {filteredIndices && (
            <span style={{ fontSize: '0.78rem', color: 'var(--accent)' }}>
              {filteredIndices.length} matches
            </span>
          )}
          <button onClick={toggleSearch} style={{
            background: 'none', border: 'none', color: 'var(--text-dim)',
            cursor: 'pointer', padding: '2px', display: 'flex',
          }}>
            <X size={12} />
          </button>
        </div>
      )}

      {/* Terminal Output */}
      <div
        ref={terminalRef}
        className="terminal-wrapper"
        dir="ltr"
        style={{ position: 'relative' }}
      >
        {output.length === 0 ? (
          <div className="terminal-line">
            <span className="prompt">❯</span>
            <span>{t('terminal_init')}</span>
          </div>
        ) : (
          output.map((rawLine, i) => {
            const isHighlighted = currentFilteredSet && currentFilteredSet.has(i);
            const isDimmed = currentFilteredSet && !currentFilteredSet.has(i);
            const parts = parsedLines[i];

            return (
              <div
                className="terminal-line"
                key={i}
                style={{
                  opacity: isDimmed ? 0.25 : 1,
                  background: isHighlighted ? 'rgba(0,255,213,0.04)' : 'transparent',
                  transition: 'opacity 0.15s, background 0.15s',
                }}
              >
                <span className="prompt">❯</span>
                <span>
                  {parts.map((part, j) => (
                    <span
                      key={j}
                      style={{
                        color: part.color || undefined,
                        fontWeight: part.bold ? 700 : 400,
                      }}
                    >
                      {part.text}
                    </span>
                  ))}
                </span>
              </div>
            );
          })
        )}

        {/* Search hint when no search bar */}
        {!showSearch && output.length > 10 && (
          <div
            onClick={toggleSearch}
            style={{
              position: 'sticky',
              bottom: '4px',
              textAlign: 'center',
              fontSize: '0.78rem',
              color: 'rgba(0,184,255,0.25)',
              cursor: 'pointer',
              padding: '2px',
              letterSpacing: '1px',
            }}
          >
            🔍 SEARCH
          </div>
        )}
      </div>
    </div>
  );
}
