import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SendHorizontal } from 'lucide-react';

export function ChatHUD({ history, onSend }) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim()) { onSend(input); setInput(''); }
  };

  return (
    <div className="chat-area">
      <div className="chat-messages">
        {history.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '40px 0', letterSpacing: '1px' }}>
            {t('placeholder_command')}
          </div>
        )}
        {history.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.role === 'user' ? 'user' : 'agent'}`}>
            <div className="chat-header">{msg.role === 'user' ? t('you') : t('ironman')}</div>
            <div>{msg.content}</div>
          </div>
        ))}
      </div>
      <div className="chat-input-row">
        <input
          style={{ flex: 1 }}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder={t('placeholder_command')}
        />
        <button onClick={handleSend} className="btn-icon" title={t('send_command')}>
          <SendHorizontal size={16} />
        </button>
      </div>
    </div>
  );
}
