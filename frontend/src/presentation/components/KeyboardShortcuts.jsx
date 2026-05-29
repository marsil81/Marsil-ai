import { motion } from 'framer-motion';
import { X, Monitor, Terminal, Settings, Zap, Languages, Ban, MessageSquare, Trash2, HelpCircle } from 'lucide-react';

const SHORTCUTS = [
  { keys: ['Ctrl', 'Shift', 'C'], desc: 'Toggle Console', icon: Terminal },
  { keys: ['Ctrl', 'Shift', 'S'], desc: 'Toggle Settings', icon: Settings },
  { keys: ['Ctrl', 'Shift', 'E'], desc: 'Toggle Evolution', icon: Zap },
  { keys: ['Ctrl', 'Shift', 'L'], desc: 'Toggle Language', icon: Languages },
  { keys: ['Ctrl', 'Shift', 'X'], desc: 'Abort Agent', icon: Ban },
  { keys: ['Ctrl', 'K'], desc: 'Focus Chat Input', icon: MessageSquare },
  { keys: ['Ctrl', 'L'], desc: 'Clear Chat', icon: Trash2 },
  { keys: ['?'], desc: 'Toggle Shortcuts', icon: HelpCircle },
  { keys: ['Esc'], desc: 'Close Panels / Modals', icon: Monitor },
];

export function KeyboardShortcuts({ onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 250,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '480px', maxWidth: '90vw',
          background: 'rgba(5,10,25,0.96)',
          border: '1px solid rgba(0,255,213,0.2)',
          borderRadius: '12px',
          boxShadow: '0 0 40px rgba(0,162,255,0.15)',
          padding: '24px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '20px', borderBottom: '1px solid rgba(0,255,213,0.15)',
          paddingBottom: '12px',
        }}>
          <div>
            <div style={{
              fontFamily: 'Orbitron', fontSize: '0.85rem',
              color: 'var(--primary)', letterSpacing: '2px',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <HelpCircle size={14} /> KEYBOARD SHORTCUTS
            </div>
            <div style={{ fontSize: '0.5rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              SYSTEM NAVIGATION &amp; CONTROL COMMANDS
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--text-dim)',
            cursor: 'pointer', padding: '4px',
          }}>
            <X size={16} />
          </button>
        </div>

        {/* Shortcuts List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {SHORTCUTS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '8px 12px',
                background: i % 2 === 0 ? 'rgba(0,162,255,0.03)' : 'transparent',
                borderRadius: '6px',
                transition: 'background 0.15s',
              }}>
                <Icon size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <span style={{
                  flex: 1, fontSize: '0.6rem', color: 'var(--text-dim)',
                  letterSpacing: '0.5px',
                }}>
                  {s.desc}
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {s.keys.map((key, ki) => (
                    <span key={ki} style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      background: 'rgba(0,255,213,0.08)',
                      border: '1px solid rgba(0,255,213,0.2)',
                      borderRadius: '4px',
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: '0.55rem',
                      color: 'var(--accent)',
                    }}>
                      {key}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        <div style={{
          marginTop: '16px', paddingTop: '12px',
          borderTop: '1px solid rgba(0,255,213,0.08)',
          textAlign: 'center',
          fontSize: '0.45rem', color: 'rgba(0,184,255,0.3)',
          letterSpacing: '1px',
        }}>
          PRESS ? OR ESC TO CLOSE
        </div>
      </motion.div>
    </motion.div>
  );
}
