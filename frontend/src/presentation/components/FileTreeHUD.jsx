import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronRight, ChevronDown, FolderClosed, FolderOpen,
  Plus, GitBranch, Trash2, Edit3, FileCode, FileJson,
  FileText, FileType, File, RefreshCw, Search, X, FilePlus,
} from 'lucide-react';

// ── File type icon map ────────────────────────────────────────────────────────
const FILE_TYPE_MAP = {
  js:   { color: '#f7df1e', icon: FileCode },
  jsx:  { color: '#61dafb', icon: FileCode },
  ts:   { color: '#3178c6', icon: FileCode },
  tsx:  { color: '#3178c6', icon: FileCode },
  json: { color: '#a0c4ff', icon: FileJson },
  css:  { color: '#be93fd', icon: FileType },
  scss: { color: '#cc6699', icon: FileType },
  html: { color: '#e34f26', icon: FileType },
  md:   { color: '#7dd3fc', icon: FileText },
  mdx:  { color: '#7dd3fc', icon: FileText },
  py:   { color: '#3776ab', icon: FileCode },
  rs:   { color: '#dea584', icon: FileCode },
  go:   { color: '#00add8', icon: FileCode },
  java: { color: '#b07219', icon: FileCode },
  cpp:  { color: '#00599c', icon: FileCode },
  c:    { color: '#a8b9cc', icon: FileCode },
  yml:  { color: '#cb171e', icon: FileText },
  yaml: { color: '#cb171e', icon: FileText },
  toml: { color: '#9c4121', icon: FileText },
  sh:   { color: '#4eaa25', icon: FileCode },
  bat:  { color: '#4eaa25', icon: FileCode },
  ps1:  { color: '#5391fe', icon: FileCode },
  env:  { color: '#eab308', icon: FileText },
  lock: { color: '#6b7280', icon: FileText },
  sql:  { color: '#e38c00', icon: FileCode },
};

// ── Git status colors ─────────────────────────────────────────────────────────
const GIT_STATUS_STYLE = {
  M: { color: '#f59e0b', label: 'M', title: 'Modified' },
  A: { color: '#22c55e', label: 'A', title: 'Added' },
  D: { color: '#ef4444', label: 'D', title: 'Deleted' },
  R: { color: '#a78bfa', label: 'R', title: 'Renamed' },
  '?': { color: '#6b7280', label: '?', title: 'Untracked' },
  U: { color: '#f97316', label: 'U', title: 'Conflict' },
};

function getFileInfo(name) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const info = FILE_TYPE_MAP[ext];
  return { icon: info?.icon || File, color: info?.color || 'rgba(255,255,255,0.3)' };
}

// ── Git Badge ─────────────────────────────────────────────────────────────────
function GitBadge({ status }) {
  if (!status) return null;
  const s = GIT_STATUS_STYLE[status] || { color: '#6b7280', label: status };
  return (
    <span title={s.title} style={{
      fontSize: '0.5rem', fontWeight: '700', color: s.color,
      background: `${s.color}18`, border: `1px solid ${s.color}40`,
      borderRadius: '3px', padding: '0 3px', lineHeight: '14px',
      fontFamily: 'monospace', flexShrink: 0, letterSpacing: '0.5px',
    }}>{s.label}</span>
  );
}

// ── Hover Quick Actions ───────────────────────────────────────────────────────
function HoverActions({ node, onNew, onRename, onDelete, onOpen }) {
  return (
    <div className="file-hover-actions" style={{
      display: 'flex', gap: '2px', alignItems: 'center',
      opacity: 0, transition: 'opacity 0.15s',
      position: 'absolute', right: '4px', top: '50%',
      transform: 'translateY(-50%)',
    }}>
      {!node.isDirectory && (
        <ActionBtn icon={<FileCode size={10} />} title="Open" onClick={(e) => { e.stopPropagation(); onOpen(node.path); }} />
      )}
      {node.isDirectory && (
        <ActionBtn icon={<FilePlus size={10} />} title="New file in folder" onClick={(e) => { e.stopPropagation(); onNew(node.path); }} />
      )}
      <ActionBtn icon={<Edit3 size={10} />} title="Rename" onClick={(e) => { e.stopPropagation(); onRename(node.path); }} />
      {!node.isDirectory && (
        <ActionBtn icon={<Trash2 size={10} />} title="Delete" danger onClick={(e) => { e.stopPropagation(); onDelete(node.path); }} />
      )}
    </div>
  );
}

