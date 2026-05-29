import { useRef, useEffect } from 'react';

/**
 * Animated data flow lines that connect key panels.
 * Renders glowing particle streams flowing along curved SVG paths.
 * Particles travel from left panels toward right panels, simulating data transfer.
 */
export function DataFlow({ active }) {
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // Define connection paths between panels (as percentage-based bezier curves)
    const connections = [
      // sys-details → resource (left bottom → right bottom)
      { from: { x: '18%', y: '55%' }, cp1: { x: '35%', y: '40%' }, cp2: { x: '65%', y: '60%' }, to: { x: '82%', y: '55%' } },
      // telemetry → resource (left mid → right mid)
      { from: { x: '22%', y: '65%' }, cp1: { x: '40%', y: '50%' }, cp2: { x: '60%', y: '50%' }, to: { x: '78%', y: '65%' } },
      // priority → sys-details (right top → left top — reverse flow)
      { from: { x: '82%', y: '25%' }, cp1: { x: '65%', y: '15%' }, cp2: { x: '35%', y: '35%' }, to: { x: '18%', y: '25%' } },
    ];

    // Create SVG path elements and particle groups
    const ns = 'http://www.w3.org/2000/svg';
    const particles = [];

    connections.forEach((conn, connIdx) => {
      // Path definition
      const path = document.createElementNS(ns, 'path');
      const d = `M ${conn.from.x} ${conn.from.y} C ${conn.cp1.x} ${conn.cp1.y}, ${conn.cp2.x} ${conn.cp2.y}, ${conn.to.x} ${conn.to.y}`;
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', 'rgba(0, 184, 255, 0.06)');
      path.setAttribute('stroke-width', '1');
      path.setAttribute('stroke-dasharray', '4 8');
      svg.appendChild(path);

      // Create 4-6 particles per connection
      const numParticles = 4 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numParticles; i++) {
        const circle = document.createElementNS(ns, 'circle');
        const size = 1.5 + Math.random() * 2;
        circle.setAttribute('r', String(size));
        circle.setAttribute('fill', 'rgba(0, 255, 213, 0.6)');
        circle.setAttribute('filter', 'url(#particleGlow)');
        svg.appendChild(circle);
        particles.push({
          el: circle,
          connIdx,
          offset: i / numParticles,
          speed: 0.15 + Math.random() * 0.25,
          size,
          opacity: 0.3 + Math.random() * 0.5,
        });
      }
    });

    // Add glow filter
    const defs = document.createElementNS(ns, 'defs');
    const filter = document.createElementNS(ns, 'filter');
    filter.setAttribute('id', 'particleGlow');
    const blur = document.createElementNS(ns, 'feGaussianBlur');
    blur.setAttribute('stdDeviation', '2');
    blur.setAttribute('result', 'blur');
    filter.appendChild(blur);
    const merge = document.createElementNS(ns, 'feMerge');
    const mn1 = document.createElementNS(ns, 'feMergeNode');
    mn1.setAttribute('in', 'blur');
    const mn2 = document.createElementNS(ns, 'feMergeNode');
    mn2.setAttribute('in', 'SourceGraphic');
    merge.appendChild(mn1);
    merge.appendChild(mn2);
    filter.appendChild(merge);
    defs.appendChild(filter);
    svg.prepend(defs);

    // Animation loop
    let startTime = performance.now();
    let animId;

    function animate(now) {
      const elapsed = (now - startTime) / 1000;
      const isActive = active === 'thinking' || active === 'executing_tool';
      const baseSpeed = isActive ? 1.0 : 0.4;

      particles.forEach((p) => {
        const conn = connections[p.connIdx];
        const progress = (p.offset + elapsed * p.speed * baseSpeed) % 1;
        const t = progress;

        // Cubic bezier interpolation
        const mt = 1 - t;
        const x = mt * mt * mt * parseFloat(conn.from.x) +
                  3 * mt * mt * t * parseFloat(conn.cp1.x) +
                  3 * mt * t * t * parseFloat(conn.cp2.x) +
                  t * t * t * parseFloat(conn.to.x);
        const y = mt * mt * mt * parseFloat(conn.from.y) +
                  3 * mt * mt * t * parseFloat(conn.cp1.y) +
                  3 * mt * t * t * parseFloat(conn.cp2.y) +
                  t * t * t * parseFloat(conn.to.y);

        // Fade in/out at ends
        const fade = Math.sin(t * Math.PI);
        const alpha = p.opacity * fade * (isActive ? 1.0 : 0.5);

        p.el.setAttribute('cx', x + '%');
        p.el.setAttribute('cy', y + '%');
        p.el.setAttribute('fill', `rgba(0, 255, 213, ${alpha})`);
        p.el.setAttribute('r', String(p.size * (0.5 + fade * 0.5)));
      });

      animId = requestAnimationFrame(animate);
    }

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [active]);

  return (
    <svg
      ref={svgRef}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        zIndex: 5, pointerEvents: 'none', overflow: 'visible',
      }}
    />
  );
}
