import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, FileText, FolderClosed, FolderOpen, Plus } from 'lucide-react';

export function FileTreeHUD({ onFileSelect }) {
  const [tree, setTree] = useState([]);
  const [expanded, setExpanded] = useState({});

  const fetchTree = () => {
    fetch('http://localhost:3001/api/files')
      .then(r => r.json())
      .then(data => setTree(data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchTree();
    const id = setInterval(fetchTree, 6000);
    return () => clearInterval(id);
  }, []);

  const toggle = (path) => {
    setExpanded(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const handleNewFile = () => {
    const fileName = prompt('Enter new file name:');
    if (fileName) {
      fetch('http://localhost:3001/api/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: fileName, content: '' })
      }).then(() => {
        fetchTree();
        if (onFileSelect) onFileSelect(fileName);
      });
    }
  };

  const renderNode = (node) => {
    if (node.isDirectory) {
      const isExp = expanded[node.path];
      return (
        <div key={node.path} style={{ marginLeft: '8px' }}>
          <div
            onClick={() => toggle(node.path)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
              fontSize: '0.65rem', color: 'var(--text)', padding: '3px 0',
              fontFamily: 'monospace'
            }}
          >
            {isExp ? <ChevronDown size={11} style={{color: 'var(--accent)'}} /> : <ChevronRight size={11} style={{color: 'var(--accent)'}} />}
            {isExp ? <FolderOpen size={12} style={{ color: 'var(--primary)' }} /> : <FolderClosed size={12} style={{ color: 'var(--primary)' }} />}
            <span>{node.name.toUpperCase()}</span>
          </div>
          {isExp && node.children && node.children.map(child => renderNode(child))}
        </div>
      );
    } else {
      return (
        <div
          key={node.path}
          onClick={() => onFileSelect && onFileSelect(node.path)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '22px',
            fontSize: '0.6rem', color: 'var(--text-dim)', padding: '2px 0',
            cursor: 'pointer', fontFamily: 'monospace',
            transition: 'color 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dim)'}
        >
          <FileText size={10} style={{ color: 'rgba(0, 255, 213, 0.5)' }} />
          <span>{node.name}</span>
        </div>
      );
    }
  };

  return (
    <div style={{ maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
        <button onClick={handleNewFile} style={{
          background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)',
          fontSize: '0.45rem', padding: '2px 6px', borderRadius: '3px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '2px'
        }}>
          <Plus size={8} /> NEW FILE
        </button>
      </div>
      {tree.map(node => renderNode(node))}
    </div>
  );
}