function ActionBtn({ icon, title, onClick, danger }) {
  return (
    <button onClick={onClick} title={title} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      color: danger ? '#f87171' : 'rgba(255,255,255,0.5)',
      padding: '2px 3px', borderRadius: '3px', display: 'flex',
      alignItems: 'center', lineHeight: 1,
      transition: 'color 0.15s, background 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.color = danger ? '#f87171' : 'var(--primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.color = danger ? '#f87171' : 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'none'; }}
    >{icon}</button>
  );
}

// ── Git Branch Selector ───────────────────────────────────────────────────────
function GitBranchSelector({ changedCount }) {
  const [branches, setBranches] = useState([]);
  const [current, setCurrent] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchBranches = useCallback(() => {
    fetch('http://localhost:3001/api/git/branches')
      .then(r => r.json())
      .then(data => { if (data.branches) { setBranches(data.branches); setCurrent(data.current); } })
      .catch(() => {});
  }, []);

  useEffect(() => { fetchBranches(); const id = setInterval(fetchBranches, 15000); return () => clearInterval(id); }, [fetchBranches]);

  const handleSwitch = (name) => {
    if (name === current) return;
    setLoading(true);
    fetch('http://localhost:3001/api/git/branch', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, action: 'switch' })
    }).then(() => { setLoading(false); fetchBranches(); }).catch(() => setLoading(false));
  };

  const handleCreate = () => {
    const name = prompt('New branch name:');
    if (!name) return;
    setLoading(true);
    fetch('http://localhost:3001/api/git/branch', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, action: 'create' })
    }).then(() => { setLoading(false); fetchBranches(); }).catch(() => setLoading(false));
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '5px 8px', marginBottom: '6px',
      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '6px',
    }}>
      <GitBranch size={11} style={{ color: 'var(--accent)', flexShrink: 0 }} />
      <select
        value={current} onChange={e => handleSwitch(e.target.value)} disabled={loading}
        style={{
          flex: 1, background: 'transparent', border: 'none',
          color: 'var(--text)', fontFamily: "'Outfit', sans-serif",
          fontSize: '0.72rem', outline: 'none', cursor: 'pointer',
        }}
      >
        {branches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
      </select>
      {changedCount > 0 && (
        <span style={{
          fontSize: '0.5rem', color: '#f59e0b', fontWeight: '700',
          background: 'rgba(245,158,11,0.12)', borderRadius: '3px',
          padding: '1px 4px', fontFamily: 'monospace',
        }}>±{changedCount}</span>
      )}
      <button onClick={handleCreate} title="New branch"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '2px', display: 'flex' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
      ><Plus size={11} /></button>
    </div>
  );
}

