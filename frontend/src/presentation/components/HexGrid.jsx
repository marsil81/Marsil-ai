import { useRef, useEffect } from 'react';

/**
 * Cybernetic animated hexagonal grid background.
 * Renders a subtle rotating hexagonal grid pattern that pulses with system status.
 * Uses offscreen canvas for performance — only redraws on resize.
 */
export function HexGrid({ status, style }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    let dpr = 1;
    let w = 0, h = 0;
    let time = 0;
    const hexSize = 55;
    const hexHeight = hexSize * Math.sqrt(3);

    function resize() {
      dpr = window.devicePixelRatio || 1;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawHex(cx, cy, size, rotation, alpha) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i + rotation;
        const x = cx + size * Math.cos(angle);
        const y = cy + size * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(0, 210, 255, ${alpha})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    function draw() {
      time += 0.005;
      const isActive = status === 'thinking' || status === 'executing_tool';
      ctx.clearRect(0, 0, w, h);

      const pulse = Math.sin(time * 0.5) * 0.5 + 0.5;
      const baseAlpha = isActive ? 0.04 + pulse * 0.04 : 0.025;
      const rotation = time * 0.03;

      // Calculate grid coverage
      const cols = Math.ceil(w / (hexSize * 1.5)) + 2;
      const rows = Math.ceil(h / hexHeight) + 2;

      // Offset the grid to create slow drift
      const driftX = Math.sin(time * 0.01) * 15;
      const driftY = Math.cos(time * 0.008) * 12;

      // ── Main hex grid ──
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const offsetX = (row % 2 === 0) ? 0 : hexSize * 0.75;
          const cx = col * hexSize * 1.5 + offsetX + driftX;
          const cy = row * hexHeight * 0.5 + driftY;

          // Distance-based alpha falloff from center
          const dx = cx - w / 2;
          const dy = cy - h / 2;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = Math.max(w, h) * 0.7;
          const distFactor = Math.max(0, 1 - dist / maxDist);

          const alpha = baseAlpha * distFactor;
          if (alpha < 0.003) continue;

          drawHex(cx, cy, hexSize * (0.8 + distFactor * 0.2), rotation + dist * 0.001, alpha);
        }
      }

      // ── Secondary smaller grid layer (counter-rotating for depth illusion) ──
      const smallHexSize = hexSize * 0.35;
      const smallRotation = -rotation * 0.7;
      const smallAlpha = isActive ? 0.015 + pulse * 0.01 : 0.01;
      for (let row = 0; row < rows * 1.5; row++) {
        for (let col = 0; col < cols * 1.5; col++) {
          const offsetX = (row % 2 === 0) ? 0 : smallHexSize * 0.75;
          const cx = col * smallHexSize * 1.5 + offsetX - driftX * 0.5 + 20;
          const cy = row * (smallHexSize * Math.sqrt(3)) * 0.5 - driftY * 0.5 + 10;
          const dx = cx - w / 2;
          const dy = cy - h / 2;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = Math.max(w, h) * 0.8;
          const distFactor = Math.max(0, 1 - dist / maxDist);
          const alpha = smallAlpha * distFactor;
          if (alpha < 0.002) continue;
          drawHex(cx, cy, smallHexSize * (0.7 + distFactor * 0.3), smallRotation + dist * 0.0005, alpha);
        }
      }

      // ── Center glow pulse ──
      if (isActive) {
        const centerGlow = Math.sin(time * 2) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(0, 162, 255, ${0.01 * centerGlow})`;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 60 + Math.sin(time) * 10, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, [status]);

  return <canvas ref={canvasRef} style={{
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    zIndex: 0, pointerEvents: 'none', opacity: 0.6,
    ...(style || {}),
  }} />;
}
