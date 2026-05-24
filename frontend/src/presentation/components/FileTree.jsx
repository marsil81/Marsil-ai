import React from 'react';
import { useTranslation } from 'react-i18next';
import { Folder, FileText } from 'lucide-react';

export function FileTree() {
  const { t } = useTranslation();
  return (
    <div className="file-tree">
      <ul>
        <li><span className="icon"><Folder size={14} color="var(--blue-400)" /></span> backend/</li>
        <li><span className="icon"><Folder size={14} color="var(--blue-400)" /></span> frontend/</li>
        <li><span className="icon"><FileText size={14} color="var(--text-muted)" /></span> package.json</li>
        <li><span className="icon"><FileText size={14} color="var(--text-muted)" /></span> start.bat</li>
      </ul>
      <div style={{ marginTop: '20px', color: 'var(--text-muted)', fontSize: '0.7rem', textAlign: 'center', letterSpacing: '1px' }}>
        {t('live_sync_later')}
      </div>
    </div>
  );
}
