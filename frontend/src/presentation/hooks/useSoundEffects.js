import { useEffect, useRef } from 'react';

export function useSoundEffects(status) {
  const audioCtxRef = useRef(null);

  // Initialize Audio Context on demand
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Play a quick cybernetic digital chirp (for typing/status changes)
  const playChirp = (frequency = 1200, duration = 0.08, type = 'sine') => {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(frequency * 1.8, ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.log('Audio error:', e);
    }
  };

  // Play a deeper "UI alert" sound
  const playAlert = () => {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.log('Audio error:', e);
    }
  };

  // Trigger sound based on agent status changes
  useEffect(() => {
    if (status === 'thinking') {
      // Play thinking startup chirps
      playChirp(800, 0.15, 'triangle');
      setTimeout(() => playChirp(1200, 0.1, 'sine'), 100);
    } else if (status === 'executing_tool') {
      // Tool execution beep
      playChirp(1500, 0.2, 'sawtooth');
    } else if (status === 'idle') {
      // Return to idle alert
      playAlert();
    }
  }, [status]);

  return { playChirp, playAlert };
}
