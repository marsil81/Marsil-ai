import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Save, X, Copy, Check, FileCode, FileJson, FileText, FileType, File } from 'lucide-react';

// ── File type detection ────────────────────────────────────────────────────────
const FILE_TYPE_ICONS = {
  js:   { icon: FileCode,  color: '#f7df1e' },
  jsx:  { icon: FileCode,  color: '#61dafb' },
  ts:   { icon: FileCode,  color: '#3178c6' },
  tsx:  { icon: FileCode,  color: '#3178c6' },
  json: { icon: FileJson,  color: '#5a5a5a' },
  css:  { icon: FileType,  color: '#663399' },
  html: { icon: FileType,  color: '#e34f26' },
  md:   { icon: FileText,  color: '#083fa1' },
  py:   { icon: FileCode,  color: '#3776ab' },
  cpp:  { icon: FileCode,  color: '#00599c' },
  c:    { icon: FileCode,  color: '#a8b9cc' },
  java: { icon: FileCode,  color: '#b07219' },
  go:   { icon: FileCode,  color: '#00add8' },
  rs:   { icon: FileCode,  color: '#dea584' },
  yml:  { icon: FileText,  color: '#cb171e' },
  yaml: { icon: FileText,  color: '#cb171e' },
  sh:   { icon: FileCode,  color: '#4eaa25' },
  bat:  { icon: FileCode,  color: '#4eaa25' },
  ps1:  { icon: FileCode,  color: '#012456' },
};

function getFileTypeInfo(filePath) {
  const ext = filePath?.split('.').pop()?.toLowerCase() || '';
  const info = FILE_TYPE_ICONS[ext];
  if (info) return info;
  return { icon: File, color: 'var(--text-dim)' };
}

// ── Simple Syntax Highlighter ─────────────────────────────────────────────────
const KEYWORDS = new Set([
  'import', 'export', 'from', 'default', 'const', 'let', 'var', 'function',
  'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break',
  'continue', 'try', 'catch', 'finally', 'throw', 'new', 'class', 'extends',
  'async', 'await', 'yield', 'typeof', 'instanceof', 'this', 'super',
  'true', 'false', 'null', 'undefined', 'of', 'in', 'require', 'module',
]);

function highlightLine(line) {
  if (!line) return [{ text: '', type: 'plain' }];
  const parts = [];
  let i = 0;

  while (i < line.length) {
    // Strings (single/double/backtick)
    const strMatch = line.slice(i).match(/^(["'`])(?:(?!\1|\\).|\\.)*\1/);
    if (strMatch) {
      parts.push({ text: strMatch[0], type: 'string' });
      i += strMatch[0].length;
      continue;
    }

    // Comments (// and #)
    if (line[i] === '/' && line[i + 1] === '/') {
      parts.push({ text: line.slice(i), type: 'comment' });
      break;
    }
    if (line[i] === '#') {
      parts.push({ text: line.slice(i), type: 'comment' });
      break;
    }

    // Multi-char tokens: words and numbers
    const wordMatch = line.slice(i).match(/^[\w$]+/);
    if (wordMatch) {
      const word = wordMatch[0];
      if (KEYWORDS.has(word)) {
        parts.push({ text: word, type: 'keyword' });
      } else if (!isNaN(Number(word))) {
        parts.push({ text: word, type: 'number' });
      } else {
        parts.push({ text: word, type: 'plain' });
      }
      i += word.length;
      continue;
    }

    // Operators and punctuation
    const opMatch = line.slice(i).match(/^[{}()[\],.;:+\-*/%=<>!&|^~?@]+/);
    if (opMatch) {
      parts.push({ text: opMatch[0], type: 'operator' });
      i += opMatch[0].length;
      continue;
    }

    // Fallback: single character
    parts.push({ text: line[i], type: 'plain' });
    i++;
  }

  return parts;
}

const HIGHLIGHT_COLORS = {
  keyword:   '#ff79c6',
  string:    '#f1fa8c',
  comment:   '#6272a4',
  number:    '#bd93f9',
  operator:  '#ff79c6',
  plain:     'var(--text)',
};

// ── Line Number gutter ────────────────────────────────────────────────────────
function LineNumbers({ count, scrollTop, visibleHeight, lineHeight }) {
  const startLine = Math.max(0, Math.floor(scrollTop / lineHeight) - 1);
  const endLine = Math.min(count, startLine + Math.ceil(visibleHeight / lineHeight) + 2);
  const lines = [];

  for (let i = startLine; i < endLine; i++) {
    lines.push(
      <div key={i} style={{
        height: lineHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingRight: '10px',
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '0.7rem',
        color: i === 0 ? 'var(--accent)' : 'rgba(0,184,255,0.3)',
        userSelect: 'none',
      }}>
        {i + 1}
      </div>
    );
  }

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '44px',
      paddingTop: `${startLine * lineHeight}px`,
      pointerEvents: 'none',
    }}>
      {lines}
    </div>
  );
}

