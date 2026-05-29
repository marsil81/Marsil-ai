import { useState, useEffect, useRef } from 'react';
import { AgentWebSocketClient } from '../infrastructure/WebSocketClient';

export function useAgentConnection() {
  const [agentStatus, setAgentStatus]   = useState('idle');
  const [metrics, setMetrics]           = useState({ cpu: 0, ram: 0 });
  const [termOutput, setTermOutput]     = useState([]);
  const [chatHistory, setChatHistory]   = useState(() => {
    try { 
      const saved = localStorage.getItem('marsil_chat'); 
      if (saved) {
        let parsed = JSON.parse(saved);
        parsed = parsed.filter(msg => {
          if (!msg.content) return true;
          if (msg.content.includes('/EVOLUTION_')) return false;
          if (msg.content.includes('System: Autonomous Evolutionary Cycle Triggered')) return false;
          if (msg.content.includes('System: Agent is already working on a task')) return false;
          return true;
        });
        return parsed;
      }
      return []; 
    } catch { return []; }
  });
  const [tokenData, setTokenData]       = useState(() => {
    try { const saved = localStorage.getItem('marsil_tokens'); return saved ? JSON.parse(saved) : { tokensIn: 0, tokensOut: 0, totalTokens: 0, provider: '', model: '' }; } catch { return { tokensIn: 0, tokensOut: 0, totalTokens: 0, provider: '', model: '' }; }
  });
  const [client, setClient] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => { localStorage.setItem('marsil_chat', JSON.stringify(chatHistory)); }, [chatHistory]);
  useEffect(() => { localStorage.setItem('marsil_tokens', JSON.stringify(tokenData)); }, [tokenData]);

  // Force-clear chat history on mount to clean the chat box completely for the user as requested
  useEffect(() => {
    setChatHistory([]);
    localStorage.removeItem('marsil_chat');
  }, []);

  useEffect(() => {
    const wsClient = new AgentWebSocketClient();
    setClient(wsClient);

    wsClient.onStatusChange   = setAgentStatus;
    wsClient.onMetricsChange  = setMetrics;
    wsClient.onTerminalOutput = (output) =>
      setTermOutput(prev => [...prev, output]);
    wsClient.onSystemLog      = (message) =>
      setTermOutput(prev => [...prev, `[SYS]: ${message}`]);

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
    if (!client) return;
    
    // Only add to UI Chat History if it's not a background system command
    if (!text.startsWith('/')) {
      setChatHistory(prev => [
        ...prev,
        { role: 'user', content: text },
        { role: 'agent', content: '', isStreaming: true }
      ]);
    }
    
    client.sendChat(text);
  };

  const abortAgent  = () => { if (client) client.sendAbort(); };
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