// ── Tree Node ─────────────────────────────────────────────────────────────────
function TreeNode({ node, depth, expanded, onToggle, onFileSelect, onNew, onRename, onDelete, gitStatus, activeFile }) {
  const { icon: FileIcon, color: iconColor } = getFileInfo(node.name);
  const isDir = node.isDirectory;
  const isExp = expanded[node.path];
  const isActive = !isDir && node.path === activeFile;
  const gs = gitStatus[node.path] || gitStatus[node.name];

  // Propagate git status to parent dirs
  const hasDirtyChild = isDir && node.children?.some(c => gitStatus[c.path]);

  return (
    <div>
      <div
        onClick={() => isDir ? onToggle(node.path) : onFileSelect(node.path)}
        style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          paddingLeft: `${8 + depth * 14}px`, paddingRight: '6px',
          paddingTop: '4px', paddingBottom: '4px',
          cursor: 'pointer', position: 'relative',
          borderRadius: '5px', margin: '1px 2px',
          background: isActive ? 'rgba(0,255,213,0.06)' : 'transparent',
          borderLeft: isActive ? '2px solid var(--primary)' : '2px solid transparent',
          transition: 'background 0.12s',
        }}
        onMouseEnter={e => {
          if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.035)';
          const actions = e.currentTarget.querySelector('.file-hover-actions');
          if (actions) actions.style.opacity = '1';
        }}
        onMouseLeave={e => {
          if (!isActive) e.currentTarget.style.background = 'transparent';
          const actions = e.currentTarget.querySelector('.file-hover-actions');
          if (actions) actions.style.opacity = '0';
        }}
      >
        {/* Expand chevron */}
        {isDir ? (
          <span style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0, display: 'flex' }}>
            {isExp ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </span>
        ) : (
          <span style={{ width: 12, flexShrink: 0 }} />
        )}

        {/* Icon */}
        {isDir
          ? (isExp ? <FolderOpen size={13} color="#64b5f6" style={{ flexShrink: 0 }} /> : <FolderClosed size={13} color="#90caf9" style={{ flexShrink: 0 }} />)
          : <FileIcon size={13} color={iconColor} style={{ flexShrink: 0 }} />
        }

        {/* Name */}
        <span style={{
          fontSize: '0.78rem', flex: 1, minWidth: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          color: isActive ? 'var(--primary)' : gs ? GIT_STATUS_STYLE[gs]?.color || 'var(--text)' : isDir ? 'var(--text)' : 'var(--text-dim)',
          fontFamily: "'Outfit', sans-serif",
          fontWeight: isDir ? '600' : '400',
        }}>
          {node.name}
        </span>

        {/* Git badge */}
        <GitBadge status={gs} />
        {hasDirtyChild && !gs && (
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f59e0b', flexShrink: 0, marginLeft: 2 }} />
        )}

        {/* Hover actions */}
        <HoverActions node={node} onNew={onNew} onRename={onRename} onDelete={onDelete} onOpen={onFileSelect} />
      </div>

      {/* Children */}
      {isDir && isExp && node.children?.map(child => (
        <TreeNode
          key={child.path}
          node={child}
          depth={depth + 1}
          expanded={expanded}
          onToggle={onToggle}
          onFileSelect={onFileSelect}
          onNew={onNew}
          onRename={onRename}
          onDelete={onDelete}
          gitStatus={gitStatus}
          activeFile={activeFile}
        />
      ))}
    </div>
  );
}

// ── Filter tree ───────────────────────────────────────────────────────────────
function filterTree(nodes, query) {
  if (!query) return nodes;
  const lower = query.toLowerCase();
  return nodes.reduce((acc, node) => {
    if (node.isDirectory) {
      const children = filterTree(node.children || [], query);
      if (children.length > 0) acc.push({ ...node, children });
    } else if (node.name.toLowerCase().includes(lower)) {
      acc.push(node);
    }
    return acc;
  }, []);
}