// ── CodeEditor Component ──────────────────────────────────────────────────────
export function CodeEditor({ filePath, onClose }) {
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [visibleHeight, setVisibleHeight] = useState(400);
  const prevPathRef = useRef(null);
  const textareaRef = useRef(null);
  const overlayRef = useRef(null);
  const lineHeight = 20;

  useEffect(() => {
    if (!filePath) return;
    if (prevPathRef.current !== filePath) {
      prevPathRef.current = filePath;
      setLoading(true);
    }
    fetch(`http://localhost:3001/api/file?path=${encodeURIComponent(filePath)}`)
      .then(res => res.json())
      .then(data => {
        setContent(data.content || '');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filePath]);

  const handleSave = useCallback(() => {
    setSaving(true);
    fetch('http://localhost:3001/api/file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath, content })
    })
    .then(() => setSaving(false))
    .catch(() => setSaving(false));
  }, [filePath, content]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [content]);

  const handleKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  }, [handleSave]);

  // Sync textarea scroll with overlay
  const handleScroll = useCallback(() => {
    if (textareaRef.current) {
      setScrollTop(textareaRef.current.scrollTop);
      setVisibleHeight(textareaRef.current.clientHeight);
      if (overlayRef.current) {
        overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      }
    }
  }, []);

  // Build highlighted lines (memoized)
  const highlightedLines = useMemo(() => {
    return content.split('\n').map(line => highlightLine(line));
  }, [content]);

  // Detect file extension for display and icon
  const ext = filePath ? filePath.split('.').pop().toUpperCase() : '';
  const fileTypeInfo = getFileTypeInfo(filePath);
  const FileIcon = fileTypeInfo.icon;

  if (!filePath) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 'min(85vw, 800px)',
      height: 'min(80vh, 600px)',
      background: 'rgba(5, 10, 25, 0.88)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(0, 255, 213, 0.25)',
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      boxShadow: '0 0 60px rgba(0, 162, 255, 0.15), 0 0 120px rgba(0, 255, 213, 0.05)',
      overflow: 'hidden',
    }}>
      {/* ── Header ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 14px',
        borderBottom: '1px solid rgba(0, 255, 213, 0.15)',
        background: 'rgba(0, 255, 213, 0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileIcon size={14} color={fileTypeInfo.color} />
          <span style={{
            color: 'var(--primary)',
            fontFamily: 'Orbitron',
            fontSize: '0.65rem',
            letterSpacing: '1px',
            textShadow: '0 0 10px rgba(0,162,255,0.3)',
          }}>
            {filePath.toUpperCase()}
          </span>
          {ext && (
            <span style={{
              fontSize: '0.45rem',
              color: 'var(--accent)',
              background: 'rgba(0,255,213,0.08)',
              padding: '1px 6px',
              borderRadius: '3px',
              border: '1px solid rgba(0,255,213,0.15)',
            }}>
              {ext}
            </span>
          )}
          {saving && (
            <span style={{ color: 'var(--accent)', fontSize: '0.5rem', animation: 'pulse 0.8s infinite' }}>
              SAVING...
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={handleCopy} title="Copy content"
            style={{
              background: copied ? 'rgba(34,197,94,0.1)' : 'transparent',
              border: `1px solid ${copied ? '#22c55e' : 'rgba(255,255,255,0.12)'}`,
              color: copied ? '#22c55e' : 'var(--text-dim)',
              padding: '4px 8px', borderRadius: '4px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.55rem',
              transition: 'all 0.2s',
            }}>
            {copied ? <Check size={10} /> : <Copy size={10} />}
            {copied ? 'COPIED' : 'COPY'}
          </button>
          <button onClick={handleSave} title="Save (Ctrl+S)"
            style={{
              background: 'rgba(0,162,255,0.06)',
              border: '1px solid var(--primary)',
              color: 'var(--primary)',
              padding: '4px 10px', borderRadius: '4px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.55rem',
              transition: 'all 0.2s',
            }}>
            <Save size={10} /> SAVE
          </button>
          <button onClick={onClose} title="Close"
            style={{
              background: 'transparent', border: 'none',
              color: 'var(--text-dim)', cursor: 'pointer',
              padding: '4px',
            }}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Editor Body ── */}
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{
            color: 'var(--text-dim)', fontSize: '0.7rem',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            height: '100%', letterSpacing: '2px',
          }}>
            <span style={{ animation: 'pulse 1.2s infinite' }}>LOADING CONTENT...</span>
          </div>
        ) : (
          <>
            {/* Highlighted overlay */}
            <div ref={overlayRef} style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              overflow: 'hidden',
              pointerEvents: 'none',
              padding: '12px 12px 12px 56px',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '0.75rem',
              lineHeight: `${lineHeight}px`,
              whiteSpace: 'pre',
              color: 'var(--text)',
            }}>
              {highlightedLines.map((parts, idx) => (
                <div key={idx} style={{ height: lineHeight }}>
                  {parts.map((part, pIdx) => (
                    <span key={pIdx} style={{ color: HIGHLIGHT_COLORS[part.type] || 'var(--text)' }}>
                      {part.text}
                    </span>
                  ))}
                  {/* Show a visible space for empty lines */}
                  {parts.length === 1 && parts[0].text === '' && (
                    <span style={{ opacity: 0.15 }}> </span>
                  )}
                </div>
              ))}
            </div>

            {/* Line numbers */}
            <LineNumbers
              count={content.split('\n').length}
              scrollTop={scrollTop}
              visibleHeight={visibleHeight}
              lineHeight={lineHeight}
            />

            {/* Transparent textarea for editing */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              onScroll={handleScroll}
              spellCheck="false"
              style={{
                position: 'absolute',
                top: 0, left: 0, width: '100%', height: '100%',
                padding: '12px 12px 12px 56px',
                background: 'transparent',
                border: 'none',
                color: 'transparent',
                caretColor: 'var(--accent)',
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.75rem',
                lineHeight: `${lineHeight}px`,
                outline: 'none',
                resize: 'none',
                overflow: 'auto',
                whiteSpace: 'pre',
                zIndex: 2,
              }}
            />

            {/* Bottom-right glow indicator */}
            <div style={{
              position: 'absolute',
              bottom: '8px',
              right: '12px',
              fontSize: '0.4rem',
              color: 'rgba(0,184,255,0.2)',
              fontFamily: "'Share Tech Mono', monospace",
              pointerEvents: 'none',
              letterSpacing: '1px',
            }}>
              {content.split('\n').length} LINES · {content.length} CHARS
            </div>
          </>
        )}
      </div>
    </div>
  );
}
