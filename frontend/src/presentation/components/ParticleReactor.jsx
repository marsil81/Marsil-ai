import React, { useRef, useEffect, useState } from 'react';

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
        setFileNames(flatList.slice(0, 15)); // bind up to 15 key files to 3D nodes
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const particles = [];
    const numParticles = 160;
    let baseRadius = Math.min(window.innerWidth, window.innerHeight) * 0.32;
    let radius = baseRadius;
    let centerX = 0, centerY = 0;
    let angleX = 0, angleY = 0;
    let amplitude = 0, targetAmplitude = 0;
    let animId;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      centerX = canvas.width / 2;
      centerY = canvas.height / 2;
      baseRadius = Math.min(canvas.width, canvas.height) * 0.32;
    }

    function initParticles() {
      particles.length = 0;
      for (let i = 0; i < numParticles; i++) {
        const y = 1 - (i / (numParticles - 1)) * 2;
        const radiusAtY = Math.sqrt(1 - y * y);
        const theta = i * Math.PI * (3 - Math.sqrt(5));
        const x = Math.cos(theta) * radiusAtY;
        const z = Math.sin(theta) * radiusAtY;
        particles.push({
          x: x * radius, y: y * radius, z: z * radius,
          baseX: x, baseY: y, baseZ: z,
          size: Math.random() * 2.2 + 1, scale: 1,
          fileName: fileNames[i % fileNames.length] || null
        });
      }
    }

    // Reinitalize particles when fileNames array is populated
    initParticles();

    function update() {
      const isActive = status === 'thinking' || status === 'executing_tool';
      targetAmplitude = isActive ? 1.0 : 0.0;
      amplitude += (targetAmplitude - amplitude) * 0.05;
      angleY += 0.0018 + (amplitude * 0.005);
      angleX += 0.0008 + (amplitude * 0.002);
      const pulse = Math.sin(Date.now() * 0.002) * 5 + (Math.sin(Date.now() * 0.01) * 8 * amplitude);
      radius = baseRadius + pulse;

      particles.forEach(p => {
        let x = p.baseX * radius, y = p.baseY * radius, z = p.baseZ * radius;
        if (amplitude > 0.1) {
          x += (Math.random() - 0.5) * 2 * amplitude;
          y += (Math.random() - 0.5) * 2 * amplitude;
          z += (Math.random() - 0.5) * 2 * amplitude;
        }
        let x1 = x * Math.cos(angleY) - z * Math.sin(angleY);
        let z1 = z * Math.cos(angleY) + x * Math.sin(angleY);
        let y2 = y * Math.cos(angleX) - z1 * Math.sin(angleX);
        let z2 = z1 * Math.cos(angleX) + y * Math.sin(angleX);
        p.x = x1 + centerX; p.y = y2 + centerY; p.z = z2;
        p.scale = 400 / (400 + z2);
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // ═══ CONCENTRIC RINGS (Animated, thicker, rotating in opposite directions) ═══
      const spinAngle1 = (Date.now() * 0.0006);
      const spinAngle2 = -(Date.now() * 0.001);
      
      const ringRadii = [radius * 1.35, radius * 1.15, radius * 0.85, radius * 0.6];
      const ringStyles = [
        { w: 3, a: 0.28, dash: [40, 80], offset: spinAngle1 * 120 },
        { w: 4, a: 0.38, dash: [], isArc: true, start: spinAngle1, end: spinAngle1 + Math.PI * 1.6 },
        { w: 2.5, a: 0.22, dash: [10, 15], offset: spinAngle2 * 60 },
        { w: 2, a: 0.2, dash: [], isArc: true, start: spinAngle2, end: spinAngle2 + Math.PI * 0.9 },
      ];

      ringRadii.forEach((r, i) => {
        const style = ringStyles[i];
        ctx.beginPath();
        ctx.strokeStyle = `rgba(0, 210, 255, ${style.a})`; // Vibrant Sky Blue
        ctx.lineWidth = style.w;
        
        if (style.isArc) {
          ctx.arc(centerX, centerY, r, style.start, style.end);
        } else {
          ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        }
        
        if (style.dash.length > 0) {
          ctx.setLineDash(style.dash);
          ctx.lineDashOffset = style.offset || 0;
        } else {
          ctx.setLineDash([]);
        }
        
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // ═══ TICK MARKS ═══
      const outerR = radius * 1.35;
      const t = Date.now() * 0.00008;
      for (let i = 0; i < 72; i++) {
        const a = (Math.PI * 2 * i) / 72 + t;
        const isMaj = i % 6 === 0;
        const r1 = outerR, r2 = isMaj ? outerR + 10 : outerR + 5;
        ctx.beginPath();
        ctx.moveTo(centerX + Math.cos(a) * r1, centerY + Math.sin(a) * r1);
        ctx.lineTo(centerX + Math.cos(a) * r2, centerY + Math.sin(a) * r2);
        ctx.strokeStyle = isMaj ? 'rgba(0,230,255,0.45)' : 'rgba(0,230,255,0.18)';
        ctx.lineWidth = isMaj ? 2 : 0.8;
        ctx.stroke();
      }

      // ═══ CORE GLOW ═══
      const coreGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 0.35);
      coreGrad.addColorStop(0, `rgba(255,255,255,${0.45 + amplitude * 0.3})`);
      coreGrad.addColorStop(0.2, `rgba(100,225,255,${0.3 + amplitude * 0.15})`);
      coreGrad.addColorStop(0.5, `rgba(0,180,255,${0.12 + amplitude * 0.05})`);
      coreGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.35, 0, Math.PI * 2);
      ctx.fill();

      // ═══ CONNECTIONS ═══
      ctx.strokeStyle = `rgba(0,220,255,${0.12 + amplitude * 0.2})`;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x, dy = p1.y - p2.y, dz = p1.z - p2.z;
          if (Math.sqrt(dx*dx + dy*dy + dz*dz) < 55) {
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
          }
        }
      }
      ctx.stroke();

      // ═══ PARTICLES & 3D FLOATING CODE FILE NAMES ═══
      particles.forEach((p, idx) => {
        const alpha = Math.max(0.15, (p.z + radius) / (2 * radius));
        ctx.fillStyle = `rgba(0,230,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.scale, 0, Math.PI * 2);
        ctx.fill();

        // 🌟 PILLAR 5: Render active floating file names in 3D perspective space!
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
      });

      // ═══ CENTER GLOWING DOT ═══
      ctx.fillStyle = '#fff';
      ctx.shadowColor = 'rgba(0,200,255,0.8)';
      ctx.shadowBlur = 30 + amplitude * 20;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 3 + amplitude * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    function animate() { update(); draw(); animId = requestAnimationFrame(animate); }

    resize(); animate();
    window.addEventListener('resize', resize);
    vizRef.current = { setSpeaking: (v) => { targetAmplitude = v ? 1 : 0; } };
    if (onVisualizerRef) onVisualizerRef(vizRef.current);

    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, [status, fileNames]);

  return <canvas ref={canvasRef} style={{
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none',
    ...(style || {})
  }} />;
}
