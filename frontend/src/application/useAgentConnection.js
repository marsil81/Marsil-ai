import { useState, useEffect, useRef } from 'react';
import { AgentWebSocketClient } from '../infrastructure/WebSocketClient';

export function useAgentConnection() {
  const [agentStatus, setAgentStatus]   = useState('idle');
  const [metrics, setMetrics]           = useState({ cpu: 0, ram: 0 });
  const [termOutput, setTermOutput]     = useState([]);
  const [chatHistory, setChatHistory]   = useState([]);
  const [tokenData, setTokenData]       = useState({
    tokensIn:    0,
    tokensOut:   0,
    totalTokens: 0,
    provider:    '',
    model:       ''
  });
  const [client, setClient] = useState(null);
  const bottomRef = useRef(null);

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
        const last = copy[copy.length - 1];
        if (last && last.role === 'agent' && last.isStreaming) {
          last.content = text;
          delete last.isStreaming;
          return copy;
        }
        return [...prev, { role: 'agent', content: text }];
      });
    };

    wsClient.onChatDelta = (delta) => {
      setChatHistory(prev => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last && last.role === 'agent' && last.isStreaming) {
          last.content += delta;
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
    setChatHistory(prev => [
      ...prev,
      { role: 'user', content: text },
      { role: 'agent', content: '', isStreaming: true }
    ]);
    client.sendChat(text);
  };

  const abortAgent  = () => { if (client) client.sendAbort(); };
  const clearTokens = () => setTokenData({ tokensIn: 0, tokensOut: 0, totalTokens: 0, provider: '', model: '' });

  return {
    agentStatus, metrics, termOutput, chatHistory,
    sendCommand, abortAgent,
    tokenData, clearTokens,
    // legacy alias so existing code using totalTokens doesn't break
    totalTokens: tokenData.totalTokens,
  };
}
