import { useState, useEffect, useRef } from 'react';
import { AgentWebSocketClient } from '../infrastructure/WebSocketClient';

export function useAgentConnection() {
  const [agentStatus, setAgentStatus]   = useState('idle');
  const [metrics, setMetrics]           = useState({ cpu: 0, ram: 0 });
  const TERM_OUTPUT_MAX = 1000;
  const [termOutput, setTermOutput]     = useState([]);
  const [chatHistory, setChatHistory]   = useState([]);
  const [tokenData, setTokenData]       = useState(() => {
    try { const saved = localStorage.getItem('marsil_tokens'); return saved ? JSON.parse(saved) : { tokensIn: 0, tokensOut: 0, totalTokens: 0, provider: '', model: '' }; } catch { return { tokensIn: 0, tokensOut: 0, totalTokens: 0, provider: '', model: '' }; }
  });
  const clientRef = useRef(null);

  useEffect(() => { localStorage.setItem('marsil_chat', JSON.stringify(chatHistory)); }, [chatHistory]);
  useEffect(() => { localStorage.setItem('marsil_tokens', JSON.stringify(tokenData)); }, [tokenData]);

  // Clear stale chat data on mount
  useEffect(() => {
    localStorage.removeItem('marsil_chat');
  }, []);

  useEffect(() => {
    const wsClient = new AgentWebSocketClient();
    clientRef.current = wsClient;

    wsClient.onStatusChange   = setAgentStatus;
    wsClient.onMetricsChange  = setMetrics;
    wsClient.onTerminalOutput = (output) =>
      setTermOutput(prev => { const next = [...prev, output]; return next.length > TERM_OUTPUT_MAX ? next.slice(-TERM_OUTPUT_MAX) : next; });
    wsClient.onSystemLog      = (message) =>
      setTermOutput(prev => { const next = [...prev, `[SYS]: ${message}`]; return next.length > TERM_OUTPUT_MAX ? next.slice(-TERM_OUTPUT_MAX) : next; });

    wsClient.onChatReply = (text) => {
      setChatHistory(prev => {
        const copy = [...prev];
        const lastIndex = copy.length - 1;
        const last = copy[lastIndex];
        if (last && last.role === 'agent' && last.isStreaming) {
          // Clone the object to avoid mutating previous state directly (fixes StrictMode duplication)
          const newLast = { ...last, content: text };
          delete newLast.isStreaming;
          copy[lastIndex] = newLast;
          return copy;
        }
        return [...prev, { role: 'agent', content: text }];
      });
    };

    wsClient.onChatDelta = (delta) => {
      setChatHistory(prev => {
        const copy = [...prev];
        const lastIndex = copy.length - 1;
        const last = copy[lastIndex];
        if (last && last.role === 'agent' && last.isStreaming) {
          copy[lastIndex] = { ...last, content: last.content + delta };
        }
        return copy;
      });
    };

    // Full token object from backend: { tokensIn, tokensOut, totalTokens, provider, model }
    wsClient.onTokenUpdate = (data) => {
      setTokenData(prev => ({
        tokensIn:    prev.tokensIn    + (data.tokensIn  || 0),
        tokensOut:   prev.tokensOut   + (data.tokensOut || 0),
        totalTokens: prev.totalTokens + (data.totalTokens || 0),
        provider:    data.provider || prev.provider,
        model:       data.model    || prev.model,
      }));
    };

    wsClient.connect();
    return () => wsClient.disconnect();
  }, []);

  const sendCommand = (text) => {
    if (!clientRef.current) return;
    
    // Only add to UI Chat History if it's not a background system command
    if (!text.startsWith('/')) {
      setChatHistory(prev => [
        ...prev,
        { role: 'user', content: text },
        { role: 'agent', content: '', isStreaming: true }
      ]);
    }
    
    clientRef.current.sendChat(text);
  };

  const abortAgent  = () => { if (clientRef.current) clientRef.current.sendAbort(); };
  const clearTokens = () => setTokenData({ tokensIn: 0, tokensOut: 0, totalTokens: 0, provider: '', model: '' });
  const clearChat   = () => { setChatHistory([]); setTermOutput([]); localStorage.removeItem('marsil_chat'); };

  return {
    agentStatus, metrics, termOutput, chatHistory,
    sendCommand, abortAgent,
    tokenData, clearTokens, clearChat,
    // legacy alias so existing code using totalTokens doesn't break
    totalTokens: tokenData.totalTokens,
  };
}
