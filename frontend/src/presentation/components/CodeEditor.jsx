import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';

export function CodeEditor({ filePath, onClose }) {
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!filePath) return;
    setLoading(true);
    fetch(`http://localhost:3001/api/file?path=${encodeURIComponent(filePath)}`)
      .then(res => res.json())
      .then(data => {
        setContent(data.content || '');
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [filePath]);

  const handleSave = () => {
    setSaving(true);
    fetch('http://localhost:3001/api/file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath, content })
    })
    .then(() => setSaving(false))
    .catch(() => setSaving(false));
  };

  if (!filePath) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '600px',
      height: '400px',
      background: 'rgba(5, 10, 20, 0.85)',
      backdropFilter: 'blur(10px)',
      border: '1px solid var(--primary)',
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      boxShadow: '0 0 30px rgba(0, 255, 213, 0.2)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 12px', borderBottom: '1px solid rgba(0, 255, 213, 0.3)',
        background: 'rgba(0, 255, 213, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--primary)', fontFamily: 'Orbitron', fontSize: '0.7rem' }}>
            {filePath.toUpperCase()}
          </span>
          {saving && <span style={{ color: 'var(--accent)', fontSize: '0.5rem' }}>SAVING...</span>}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleSave} style={{
            background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)',
            padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '0.6rem'
          }}>
            <Save size={10} /> SAVE
          </button>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer'
          }}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div style={{ flex: 1, padding: '10px' }}>
        {loading ? (
          <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            LOADING CONTENT...
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{
              width: '100%', height: '100%',
              background: 'transparent',
              border: 'none',
              color: 'var(--text)',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              outline: 'none',
              resize: 'none',
              lineHeight: '1.4'
            }}
            spellCheck="false"
          />
        )}
      </div>
    </div>
  );
}
