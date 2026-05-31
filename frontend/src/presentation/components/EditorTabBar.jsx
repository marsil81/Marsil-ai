import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Pin, FileCode, FileJson, FileText, FileType, File } from 'lucide-react';

// ── File type → icon + color ──────────────────────────────────────────────────
const FILE_TYPE_MAP = {
  js:   { icon: FileCode,  color: '#f7df1e' },
  jsx:  { icon: FileCode,  color: '#61dafb' },
  ts:   { icon: FileCode,  color: '#3178c6' },
  tsx:  { icon: FileCode,  color: '#3178c6' },
  json: { icon: FileJson,  color: '#a0c4ff' },
  css:  { icon: FileType,  color: '#be93fd' },
  html: { icon: FileType,  color: '#e34f26' },
  md:   { icon: FileText,  color: '#7dd3fc' },
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
  ps1:  { icon: FileCode,  color: '#5391fe' },
  env:  { icon: FileText,  color: '#eab308' },
  gitignore: { icon: FileText, color: '#f05032' },
};

function getFileInfo(filePath) {
  const name = filePath?.split(/[\\/]/).pop() || filePath || 'untitled';
  const ext  = name.split('.').pop()?.toLowerCase() || '';
  const info = FILE_TYPE_MAP[ext];
  return {
    name,
    ext,
    icon:  info?.icon  || File,
    color: info?.color || 'var(--text-dim)',
  };
}

// ── Context Menu ──────────────────────────────────────────────────────────────
function ContextMenu({ x, y, tab, onClose, onCloseTab, onCloseOthers, onCloseAll, onPin, onCopyPath }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener('click', handler, { once: true });
    window.addEventListener('contextmenu', handler, { once: true });
    return () => { window.removeEventListener('click', handler); window.removeEventListener('contextmenu', handler); };
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed', top: y, left: x, zIndex: 9999,
        background: 'rgba(8,14,26,0.98)',
        border: '1px solid rgba(0,255,213,0.2)',
        borderRadius: '8px',
        padding: '4px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(0,255,213,0.05)',
        minWidth: '180px',
        backdropFilter: 'blur(12px)',
        fontFamily: "'Outfit', sans-serif",
        fontSize: '0.72rem',
      }}
      onClick={e => e.stopPropagation()}
    >
      {[
        { label: tab.isPinned ? '⊘ Unpin Tab' : '📌 Pin Tab', action: onPin },
        { label: '✕  Close Tab', action: () => onCloseTab(tab.path), danger: true },
        { label: '✕✕ Close Others', action: () => onCloseOthers(tab.path) },
        { label: '✕✕✕ Close All', action: onCloseAll },
        null,
        { label: '⎘  Copy Full Path', action: () => onCopyPath(tab.path) },
      ].map((item, i) => (
        item === null
          ? <div key={i} style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '3px 6px' }} />
          : (
            <button
              key={i}
              onClick={() => { item.action(); onClose(); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                background: 'none', border: 'none', cursor: 'pointer',
                color: item.danger ? '#f87171' : 'var(--text)',
                padding: '6px 12px', borderRadius: '5px',
                transition: 'background 0.15s',
                letterSpacing: '0.3px',
              }}
              onMouseEnter={e => e.currentTarget.style.background = item.danger ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              {item.label}
            </button>
          )
      ))}
    </div>
  );
}

