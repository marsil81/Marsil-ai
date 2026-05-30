import { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronDown, FileText, FolderClosed, FolderOpen, Plus, GitBranch, Trash2, Edit3 } from 'lucide-react';

// ── Git Branch Selector ────────────────────────────────────────────────────────
function GitBranchSelector() {
  const [branches, setBranches] = useState([]);
  const [current, setCurrent] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchBranches = useCallback(() => {
    fetch('http://localhost:3001/api/git/branches')
      .then(r => r.json())
      .then(data => {
        if (data.branches) {
          setBranches(data.branches);
          setCurrent(data.current);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchBranches();
    const id = setInterval(fetchBranches, 15000);
    return () => clearInterval(id);
  }, [fetchBranches]);

  const handleSwitch = (name) => {
    if (name === current) return;
    setLoading(true);
    fetch('http://localhost:3001/api/git/branch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, action: 'switch' })
    })
    .then(() => {
      setLoading(false);
      fetchBranches();
    })
    .catch(() => setLoading(false));
  };

  const handleCreateBranch = () => {
    const name = prompt('Enter new branch name:');
    if (name) {
      setLoading(true);
      fetch('http://localhost:3001/api/git/branch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, action: 'create' })
      })
      .then(() => {
        setLoading(false);
        fetchBranches();
      })
      .catch(() => setLoading(false));
    }
  };

  return (
    <div style={{
      marginBottom: '8px',
      padding: '6px 8px',
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid var(--border)',
      borderRadius: '4px',
      position: 'relative',
      transition: 'border-color 0.2s ease, background-color 0.2s ease',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.16)'; e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'; }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        marginBottom: '4px',
      }}>
        <GitBranch size={10} style={{ color: 'var(--accent)' }} />
        <span style={{
          fontSize: '0.48rem', color: 'var(--text-dim)',
          letterSpacing: '0.5px', flex: 1, fontFamily: "'Outfit', sans-serif", fontWeight: '700'
        }}>
          BRANCH
        </span>
        <button onClick={handleCreateBranch} title="New branch"
          style={{
            background: 'transparent', border: 'none',
            color: 'var(--accent)', cursor: 'pointer',
            padding: '1px', display: 'flex',
          }}>
          <Plus size={9} />
        </button>
      </div>
      <select
        value={current}
        onChange={(e) => handleSwitch(e.target.value)}
        disabled={loading}
        style={{
          width: '100%',
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          color: 'var(--text)',
          fontFamily: "'Outfit', sans-serif",
          fontSize: '0.6rem',
          padding: '4px 6px',
          borderRadius: '3px',
          outline: 'none',
          cursor: 'pointer',
          transition: 'border-color 0.2s',
        }}
        onFocus={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
        onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
      >
        {branches.map(b => (
          <option key={b.name} value={b.name}>
            {b.current ? `★ ${b.name}` : `  ${b.name}`}
          </option>
        ))}
      </select>
      {current && !current.startsWith('main') && (
        <button onClick={() => {
          const name = current;
          if (!confirm(`Delete branch "${name}"?`)) return;
          setLoading(true);
          fetch('http://localhost:3001/api/git/branch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, action: 'delete' })
          })
          .then(() => {
            setLoading(false);
            fetchBranches();
          })
          .catch(() => setLoading(false));
        }} title="Delete current branch"
          style={{
            background: 'transparent', border: 'none',
            color: 'var(--danger)', cursor: 'pointer',
            padding: '1px', display: 'flex', marginTop: '4px',
            fontSize: '0.48rem', gap: '3px', alignItems: 'center',
            fontFamily: "'Outfit', sans-serif", fontWeight: '600',
          }}>
          <Trash2 size={8} /> DELETE BRANCH
        </button>
      )}
    </div>
  );
}

