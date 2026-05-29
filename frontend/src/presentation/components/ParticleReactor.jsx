import { useRef, useEffect, useState } from 'react';

export function ParticleReactor({ status, onVisualizerRef, style }) {
  const canvasRef = useRef(null);
  const vizRef = useRef(null);
  const [fileNames, setFileNames] = useState([]);

  // Fetch real workspace files to bind to the 3D particles
  useEffect(() => {
    fetch('http://localhost:3001/api/files')
      .then(r => r.json())
      .then(data => {
        const flatList = [];
        const flatten = (arr) => {
          arr.forEach(item => {
            if (!item.isDirectory) flatList.push(item.name);
            if (item.children) flatten(item.children);
          });
        };
        flatten(data);
        setFileNames(flatList.slice(0, 15));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const particles = [];
    const numParticles = 160;
    let baseRadius = 0;
    let radius = 0;
    let centerX = 0, centerY = 0;
    let angleX = 0, angleY = 0;
    let amplitude = 0, targetAmplitude = 0;
    let animId;
    let lastResizeTime = 0;
    let dpr = 1;

    // Floating stats readouts around the core — enhanced with more Jarvis-style orbits
    const statsReadouts = [
      { label: 'SYS', value: 'ONLINE', angle: 0, distance: 1.6 },
      { label: 'PWR', value: '98%', angle: Math.PI * 0.5, distance: 1.55 },
      { label: 'SIG', value: 'STABLE', angle: Math.PI, distance: 1.6 },
      { label: 'NET', value: 'ACTIVE', angle: Math.PI * 1.5, distance: 1.55 },
      { label: 'TMP', value: '54.8°', angle: Math.PI * 0.25, distance: 1.9 },
      { label: 'VLT', value: '11.9V', angle: Math.PI * 0.75, distance: 1.9 },
      { label: 'TKN', value: '0', angle: Math.PI * 1.25, distance: 1.9 },
      { label: 'MEM', value: '64%', angle: Math.PI * 1.75, distance: 1.9 },
    ];

    function resize() {
      dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      centerX = w / 2;
      centerY = h / 2;
      baseRadius = Math.min(w, h) * 0.32;
      radius = baseRadius;
      offscreenDirty = true;
    }

    // Throttled resize handler — at most once per 200ms
    const handleResize = () => {
      const now = Date.now();
      if (now - lastResizeTime < 200) return;
      lastResizeTime = now;
      resize();
    };

    function initParticles() {
      particles.length = 0;
      for (let i = 0; i < numParticles; i++) {
        const y = 1 - (i / (numParticles - 1)) * 2;
        const radiusAtY = Math.sqrt(1 - y * y);
        const theta = i * Math.PI * (3 - Math.sqrt(5));
        const x = Math.cos(theta) * radiusAtY;
        const z = Math.sin(theta) * radiusAtY;
        const fileName = fileNames.length > 0 ? fileNames[i % fileNames.length] : null;
        particles.push({
          x: x * radius, y: y * radius, z: z * radius,
          baseX: x, baseY: y, baseZ: z,
          size: Math.random() * 2.2 + 1, scale: 1,
          fileName,
        });
      }
    }

    initParticles();

    // Pre-allocate connection distance check array
    const connectionThreshold = 55;
    const connectionThresholdSq = connectionThreshold * connectionThreshold;

    // ── Offscreen canvas for static background elements ──
    const offscreen = document.createElement('canvas');
    const offCtx = offscreen.getContext('2d');
    let offscreenDirty = true;

    function drawStaticBackground() {
      if (!offCtx) return;
      const w = canvas.width, h = canvas.height;
      offscreen.width = w;
      offscreen.height = h;
      offCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      offCtx.clearRect(0, 0, w / dpr, h / dpr);

      // Enhanced concentric rings — more rings for a richer Jarvis-style reactor
      const ringRadii = [
        baseRadius * 1.45, baseRadius * 1.35, baseRadius * 1.15,
        baseRadius * 0.95, baseRadius * 0.85, baseRadius * 0.6, baseRadius * 0.4
      ];
      const ringStyles = [
        { w: 1.5, a: 0.12 },
        { w: 3, a: 0.28 },
        { w: 4, a: 0.38 },
        { w: 1.5, a: 0.15 },
        { w: 2.5, a: 0.22 },
        { w: 2, a: 0.2 },
        { w: 1.5, a: 0.15 },
      ];
      for (let i = 0; i < ringRadii.length; i++) {
        const r = ringRadii[i];
        const s = ringStyles[i];
        offCtx.beginPath();
        offCtx.strokeStyle = `rgba(0, 210, 255, ${s.a})`;
        offCtx.lineWidth = s.w;
        offCtx.arc(centerX, centerY, r, 0, Math.PI * 2);
        offCtx.stroke();
      }

      // Enhanced tick marks — two rings of ticks for richer HUD aesthetic
      for (let ring = 0; ring < 2; ring++) {
        const tickRadius = ring === 0 ? baseRadius * 1.35 : baseRadius * 0.95;
        const tickCount = ring === 0 ? 72 : 36;
        const majorEvery = ring === 0 ? 6 : 4;
        for (let i = 0; i < tickCount; i++) {
          const a = (Math.PI * 2 * i) / tickCount;
          const isMaj = i % majorEvery === 0;
          const r1 = tickRadius;
          const r2 = isMaj ? tickRadius + (ring === 0 ? 10 : 7) : tickRadius + (ring === 0 ? 5 : 3);
          offCtx.beginPath();
          offCtx.moveTo(centerX + Math.cos(a) * r1, centerY + Math.sin(a) * r1);
          offCtx.lineTo(centerX + Math.cos(a) * r2, centerY + Math.sin(a) * r2);
          offCtx.strokeStyle = isMaj ? 'rgba(0,230,255,0.45)' : 'rgba(0,230,255,0.18)';
          offCtx.lineWidth = isMaj ? 2 : 0.8;
          offCtx.stroke();
        }
      }

      offscreenDirty = false;
    }

    function update() {
      const isActive = status === 'thinking' || status === 'executing_tool';
      targetAmplitude = isActive ? 1.0 : 0.0;
      amplitude += (targetAmplitude - amplitude) * 0.05;
      angleY += 0.0018 + (amplitude * 0.005);
      angleX += 0.0008 + (amplitude * 0.002);
      const pulse = Math.sin(Date.now() * 0.002) * 5 + (Math.sin(Date.now() * 0.01) * 8 * amplitude);
      radius = baseRadius + pulse;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        let x = p.baseX * radius, y = p.baseY * radius, z = p.baseZ * radius;
        if (amplitude > 0.1) {
          x += (Math.random() - 0.5) * 2 * amplitude;
          y += (Math.random() - 0.5) * 2 * amplitude;
          z += (Math.random() - 0.5) * 2 * amplitude;
        }
        const x1 = x * Math.cos(angleY) - z * Math.sin(angleY);
        const z1 = z * Math.cos(angleY) + x * Math.sin(angleY);
        const y2 = y * Math.cos(angleX) - z1 * Math.sin(angleX);
        const z2 = z1 * Math.cos(angleX) + y * Math.sin(angleX);
        p.x = x1 + centerX; p.y = y2 + centerY; p.z = z2;
        p.scale = 400 / (400 + z2);
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      // ── Static background (rings + ticks) from offscreen canvas ──
      if (offscreenDirty) drawStaticBackground();
      ctx.drawImage(offscreen, 0, 0);

      // ── Rotating ring arcs (dynamic — can't cache) ──
      const spinAngle1 = (Date.now() * 0.0006);
      const spinAngle2 = -(Date.now() * 0.001);
      const spinAngle3 = (Date.now() * 0.0004);
      const spinAngle4 = -(Date.now() * 0.0008);
      const arcStyles = [
        { r: baseRadius * 1.15, w: 4, a: 0.38, start: spinAngle1, end: spinAngle1 + Math.PI * 1.6 },
        { r: baseRadius * 0.6, w: 2, a: 0.2, start: spinAngle2, end: spinAngle2 + Math.PI * 0.9 },
        { r: baseRadius * 1.45, w: 2, a: 0.15, start: spinAngle3, end: spinAngle3 + Math.PI * 0.7 },
        { r: baseRadius * 0.4, w: 1.5, a: 0.18, start: spinAngle4, end: spinAngle4 + Math.PI * 1.2 },
      ];
      for (const s of arcStyles) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(0, 210, 255, ${s.a})`;
        ctx.lineWidth = s.w;
        ctx.arc(centerX, centerY, s.r, s.start, s.end);
        ctx.stroke();
      }

      // ── Dashed spinning rings ──
      ctx.setLineDash([40, 80]);
      ctx.lineDashOffset = spinAngle1 * 120;
      ctx.strokeStyle = `rgba(0, 210, 255, 0.28)`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 1.35, 0, Math.PI * 2);
      ctx.stroke();

      ctx.setLineDash([10, 15]);
      ctx.lineDashOffset = spinAngle2 * 60;
      ctx.strokeStyle = `rgba(0, 210, 255, 0.22)`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 0.85, 0, Math.PI * 2);
      ctx.stroke();

      ctx.setLineDash([25, 50]);
      ctx.lineDashOffset = spinAngle3 * 80;
      ctx.strokeStyle = `rgba(0, 210, 255, 0.12)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 1.45, 0, Math.PI * 2);
      ctx.stroke();

      ctx.setLineDash([]);

      // ═══ JARVIS-STYLE REACTOR CORE — Enhanced with multi-layered glow ═══
      const isActive = status === 'thinking' || status === 'executing_tool';
      const now = Date.now();

      // Outer core glow — expands and contracts with amplitude
      const coreOuterRadius = radius * (0.4 + amplitude * 0.1);
      const coreGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreOuterRadius);
      coreGrad.addColorStop(0, `rgba(255,255,255,${0.6 + amplitude * 0.3})`);
      coreGrad.addColorStop(0.1, `rgba(140,235,255,${0.5 + amplitude * 0.25})`);
      coreGrad.addColorStop(0.25, `rgba(0,210,255,${0.3 + amplitude * 0.15})`);
      coreGrad.addColorStop(0.5, `rgba(0,150,255,${0.12 + amplitude * 0.06})`);
      coreGrad.addColorStop(0.75, `rgba(0,80,200,${0.04 + amplitude * 0.03})`);
      coreGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreOuterRadius, 0, Math.PI * 2);
      ctx.fill();

      // Inner bright core — pulsing white-hot center with dual layer
      const innerPulse = Math.sin(now * 0.003) * 0.15 + 0.85;
      const innerRadius = coreOuterRadius * 0.3 * innerPulse;
      const innerGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, innerRadius);
      innerGrad.addColorStop(0, `rgba(255,255,255,${0.9 + amplitude * 0.1})`);
      innerGrad.addColorStop(0.2, `rgba(200,245,255,${0.6 + amplitude * 0.3})`);
      innerGrad.addColorStop(0.5, `rgba(0,220,255,${0.3 + amplitude * 0.2})`);
      innerGrad.addColorStop(0.8, `rgba(0,150,255,${0.1 + amplitude * 0.1})`);
      innerGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = innerGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
      ctx.fill();

      // Secondary inner glow — purple accent ring (Jarvis-style)
      const accentRingRadius = innerRadius * 1.6;
      ctx.strokeStyle = `rgba(139, 92, 246, ${0.08 + amplitude * 0.06})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, accentRingRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Central white dot with enhanced glow
      ctx.shadowColor = 'rgba(0,200,255,0.9)';
      ctx.shadowBlur = 40 + amplitude * 30;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5 + amplitude * 4 + Math.sin(now * 0.005) * 2, 0, Math.PI * 2);
      ctx.fill();

      // Secondary blue-white dot
      ctx.shadowColor = 'rgba(100,200,255,0.6)';
      ctx.shadowBlur = 20 + amplitude * 15;
      ctx.fillStyle = `rgba(200,240,255,${0.6 + amplitude * 0.3})`;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 8 + amplitude * 3 + Math.sin(now * 0.004 + 1) * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // ═══ FLOATING STATS READOUTS (Jarvis-style) — Enhanced with bracket decorations ═══
      const floatPhase = now * 0.0008;
      for (const stat of statsReadouts) {
        const drift = Math.sin(floatPhase + stat.angle) * 6;
        const sx = centerX + Math.cos(stat.angle) * baseRadius * stat.distance;
        const sy = centerY + Math.sin(stat.angle) * baseRadius * stat.distance + drift;

        // Background pill for readability
        const labelWidth = ctx.measureText(stat.label).width || 20;
        const valWidth = ctx.measureText(stat.value).width || 20;
        const pillW = Math.max(labelWidth, valWidth) + 16;
        const pillH = 28;
        ctx.fillStyle = `rgba(0, 5, 15, ${0.3 + amplitude * 0.2})`;
        ctx.strokeStyle = `rgba(0, 210, 255, ${0.1 + amplitude * 0.1})`;
        ctx.lineWidth = 0.5;
        const rx = sx - pillW / 2;
        const ry = sy - pillH / 2 + 2;
        // Rounded rect
        ctx.beginPath();
        ctx.moveTo(rx + 3, ry);
        ctx.lineTo(rx + pillW - 3, ry);
        ctx.quadraticCurveTo(rx + pillW, ry, rx + pillW, ry + 3);
        ctx.lineTo(rx + pillW, ry + pillH - 3);
        ctx.quadraticCurveTo(rx + pillW, ry + pillH, rx + pillW - 3, ry + pillH);
        ctx.lineTo(rx + 3, ry + pillH);
        ctx.quadraticCurveTo(rx, ry + pillH, rx, ry + pillH - 3);
        ctx.lineTo(rx, ry + 3);
        ctx.quadraticCurveTo(rx, ry, rx + 3, ry);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Label
        ctx.font = 'bold 8px Orbitron, monospace';
        ctx.fillStyle = `rgba(0, 210, 255, ${0.5 + amplitude * 0.3})`;
        ctx.shadowColor = 'rgba(0, 210, 255, 0.3)';
        ctx.shadowBlur = 4;
        ctx.textAlign = 'center';
        ctx.fillText(stat.label, sx, sy - 4);

        // Value
        ctx.font = 'bold 10px Share Tech Mono, monospace';
        ctx.fillStyle = isActive ? '#00ffd5' : '#00a2ff';
        ctx.shadowColor = isActive ? 'rgba(0,255,213,0.5)' : 'rgba(0,162,255,0.4)';
        ctx.shadowBlur = 8;
        ctx.fillText(stat.value, sx, sy + 10);
        ctx.shadowBlur = 0;
      }

      // ═══ CONNECTIONS (O(n²) with squared distance — avoids sqrt) ═══
      if (amplitude > 0.05) {
        ctx.strokeStyle = `rgba(0,220,255,${0.12 + amplitude * 0.2})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        for (let i = 0; i < particles.length; i++) {
          const p1 = particles[i];
          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p1.x - p2.x, dy = p1.y - p2.y, dz = p1.z - p2.z;
            if (dx * dx + dy * dy + dz * dz < connectionThresholdSq) {
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
            }
          }
        }
        ctx.stroke();
      }

      // ═══ PARTICLES & 3D FLOATING FILE NAMES ═══
      for (let idx = 0; idx < particles.length; idx++) {
        const p = particles[idx];
        const alpha = Math.max(0.15, (p.z + radius) / (2 * radius));
        ctx.fillStyle = `rgba(0,230,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.scale, 0, Math.PI * 2);
        ctx.fill();

        if (p.fileName && alpha > 0.65 && idx % 10 === 0) {
          ctx.font = `${Math.round(8 * p.scale)}px 'Share Tech Mono'`;
          ctx.fillStyle = `rgba(0, 255, 220, ${alpha - 0.15})`;
          ctx.shadowColor = 'rgba(0, 255, 220, 0.45)';
          ctx.shadowBlur = 6;
          ctx.fillText(`📄 ${p.fileName}`, p.x + 8, p.y + 3);
          ctx.shadowBlur = 0;
        }

        if (alpha > 0.6) {
          ctx.fillStyle = `rgba(150,240,255,${alpha * 0.35})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.scale * 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function animate() { update(); draw(); animId = requestAnimationFrame(animate); }

    resize(); animate();
    window.addEventListener('resize', handleResize);
    vizRef.current = { setSpeaking: (v) => { targetAmplitude = v ? 1 : 0; } };
    if (onVisualizerRef) onVisualizerRef(vizRef.current);

    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', handleResize); };
  }, [status, fileNames, onVisualizerRef]);

  return <canvas ref={canvasRef} style={{
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none',
    ...(style || {})
  }} />;
}
