import { useRef, useEffect } from 'react';

/**
 * Premium cybernetic audio visualizer with multi-layered frequency bars,
 * neon glow effects, and responsive animations.
 * Replaces the inline VoicePulseVisualizer with a standalone premium component.
 *
 * Modes:
 * - listening: Real-time mic spectrogram (12-bar radial)
 * - speaking: AI voice output (multi-frequency sine waves)
 * - thinking: Radar sweep with grid wave
 * - idle: Heartbeat baseline ripple
 */
export function AudioVisualizer({ isListening, isSpeaking, agentStatus, size = 90 }) {
  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const levelsRef = useRef(new Float32Array(12));
  const phaseRef = useRef(0);

  // Pre-compute trig values for 12-bar spectrogram
  const trigRef = useRef(null);
  if (trigRef.current === null) {
    const angles = [];
    for (let i = 0; i < 12; i++) {
      angles.push({
        cos: Math.cos((i / 12) * Math.PI * 2),
        sin: Math.sin((i / 12) * Math.PI * 2),
      });
    }
    trigRef.current = angles;
  }

  // Initialize real microphone input
  useEffect(() => {
    if (isListening) {
      let active = true;
      const initAudio = async () => {
        try {
          if (audioCtxRef.current && audioCtxRef.current.state === 'closed') {
            audioCtxRef.current = null;
          }
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          const ctx = audioCtxRef.current || new AC();
          audioCtxRef.current = ctx;
          if (ctx.state === 'suspended') await ctx.resume();

          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
          streamRef.current = stream;

          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyserRef.current = analyser;
        } catch {
          // Mic access denied — simulation fallback
        }
      };
      initAudio();
      return () => {
        active = false;
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }
        analyserRef.current = null;
      };
    }
  }, [isListening]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let id;
    const trig = trigRef.current;
    const levels = levelsRef.current;
    const freqArray = new Uint8Array(32);
    const cx = size / 2;
    const cy = size / 2;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);
      const phase = phaseRef.current;
      phaseRef.current += 0.12;

      // Outer cybernetic circle boundary
      ctx.strokeStyle = 'rgba(0, 184, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.47, 0, Math.PI * 2);
      ctx.stroke();

      // Inner decorative ring
      ctx.strokeStyle = 'rgba(0, 255, 213, 0.04)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.25, 0, Math.PI * 2);
      ctx.stroke();

      if (isListening) {
        // ── USER SPEAKING (12-bar circular spectrogram with enhanced glow) ──
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(freqArray);
          for (let i = 0; i < 12; i++) {
            levels[i] = freqArray[i % 32] / 255.0;
          }
        } else {
          for (let i = 0; i < 12; i++) {
            levels[i] = 0.15 + Math.sin(phase + i) * Math.cos(phase * 0.7 + i) * 0.4;
          }
        }

        // Draw outer glow ring
        let avgLevel = 0;
        for (let i = 0; i < 12; i++) avgLevel += levels[i];
        avgLevel /= 12;

        ctx.shadowColor = 'rgba(0, 255, 213, 0.15)';
        ctx.shadowBlur = 8;
        ctx.strokeStyle = `rgba(0, 255, 213, ${0.05 + avgLevel * 0.15})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.47, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw bars with gradient glow
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2 + phase * 0.03;
          const level = Math.max(0.08, levels[i]);
          const innerR = size * 0.2;
          const endR = innerR + level * (size * 0.28);

          // Glow shadow
          ctx.shadowColor = 'rgba(0, 255, 213, 0.3)';
          ctx.shadowBlur = 6;

          ctx.strokeStyle = `rgba(0, 255, 213, ${0.3 + level * 0.5})`;
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(cx + trig[i].cos * innerR, cy + trig[i].sin * innerR);
          ctx.lineTo(cx + Math.cos(angle) * endR, cy + Math.sin(angle) * endR);
          ctx.stroke();

          // Outer glow dot
          ctx.shadowBlur = 10;
          ctx.fillStyle = `rgba(0, 255, 213, ${0.2 + level * 0.4})`;
          ctx.beginPath();
          ctx.arc(cx + Math.cos(angle) * endR, cy + Math.sin(angle) * endR, 1.5 + level * 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;

        // Central glowing core
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.2);
        grad.addColorStop(0, `rgba(0, 255, 213, ${0.4 + avgLevel * 0.5})`);
        grad.addColorStop(0.5, `rgba(0, 200, 200, ${0.15 + avgLevel * 0.2})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.2, 0, Math.PI * 2);
        ctx.fill();

      } else if (isSpeaking) {
        // ── AI SPEAKING (multi-frequency Siri-style waves with enhanced spectrum) ──
        const waves = [
          { freq: 0.2, amp: size * 0.16, color: 'rgba(0, 184, 255, 0.7)', speed: 1.5 },
          { freq: 0.35, amp: size * 0.09, color: 'rgba(0, 255, 213, 0.6)', speed: 2.5 },
          { freq: 0.15, amp: size * 0.2, color: 'rgba(138, 43, 226, 0.4)', speed: 1.0 },
          { freq: 0.5, amp: size * 0.05, color: 'rgba(255, 51, 85, 0.25)', speed: 3.0 },
          { freq: 0.08, amp: size * 0.12, color: 'rgba(0, 162, 255, 0.3)', speed: 0.8 },
        ];

        for (const w of waves) {
          ctx.strokeStyle = w.color;
          ctx.lineWidth = 1.5;
          ctx.lineCap = 'round';
          ctx.shadowColor = w.color.replace('0.', '0.2');
          ctx.shadowBlur = 4;
          ctx.beginPath();
          const margin = size * 0.1;
          for (let x = margin; x <= size - margin; x++) {
            const t = (x - margin) / (size - 2 * margin);
            const scale = Math.sin(t * Math.PI);
            const y = cy + Math.sin(x * w.freq + phase * w.speed) * w.amp * scale;
            if (x === margin) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.shadowBlur = 0;

        // Bottom glow reflection
        const waveGrad = ctx.createLinearGradient(0, cy + 5, 0, size);
        waveGrad.addColorStop(0, 'rgba(0, 184, 255, 0.06)');
        waveGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = waveGrad;
        ctx.fillRect(0, cy + 5, size, size / 2);

      } else if (agentStatus === 'thinking' || agentStatus === 'executing_tool') {
        // ── AI THINKING (radar sweep with grid wave) ──
        // Crosshairs
        ctx.strokeStyle = 'rgba(0, 184, 255, 0.12)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(cx - size * 0.4, cy); ctx.lineTo(cx + size * 0.4, cy);
        ctx.moveTo(cx, cy - size * 0.4); ctx.lineTo(cx, cy + size * 0.4);
        ctx.stroke();

        // Grid wave lines
        ctx.strokeStyle = 'rgba(0, 255, 213, 0.35)';
        ctx.lineWidth = 1;
        for (let i = -3; i <= 3; i++) {
          const offset = Math.sin(phase + i) * 5;
          ctx.beginPath();
          ctx.moveTo(cx - size * 0.32, cy + i * size * 0.09 + offset);
          ctx.lineTo(cx + size * 0.32, cy + i * size * 0.09 + offset);
          ctx.stroke();
        }

        // Radar sweep arc
        ctx.strokeStyle = 'rgba(0, 184, 255, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = 'rgba(0, 184, 255, 0.3)';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.38, phase, phase + 0.4);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.38, phase + Math.PI, phase + Math.PI + 0.4);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Center glow
        const thinkGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.15);
        thinkGrad.addColorStop(0, 'rgba(0, 255, 213, 0.3)');
        thinkGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = thinkGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.15, 0, Math.PI * 2);
        ctx.fill();

      } else {
        // ── IDLE STANDBY (heartbeat baseline ripple) ──
        ctx.strokeStyle = 'rgba(0, 184, 255, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = 'rgba(0, 184, 255, 0.15)';
        ctx.shadowBlur = 3;
        ctx.beginPath();
        const margin = size * 0.1;
        for (let x = margin; x <= size - margin; x++) {
          let ripple = 0;
          const dist = Math.abs(x - cx);
          if (dist < size * 0.2) {
            const scale = Math.cos((dist / (size * 0.2)) * (Math.PI / 2));
            ripple = Math.sin(phase * 0.4 + x * 0.3) * 2.5 * scale;
          }
          const y = cy + ripple;
          if (x === margin) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Dim standby dots
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2 + phase * 0.05;
          const r = size * 0.4;
          ctx.fillStyle = `rgba(0, 184, 255, ${0.06 + Math.sin(phase + i) * 0.04})`;
          ctx.beginPath();
          ctx.arc(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      id = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(id);
  }, [isListening, isSpeaking, agentStatus, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ width: size, height: size, display: 'block' }}
    />
  );
}
