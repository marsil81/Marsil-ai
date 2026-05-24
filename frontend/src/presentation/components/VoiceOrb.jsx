import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff } from 'lucide-react';

export function VoiceOrb({ onTranscript, agentStatus }) {
  const { i18n } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [audioScale, setAudioScale] = useState(1);
  const [audioGlow, setAudioGlow] = useState(0);
  const animRef = useRef(null);
  const recognitionRef = useRef(null);
  const streamRef = useRef(null);
  const ctxRef = useRef(null);

  const stopListening = useCallback(() => {
    setIsListening(false);
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch(e){} }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); }
    if (ctxRef.current) { ctxRef.current.close(); }
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setAudioScale(1);
    setAudioGlow(0);
  }, []);

  const startListening = useCallback(async () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) { alert('Speech Recognition not supported'); return; }

      const recognition = new SpeechRecognition();
      recognition.lang = i18n.language === 'ar' ? 'ar-SA' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onresult = (e) => {
        const text = e.results[e.results.length - 1][0].transcript;
        if (text.trim()) onTranscript(text);
      };
      recognition.onend = () => stopListening();
      recognition.onerror = () => stopListening();
      recognitionRef.current = recognition;
      recognition.start();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioCtx = new AudioContext();
      ctxRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      audioCtx.createMediaStreamSource(stream).connect(analyser);
      analyser.fftSize = 256;
      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length / 255;
        setAudioScale(1 + avg * 0.8);
        setAudioGlow(avg);
        animRef.current = requestAnimationFrame(tick);
      };
      tick();
      setIsListening(true);
    } catch (err) {
      console.error('Mic error:', err);
      stopListening();
    }
  }, [i18n.language, onTranscript, stopListening]);

  useEffect(() => { return () => stopListening(); }, [stopListening]);

  return (
    <div className="voice-orb-container">
      <div
        className={`voice-orb ${isListening ? 'active' : ''}`}
        style={{ '--audio-scale': audioScale, '--audio-glow': audioGlow }}
      >
        <div className="orb-ring orb-ring-1"></div>
        <div className="orb-ring orb-ring-2"></div>
        <div className="orb-ring orb-ring-3"></div>
        <div className="orb-ring-4"></div>
        <div className="orb-core"></div>
      </div>
      <button
        className={`voice-btn ${isListening ? 'recording' : ''}`}
        onClick={isListening ? stopListening : startListening}
      >
        {isListening ? <MicOff size={22} /> : <Mic size={22} />}
      </button>
    </div>
  );
}