// ── EditorTabBar ──────────────────────────────────────────────────────────────
export function EditorTabBar({ tabs, activeTab, onSwitch, onClose, onCloseOthers, onCloseAll, onPin }) {
  const [ctxMenu, setCtxMenu] = useState(null); // { x, y, tab }
  const scrollRef = useRef(null);

  // Scroll active tab into view
  useEffect(() => {
    if (!scrollRef.current || !activeTab) return;
    const activeEl = scrollRef.current.querySelector('[data-active="true"]');
    if (activeEl) activeEl.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [activeTab]);

  // Ctrl+W = close active tab
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        const current = tabs.find(t => t.path === activeTab);
        if (current && !current.isPinned) {
          e.preventDefault();
          onClose(current.path);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [tabs, activeTab, onClose]);

  // Ctrl+Tab / Ctrl+Shift+Tab = next/prev tab
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Tab') {
        e.preventDefault();
        if (tabs.length < 2) return;
        const idx = tabs.findIndex(t => t.path === activeTab);
        const next = e.shiftKey
          ? (idx - 1 + tabs.length) % tabs.length
          : (idx + 1) % tabs.length;
        onSwitch(tabs[next].path);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [tabs, activeTab, onSwitch]);

  const handleContextMenu = useCallback((e, tab) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, tab });
  }, []);

  const handleCopyPath = useCallback((path) => {
    navigator.clipboard.writeText(path).catch(() => {});
  }, []);

  if (tabs.length === 0) return null;

  return (
    <>
      <div style={{
        display: 'flex',
        alignItems: 'stretch',
        background: 'rgba(4,10,22,0.9)',
        borderBottom: '1px solid rgba(0,255,213,0.12)',
        height: '36px',
        overflowX: 'auto',
        overflowY: 'hidden',
        scrollbarWidth: 'none',
        flexShrink: 0,
        position: 'relative',
      }}
        ref={scrollRef}
        className="tab-bar"
      >
        {tabs.map((tab) => {
          const info = getFileInfo(tab.path);
          const FileIcon = info.icon;
          const isActive = tab.path === activeTab;
          const isDirty = tab.isDirty;

          return (
            <div
              key={tab.path}
              data-active={isActive}
              onClick={() => onSwitch(tab.path)}
              onContextMenu={(e) => handleContextMenu(e, tab)}
              title={tab.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0 10px',
                height: '100%',
                minWidth: '100px',
                maxWidth: '200px',
                cursor: 'pointer',
                flexShrink: 0,
                position: 'relative',
                background: isActive
                  ? 'rgba(0,255,213,0.05)'
                  : 'transparent',
                borderRight: '1px solid rgba(255,255,255,0.05)',
                transition: 'background 0.15s',
                userSelect: 'none',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              {/* Active indicator line */}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  bottom: 0, left: 0, right: 0,
                  height: '2px',
                  background: 'linear-gradient(90deg, var(--primary), var(--accent))',
                  boxShadow: '0 0 8px rgba(0,255,213,0.5)',
                }} />
              )}

              {/* Pin indicator */}
              {tab.isPinned && (
                <Pin size={9} style={{ color: 'var(--hero)', flexShrink: 0 }} />
              )}

              {/* File icon */}
              <FileIcon size={12} color={info.color} style={{ flexShrink: 0 }} />

              {/* Filename */}
              <span style={{
                fontSize: '0.7rem',
                fontFamily: "'Outfit', sans-serif",
                color: isActive ? 'var(--text)' : 'var(--text-dim)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                fontWeight: isActive ? '500' : '400',
              }}>
                {info.name}
              </span>

              {/* Dirty dot */}
              {isDirty && (
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: '#f59e0b', flexShrink: 0,
                  boxShadow: '0 0 4px #f59e0b',
                }} />
              )}

              {/* Close button (hidden on pinned) */}
              {!tab.isPinned && (
                <button
                  onClick={(e) => { e.stopPropagation(); onClose(tab.path); }}
                  title="Close (Ctrl+W)"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.3)', padding: '2px',
                    display: 'flex', alignItems: 'center', flexShrink: 0,
                    borderRadius: '3px', transition: 'all 0.15s',
                    lineHeight: 1,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'none'; }}
                >
                  <X size={10} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Context Menu */}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          tab={ctxMenu.tab}
          onClose={() => setCtxMenu(null)}
          onCloseTab={onClose}
          onCloseOthers={onCloseOthers}
          onCloseAll={onCloseAll}
          onPin={() => onPin(ctxMenu.tab.path)}
          onCopyPath={handleCopyPath}
        />
      )}
    </>
  );
}
