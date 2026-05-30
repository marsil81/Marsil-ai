import { useRef, useEffect } from 'react';

/**
 * Robust color helper that safely parses hex, rgb, or rgba (including space-separated
 * modern formats) and returns a clean, comma-separated rgba string for canvas rendering.
 */
function convertToRgba(colorStr, alpha) {
  if (!colorStr) return `rgba(0, 162, 255, ${alpha})`;
  
  const trimmed = colorStr.trim();
  
  // Hex formats
  if (trimmed.startsWith('#')) {
    let hex = trimmed.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map(x => x + x).join('');
    }
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  
  // rgb/rgba numeric format (supports spaces or commas)
  const match = trimmed.match(/\d+(\.\d+)?/g);
  if (match && match.length >= 3) {
    const r = match[0];
    const g = match[1];
    const b = match[2];
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  
  // Fallback
  return `rgba(0, 162, 255, ${alpha})`;
}

/**
 * Premium cybernetic sparkline chart component.
 * Renders a live mini line chart with gradient fill, glow effects,
 * and animated data point transitions.
 */
export function SparklineChart({ data = [], color = '#00a2ff', height = 32, maxDataPoints = 40, showGrid = true }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || 120;
    const h = height;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, w, h);

    const points = data.slice(-maxDataPoints);
    const len = points.length;
    if (len < 2) return;

    const max = Math.max(...points, 1);
    const min = Math.min(...points, 0);
    const range = max - min || 1;
    const padding = 2;

    const stepX = (w - padding * 2) / (len - 1);
    const getY = (v) => h - padding - ((v - min) / range) * (h - padding * 2);

    // Background grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(0, 162, 255, 0.04)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 3; i++) {
        const gy = padding + (h - padding * 2) * (i / 2);
        ctx.beginPath();
        ctx.moveTo(padding, gy);
        ctx.lineTo(w - padding, gy);
        ctx.stroke();
      }
    }

    // Gradient fill using our robust parsing helper
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, convertToRgba(color, 0.25));
    grad.addColorStop(0.5, convertToRgba(color, 0.1));
    grad.addColorStop(1, 'transparent');

    // Build path
    ctx.beginPath();
    ctx.moveTo(padding, getY(points[0]));
    for (let i = 1; i < len; i++) {
      ctx.lineTo(padding + i * stepX, getY(points[i]));
    }
    ctx.lineTo(padding + (len - 1) * stepX, h - padding);
    ctx.lineTo(padding, h - padding);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(padding, getY(points[0]));
    for (let i = 1; i < len; i++) {
      ctx.lineTo(padding + i * stepX, getY(points[i]));
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = 4;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Data points (only for last point — glowing dot)
    const lastX = padding + (len - 1) * stepX;
    const lastY = getY(points[len - 1]);
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(lastX, lastY, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

  }, [data, color, height, maxDataPoints, showGrid]);

  return (
    <div className="sparkline-canvas-wrapper">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: `${height}px` }}
      />
    </div>
  );
}