// ── Main FileTreeHUD ──────────────────────────────────────────────────────────
export function FileTreeHUD({ onFileSelect, activeFile }) {
  const [tree, setTree] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [gitStatus, setGitStatus] = useState({});
  const searchRef = useRef(null);

  // Auto-expand root folders
  const autoExpand = useCallback((nodes) => {
    const map = {};
    nodes.forEach(n => { if (n.isDirectory) map[n.path] = true; });
    setExpanded(prev => ({ ...map, ...prev }));
  }, []);

  const fetchTree = useCallback(() => {
    fetch('http://localhost:3001/api/files')
      .then(r => r.json())
      .then(data => { setTree(data); setLoading(false); autoExpand(data); })
      .catch(() => setLoading(false));
  }, [autoExpand]);

  const fetchGitStatus = useCallback(() => {
    fetch('http://localhost:3001/api/git/status')
      .then(r => r.json())
      .then(data => {
        if (data.files) {
          const map = {};
          data.files.forEach(f => {
            const name = f.path?.split(/[\\/]/).pop();
            if (name) map[name] = f.status;
            if (f.path) map[f.path] = f.status;
          });
          setGitStatus(map);
        }
      }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchTree();
    fetchGitStatus();
    const t1 = setInterval(fetchTree, 8000);
    const t2 = setInterval(fetchGitStatus, 10000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, [fetchTree, fetchGitStatus]);

  // Ctrl+Shift+F to focus search
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const toggle = useCallback((path) => {
    setExpanded(prev => ({ ...prev, [path]: !prev[path] }));
  }, []);

  const collapseAll = () => setExpanded({});
  const refresh = () => { fetchTree(); fetchGitStatus(); };

  const handleNewFile = (dirPath) => {
    const name = prompt('New file name:');
    if (!name) return;
    const full = dirPath ? `${dirPath}/${name}` : name;
    fetch('http://localhost:3001/api/file', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: full, content: '' })
    }).then(() => { fetchTree(); onFileSelect?.(full); });
  };

  const handleDelete = (filePath) => {
    if (!confirm(`Delete "${filePath.split(/[\\/]/).pop()}"? This cannot be undone.`)) return;
    fetch(`http://localhost:3001/api/file?path=${encodeURIComponent(filePath)}`, { method: 'DELETE' })
      .then(() => fetchTree());
  };

  const handleRename = (oldPath) => {
    const oldName = oldPath.split(/[\\/]/).pop();
    const newName = prompt('Rename to:', oldName);
    if (!newName || newName === oldName) return;
    const parts = oldPath.split(/[\\/]/);
    parts[parts.length - 1] = newName;
    const newPath = parts.join('/');
    fetch('http://localhost:3001/api/file/rename', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPath, newPath })
    }).then(() => fetchTree());
  };

  const filteredTree = filter ? filterTree(tree, filter) : tree;
  const changedCount = Object.keys(gitStatus).filter(k => !k.includes('/')).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Git Branch */}
      <GitBranchSelector changedCount={changedCount} />

      {/* Toolbar row */}
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginBottom: '6px' }}>
        {/* Search */}
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={11} style={{
            position: 'absolute', left: '7px', top: '50%',
            transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none'
          }} />
          <input
            ref={searchRef}
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Search… (Ctrl+Shift+F)"
            style={{
              width: '100%', background: 'rgba(15,23,42,0.6)',
              border: '1px solid rgba(255,255,255,0.07)', borderRadius: '5px',
              color: 'var(--text)', fontFamily: "'Outfit', sans-serif",
              fontSize: '0.72rem', padding: '5px 24px 5px 26px',
              outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(0,255,213,0.3)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
          />
          {filter && (
            <button onClick={() => setFilter('')} style={{
              position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.3)', display: 'flex', padding: '2px',
            }}><X size={10} /></button>
          )}
        </div>

        {/* Action buttons */}
        <IconBtn icon={<FilePlus size={12} />} title="New file" onClick={() => handleNewFile('')} />
        <IconBtn icon={<RefreshCw size={11} />} title="Refresh" onClick={refresh} />
        <IconBtn icon={<ChevronRight size={12} style={{ transform: 'rotate(90deg)' }} />} title="Collapse all" onClick={collapseAll} />
      </div>

      {/* File count hint */}
      {!loading && filter && (
        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', marginBottom: '4px', paddingLeft: '4px' }}>
          {filteredTree.length === 0 ? 'No results' : `${countFiles(filteredTree)} file(s)`}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ padding: '4px' }}>
          {[65, 45, 80, 55, 70, 40].map((w, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px' }}>
              <div className="skeleton-box" style={{ width: 12, height: 12, borderRadius: '3px', flexShrink: 0 }} />
              <div className="skeleton-box" style={{ width: `${w}%`, height: 8, borderRadius: '2px' }} />
            </div>
          ))}
        </div>
      )}

      {/* Tree */}
      {!loading && (
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '2px' }} className="file-tree-scroll">
          {filteredTree.length === 0 && filter ? (
            <div style={{ textAlign: 'center', padding: '20px 8px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)' }}>
              No files matching "{filter}"
            </div>
          ) : (
            filteredTree.map(node => (
              <TreeNode
                key={node.path}
                node={node}
                depth={0}
                expanded={expanded}
                onToggle={toggle}
                onFileSelect={onFileSelect}
                onNew={handleNewFile}
                onRename={handleRename}
                onDelete={handleDelete}
                gitStatus={gitStatus}
                activeFile={activeFile}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function IconBtn({ icon, title, onClick }) {
  return (
    <button onClick={onClick} title={title} style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '5px', cursor: 'pointer', color: 'rgba(255,255,255,0.35)',
      padding: '4px 5px', display: 'flex', alignItems: 'center', flexShrink: 0,
      transition: 'all 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.borderColor = 'rgba(0,255,213,0.25)'; e.currentTarget.style.background = 'rgba(0,255,213,0.04)'; }}
      onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
    >{icon}</button>
  );
}

function countFiles(nodes) {
  return nodes.reduce((acc, n) => acc + (n.isDirectory ? countFiles(n.children || []) : 1), 0);
}