// ── File Tree ──────────────────────────────────────────────────────────────────
export function FileTreeHUD({ onFileSelect }) {
  const [tree, setTree] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchTree = useCallback(() => {
    fetch('http://localhost:3001/api/files')
      .then(r => r.json())
      .then(data => {
        setTree(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchTree();
    const id = setInterval(fetchTree, 6000);
    return () => clearInterval(id);
  }, [fetchTree]);

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

  const handleDeleteFile = (filePath) => {
    if (!confirm(`Delete "${filePath}"? This cannot be undone.`)) return;
    fetch(`http://localhost:3001/api/file?path=${encodeURIComponent(filePath)}`, {
      method: 'DELETE',
    }).then(() => fetchTree());
  };

  const handleRenameFile = (oldPath) => {
    const newName = prompt('Rename to:', oldPath.split('/').pop());
    if (newName && newName !== oldPath.split('/').pop()) {
      const parts = oldPath.split('/');
      parts[parts.length - 1] = newName;
      const newPath = parts.join('/');
      fetch('http://localhost:3001/api/file/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPath, newPath })
      }).then(() => fetchTree());
    }
  };

  const [contextMenu, setContextMenu] = useState(null);

  const handleContextMenu = (e, node) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  // ── Recursive tree filter ──
  function filterTree(nodes, query) {
    if (!query) return nodes;
    const lower = query.toLowerCase();
    return nodes.reduce((acc, node) => {
      if (node.isDirectory) {
        const children = filterTree(node.children || [], query);
        if (children.length > 0 || node.name.toLowerCase().includes(lower)) {
          acc.push({ ...node, children });
        }
      } else if (node.name.toLowerCase().includes(lower)) {
        acc.push(node);
      }
      return acc;
    }, []);
  }

  const filteredTree = filter ? filterTree(tree, filter) : tree;

  const renderNode = (node) => {
    if (node.isDirectory) {
      const isExp = expanded[node.path];
      return (
        <div key={node.path} style={{ marginLeft: '8px' }}>
          <div
            onClick={() => toggle(node.path)}
            onContextMenu={(e) => handleContextMenu(e, node)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
              fontSize: '0.65rem', color: 'var(--text)', padding: '4px 6px',
              fontFamily: "'Outfit', sans-serif", fontWeight: '500', transition: 'color 0.15s, background 0.2s',
              borderRadius: '4px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'transparent'; }}
          >
            {isExp ? <ChevronDown size={11} style={{color: 'rgba(255,255,255,0.4)'}} /> : <ChevronRight size={11} style={{color: 'rgba(255,255,255,0.4)'}} />}
            {isExp ? <FolderOpen size={12} style={{ color: 'var(--accent)' }} /> : <FolderClosed size={12} style={{ color: 'var(--accent)' }} />}
            <span>{node.name}</span>
          </div>
          {isExp && node.children && node.children.map(child => renderNode(child))}
        </div>
      );
    } else {
      return (
        <div
          key={node.path}
          onClick={() => onFileSelect && onFileSelect(node.path)}
          onContextMenu={(e) => handleContextMenu(e, node)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '22px',
            fontSize: '0.62rem', color: 'var(--text-dim)', padding: '4px 6px',
            cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
            transition: 'color 0.2s ease, background 0.2s',
            borderRadius: '4px',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <FileText size={10} style={{ color: 'rgba(255, 255, 255, 0.3)' }} />
          <span>{node.name}</span>
        </div>
      );
    }
  };

  return (
    <div style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
      {/* Git Branch Selector */}
      <GitBranchSelector />

      {/* File Search / Filter */}
      <div style={{ marginBottom: '6px', position: 'relative' }}>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search files..."
          style={{
            width: '100%',
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: 'var(--text)',
            fontFamily: "'Outfit', sans-serif",
            fontSize: '0.62rem',
            padding: '5px 8px',
            borderRadius: '4px',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'; }}
        />
        {filter && (
          <button
            onClick={() => setFilter('')}
            style={{
              position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
              background: 'transparent', border: 'none', color: 'var(--text-dim)',
              cursor: 'pointer', fontSize: '0.55rem', padding: '2px',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* New File Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px' }}>
        <button onClick={handleNewFile} style={{
          background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', color: 'var(--text)',
          fontSize: '0.55rem', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '3px', transition: 'all 0.2s',
          fontFamily: "'Outfit', sans-serif", fontWeight: '600',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          <Plus size={8} /> NEW FILE
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div style={{ padding: '8px 4px' }}>
          {[1,2,3,4,5,6].map(i => {
            const widths = [55, 70, 45, 60, 50, 65];
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '4px 0', marginLeft: i % 2 === 0 ? '16px' : '0',
              }}>
                <div className="skeleton-box" style={{ width: i % 2 === 0 ? '10px' : '12px', height: '10px', borderRadius: '2px' }} />
                <div className="skeleton-box" style={{
                  width: `${widths[i]}%`,
                  height: '8px',
                  borderRadius: '2px',
                }} />
              </div>
            );
          })}
        </div>
      )}

      {/* Tree */}
      {!loading && filteredTree.map(node => renderNode(node))}
      {!loading && filter && filteredTree.length === 0 && (
        <div style={{ fontSize: '0.5rem', color: 'var(--text-dim)', padding: '8px 4px', textAlign: 'center' }}>
          No files matching "{filter}"
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div style={{
          position: 'fixed',
          top: contextMenu.y,
          left: contextMenu.x,
          zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.98)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '6px',
          padding: '4px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          minWidth: '140px',
        }}>
          {!contextMenu.node.isDirectory && (
            <>
              <div onClick={() => { onFileSelect(contextMenu.node.path); setContextMenu(null); }}
                style={contextItemStyle}>
                <FileText size={10} /> OPEN
              </div>
              <div onClick={() => { handleRenameFile(contextMenu.node.path); setContextMenu(null); }}
                style={contextItemStyle}>
                <Edit3 size={10} /> RENAME
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '2px 0' }} />
              <div onClick={() => { handleDeleteFile(contextMenu.node.path); setContextMenu(null); }}
                style={{ ...contextItemStyle, color: 'var(--danger)' }}>
                <Trash2 size={10} /> DELETE
              </div>
            </>
          )}
          {contextMenu.node.isDirectory && (
            <div style={{ ...contextItemStyle, color: 'var(--text-dim)', cursor: 'default' }}>
              {contextMenu.node.name}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const contextItemStyle = {
  display: 'flex', alignItems: 'center', gap: '8px',
  padding: '6px 10px', fontSize: '0.62rem', color: 'var(--text-dim)',
  cursor: 'pointer', borderRadius: '4px', fontFamily: "'Outfit', sans-serif",
  fontWeight: '500',
};
