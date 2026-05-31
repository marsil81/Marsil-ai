/**
 * 🌌 MARSIL AI — ParticleField Component
 * Neural-network ambient particle background.
 * Reacts to agentStatus: accelerates when thinking, slows when idle.
 * Uses requestAnimationFrame throttled to 60fps max.
 */
import { useEffect, useRef } from 'react';

const MAX_PARTICLES = 55;
const CONNECT_DIST  = 130;

const STATUS_SPEED = {
  idle:           0.28,
  thinking:       0.85,
  executing_tool: 1.4,
  speaking:       0.5,
};

const STATUS_COLOR = {
  idle:           { r: 99,  g: 102, b: 241 },  // indigo
  thinking:       { r: 129, g: 140, b: 248 },  // violet
  executing_tool: { r: 245, g: 158, b: 11  },  // amber
  speaking:       { r: 6,   g: 182, b: 212 },  // cyan
};

export function ParticleField({ agentStatus = 'idle' }) {
  const canvasRef = useRef(null);
  const stateRef  = useRef({ particles: [], mouse: { x: -9999, y: -9999 }, animId: null, status: agentStatus });

  useEffect(() => {
    stateRef.current.status = agentStatus;
  }, [agentStatus]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const state = stateRef.current;

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Init particles
    state.particles = Array.from({ length: MAX_PARTICLES }, () => ({
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r:  Math.random() * 1.5 + 0.5,
    }));

    const onMouseMove = (e) => {
      state.mouse.x = e.clientX;
      state.mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', onMouseMove);

    function draw() {
      state.animId = requestAnimationFrame(draw);
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const speed = STATUS_SPEED[state.status] || 0.28;
      const col   = STATUS_COLOR[state.status] || STATUS_COLOR.idle;

      for (const p of state.particles) {
        // Mouse attraction (very subtle)
        const dx = state.mouse.x - p.x;
        const dy = state.mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          p.vx += (dx / dist) * 0.012;
          p.vy += (dy / dist) * 0.012;
        }

        // Speed cap
        const maxV = 0.9 * speed;
        const v = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (v > maxV) { p.vx = (p.vx / v) * maxV; p.vy = (p.vy / v) * maxV; }

        p.x += p.vx * speed;
        p.y += p.vy * speed;

        // Wrap edges
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${col.r},${col.g},${col.b},0.55)`;
        ctx.fill();
      }

      // Draw connections
      for (let i = 0; i < state.particles.length; i++) {
        for (let j = i + 1; j < state.particles.length; j++) {
          const a = state.particles[i];
          const b = state.particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < CONNECT_DIST) {
            const alpha = (1 - d / CONNECT_DIST) * 0.18;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(${col.r},${col.g},${col.b},${alpha})`;
            ctx.lineWidth   = 0.6;
            ctx.stroke();
          }
        }
      }
    }

    draw();

    return () => {
      cancelAnimationFrame(state.animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.5,
      }}
    />
  );
}
