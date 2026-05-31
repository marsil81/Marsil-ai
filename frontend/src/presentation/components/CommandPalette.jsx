/**
 * 🌌 MARSIL AI — CommandPalette Component
 * Ctrl+K spotlight overlay: search files, commands, providers, history.
 * Designed to be faster and cleaner than Cursor's command palette.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, File, Terminal, Settings, Zap, GitBranch, X } from 'lucide-react';
import './CommandPalette.css';

const STATIC_COMMANDS = [
  { id: 'abort',    icon: <Zap size={14} />,        label: 'Abort Agent',        desc: 'Stop current task',             category: 'Action',   shortcut: 'Ctrl+Shift+X' },
  { id: 'clear',    icon: <Terminal size={14} />,    label: 'Clear Chat',         desc: 'Reset conversation history',    category: 'Action',   shortcut: 'Ctrl+L' },
  { id: 'console',  icon: <Terminal size={14} />,    label: 'Toggle Console',     desc: 'Show/hide system console',      category: 'View',     shortcut: 'Ctrl+Shift+C' },
  { id: 'settings', icon: <Settings size={14} />,    label: 'Open Settings',      desc: 'Configure API keys and model',  category: 'View',     shortcut: 'Ctrl+Shift+S' },
  { id: 'lang-ar',  icon: <span style={{fontSize:'0.9rem'}}>🇸🇦</span>, label: 'Switch to Arabic', desc: 'تبديل اللغة إلى العربية', category: 'Language', shortcut: '' },
  { id: 'lang-en',  icon: <span style={{fontSize:'0.9rem'}}>🇬🇧</span>, label: 'Switch to English', desc: 'Switch interface language', category: 'Language', shortcut: '' },
  { id: 'git',      icon: <GitBranch size={14} />,   label: 'Git Status',         desc: 'View repository status',        category: 'Git',      shortcut: '' },
];

export function CommandPalette({ open, onClose, files = [], onFileSelect, onAction }) {
  const [query, setQuery]     = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef              = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const fileResults = query.length > 0
    ? files.filter(f => f.name?.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : [];

  const cmdResults = STATIC_COMMANDS.filter(c =>
    !query || c.label.toLowerCase().includes(query.toLowerCase()) || c.category.toLowerCase().includes(query.toLowerCase())
  );

  const allResults = [
    ...fileResults.map(f => ({ ...f, _type: 'file' })),
    ...cmdResults.map(c => ({ ...c, _type: 'cmd' })),
  ];

  const handleKey = useCallback((e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, allResults.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter')     { e.preventDefault(); handleSelect(allResults[selected]); }
    if (e.key === 'Escape')    { onClose(); }
  }, [allResults, selected, onClose]);

  const handleSelect = (item) => {
    if (!item) return;
    if (item._type === 'file') { onFileSelect?.(item.path); onClose(); return; }
    onAction?.(item.id);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="cp-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="cp-box"
            initial={{ opacity: 0, y: -24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
          >
            {/* Search Bar */}
            <div className="cp-search">
              <Search size={16} className="cp-search-icon" />
              <input
                ref={inputRef}
                className="cp-input"
                placeholder="Search files, commands, settings…"
                value={query}
                onChange={e => { setQuery(e.target.value); setSelected(0); }}
                onKeyDown={handleKey}
              />
              {query && (
                <button className="cp-clear" onClick={() => { setQuery(''); setSelected(0); inputRef.current?.focus(); }}>
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Results */}
            <div className="cp-results">
              {allResults.length === 0 && (
                <div className="cp-empty">No results for "{query}"</div>
              )}
              {allResults.map((item, i) => (
                <button
                  key={item._type + (item.id || item.path || i)}
                  className={`cp-item${i === selected ? ' selected' : ''}`}
                  onMouseEnter={() => setSelected(i)}
                  onClick={() => handleSelect(item)}
                >
                  <span className="cp-item-icon">
                    {item._type === 'file' ? <File size={14} /> : item.icon}
                  </span>
                  <span className="cp-item-body">
                    <span className="cp-item-label">{item._type === 'file' ? item.name : item.label}</span>
                    <span className="cp-item-desc">{item._type === 'file' ? item.path : item.desc}</span>
                  </span>
                  <span className="cp-item-meta">
                    <span className="cp-item-category">{item._type === 'file' ? 'File' : item.category}</span>
                    {item.shortcut && <span className="cp-item-shortcut">{item.shortcut}</span>}
                  </span>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="cp-footer">
              <span><kbd>↑↓</kbd> navigate</span>
              <span><kbd>↵</kbd> select</span>
              <span><kbd>Esc</kbd> close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
