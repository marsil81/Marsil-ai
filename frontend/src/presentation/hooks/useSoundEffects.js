import { useEffect, useRef } from 'react';

export function useSoundEffects(status) {
  const audioCtxRef = useRef(null);
  const humRef = useRef(null);
  const humGainRef = useRef(null);

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

  // Play a quick cybernetic digital chirp (for typing/clicks/status changes)
  const playChirp = (frequency = 1200, duration = 0.08, type = 'sine') => {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(frequency * 1.8, ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio not available — skip silently
    }
  };

  // Play a highly polished scientific click / tick sound
  const playTick = () => {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(2000, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.03);

      gain.gain.setValueAtTime(0.015, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } catch {
      // Audio not available — skip silently
    }
  };

  // Play a deeper "UI alert / return to idle" sound
  const playAlert = () => {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.setValueAtTime(780, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // Audio not available — skip silently
    }
  };

  // Start continuous, deep sci-fi thinking hum (representing system calculating)
  const startThinkingHum = () => {
    try {
      const ctx = getAudioContext();
      if (humRef.current) return; // Already running

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(75, ctx.currentTime);

      // Low frequency modulation (LFO) for realistic cyber pulse
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(2.5, ctx.currentTime); // 2.5 Hz pulse
      lfoGain.gain.setValueAtTime(8, ctx.currentTime);    // Modulate +/- 8 Hz

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      // Low pass filter to make it deeply warm and sci-fi
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(110, ctx.currentTime);

      gain.gain.setValueAtTime(0.0, ctx.currentTime);
      // Fade in smoothly
      gain.gain.linearRampToValueAtTime(0.018, ctx.currentTime + 0.4);

      lfo.start();
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();

      humRef.current = { osc, lfo };
      humGainRef.current = gain;
    } catch {
      // Audio not available — skip silently
    }
  };

  // Stop continuous thinking hum smoothly
  const stopThinkingHum = () => {
    try {
      if (humGainRef.current && audioCtxRef.current) {
        const ctx = audioCtxRef.current;
        // Fade out smoothly
        humGainRef.current.gain.cancelScheduledValues(ctx.currentTime);
        humGainRef.current.gain.setValueAtTime(humGainRef.current.gain.value, ctx.currentTime);
        humGainRef.current.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.25);

        const currentHum = humRef.current;
        setTimeout(() => {
          try {
            if (currentHum) {
              currentHum.osc.stop();
              currentHum.lfo.stop();
            }
          } catch { /* oscillator already stopped */ }
        }, 250);
      }
      humRef.current = null;
      humGainRef.current = null;
    } catch {
      // Audio context already closed — skip silently
    }
  };

  // Trigger sound based on agent status changes
  useEffect(() => {
    if (status === 'thinking') {
      playChirp(700, 0.12, 'triangle');
      setTimeout(() => playChirp(1000, 0.08, 'sine'), 80);
      startThinkingHum();
    } else if (status === 'executing_tool') {
      playChirp(1300, 0.15, 'sawtooth');
      startThinkingHum();
    } else if (status === 'idle') {
      stopThinkingHum();
      playAlert();
    }
    return () => {
      if (status !== 'thinking' && status !== 'executing_tool') {
        stopThinkingHum();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return { playChirp, playTick, playAlert };
}
