import { useState, useEffect, useCallback } from 'react';
import { X, GitBranch, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

// ── Parse unified diff into hunks ────────────────────────────────────────────
function parseDiff(raw) {
  if (!raw) return [];
  const files = [];
  let current = null;
  let hunk = null;

  raw.split('\n').forEach(line => {
    if (line.startsWith('diff --git')) {
      if (current) files.push(current);
      const match = line.match(/b\/(.+)$/);
      current = { file: match?.[1] || line, hunks: [], collapsed: false };
      hunk = null;
    } else if (line.startsWith('@@') && current) {
      const m = line.match(/@@ .+ @@(.*)?/);
      hunk = { header: line, context: m?.[1]?.trim() || '', lines: [] };
      current.hunks.push(hunk);
    } else if (hunk && current) {
      if (line.startsWith('---') || line.startsWith('+++') || line.startsWith('index') || line.startsWith('new file') || line.startsWith('deleted')) return;
      hunk.lines.push(line);
    }
  });
  if (current) files.push(current);
  return files;
}

// ── Single diff line ─────────────────────────────────────────────────────────
function DiffLine({ line }) {
  const isAdd = line.startsWith('+');
  const isDel = line.startsWith('-');

  return (
    <div style={{
      display: 'flex',
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: '0.72rem',
      lineHeight: '18px',
      background: isAdd ? 'rgba(34,197,94,0.07)' : isDel ? 'rgba(239,68,68,0.07)' : 'transparent',
      borderLeft: isAdd ? '2px solid rgba(34,197,94,0.4)' : isDel ? '2px solid rgba(239,68,68,0.4)' : '2px solid transparent',
    }}>
      {/* Gutter marker */}
      <span style={{
        width: '20px', flexShrink: 0, textAlign: 'center',
        color: isAdd ? '#22c55e' : isDel ? '#ef4444' : 'rgba(255,255,255,0.15)',
        fontSize: '0.7rem', userSelect: 'none',
        padding: '0 4px',
      }}>
        {isAdd ? '+' : isDel ? '−' : ' '}
      </span>
      {/* Content */}
      <span style={{
        flex: 1, padding: '0 8px',
        color: isAdd ? '#86efac' : isDel ? '#fca5a5' : 'rgba(255,255,255,0.55)',
        whiteSpace: 'pre',
        overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {line.slice(1) || ' '}
      </span>
    </div>
  );
}

// ── File diff block ──────────────────────────────────────────────────────────
function FileDiff({ file, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const addCount = file.hunks.flatMap(h => h.lines).filter(l => l.startsWith('+')).length;
  const delCount = file.hunks.flatMap(h => h.lines).filter(l => l.startsWith('-')).length;

  return (
    <div style={{
      marginBottom: '8px',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '6px',
      overflow: 'hidden',
    }}>
      {/* File header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '7px 12px', cursor: 'pointer',
          background: 'rgba(255,255,255,0.03)',
          borderBottom: open ? '1px solid rgba(255,255,255,0.06)' : 'none',
          userSelect: 'none',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
      >
        {open ? <ChevronDown size={12} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
               : <ChevronUp size={12} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />}
        <span style={{
          flex: 1, fontFamily: "'Share Tech Mono', monospace",
          fontSize: '0.72rem', color: 'var(--text)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {file.file}
        </span>
        {addCount > 0 && <span style={{ fontSize: '0.62rem', color: '#22c55e', fontWeight: '700', fontFamily: 'monospace' }}>+{addCount}</span>}
        {delCount > 0 && <span style={{ fontSize: '0.62rem', color: '#ef4444', fontWeight: '700', fontFamily: 'monospace' }}>-{delCount}</span>}
      </div>

      {/* Hunks */}
      {open && file.hunks.map((hunk, hi) => (
        <div key={hi}>
          {/* Hunk header */}
          <div style={{
            padding: '3px 12px',
            background: 'rgba(109,40,217,0.06)',
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '0.62rem', color: 'rgba(139,92,246,0.7)',
            borderTop: hi > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
          }}>
            {hunk.header}
          </div>
          {/* Lines */}
          {hunk.lines.map((line, li) => (
            <DiffLine key={li} line={line} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── DiffViewer main panel ────────────────────────────────────────────────────
export function DiffViewer({ onClose }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDiff = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch('http://localhost:3001/api/git/diff')
      .then(r => r.json())
      .then(data => {
        const text = data.diff || data.output || '';
        setFiles(parseDiff(text));
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch diff');
        setLoading(false);
      });
  }, []);

  useEffect(() => { fetchDiff(); }, [fetchDiff]);

  // Ctrl+Shift+D to close
  useEffect(() => {
    const h = (e) => { if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') { e.preventDefault(); onClose?.(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const totalAdds = files.flatMap(f => f.hunks.flatMap(h => h.lines)).filter(l => l.startsWith('+')).length;
  const totalDels = files.flatMap(f => f.hunks.flatMap(h => h.lines)).filter(l => l.startsWith('-')).length;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 900,
      background: 'rgba(2,6,16,0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '85%', maxWidth: '1100px', height: '82vh',
          background: 'rgba(6,12,24,0.97)',
          border: '1px solid rgba(109,40,217,0.25)',
          borderRadius: '12px',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(109,40,217,0.1)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(109,40,217,0.04)',
          flexShrink: 0,
        }}>
          <GitBranch size={14} style={{ color: 'var(--hero)' }} />
          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '0.8rem', fontWeight: '700', color: 'var(--text)', letterSpacing: '1px' }}>
            GIT DIFF
          </span>
          <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>
            {files.length} file{files.length !== 1 ? 's' : ''} changed
          </span>
          {totalAdds > 0 && <span style={{ fontSize: '0.62rem', color: '#22c55e', fontFamily: 'monospace', fontWeight: '700' }}>+{totalAdds}</span>}
          {totalDels > 0 && <span style={{ fontSize: '0.62rem', color: '#ef4444', fontFamily: 'monospace', fontWeight: '700' }}>-{totalDels}</span>}
          <div style={{ flex: 1 }} />
          <kbd style={{
            fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '3px', padding: '2px 6px', fontFamily: 'monospace',
          }}>Ctrl+Shift+D</kbd>
          <button onClick={fetchDiff} title="Refresh diff"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '4px', display: 'flex', borderRadius: '4px', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
          ><RefreshCw size={13} /></button>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '4px', display: 'flex', borderRadius: '4px', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
          ><X size={15} /></button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }} className="diff-scroll">
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px' }}>
              {[80, 55, 70, 40, 65].map((w, i) => (
                <div key={i} className="skeleton-box" style={{ height: 16, width: `${w}%`, borderRadius: 3 }} />
              ))}
            </div>
          )}
          {!loading && error && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#f87171', fontFamily: "'Outfit', sans-serif", fontSize: '0.8rem' }}>
              {error}
            </div>
          )}
          {!loading && !error && files.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px', opacity: 0.15 }}>✓</div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif", fontSize: '0.82rem', letterSpacing: '1px' }}>
                WORKING TREE CLEAN
              </div>
              <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.65rem', marginTop: '6px' }}>No changes detected</div>
            </div>
          )}
          {!loading && files.map((file, i) => (
            <FileDiff key={i} file={file} defaultOpen={i < 3} />
          ))}
        </div>
      </div>
    </div>
  );
}
