import { useCallback, useRef, useState } from 'react';

/**
 * Draggable resize handle between two columns.
 * Tracks mousedown → mousemove → mouseup on document to update widths.
 * Double-click resets to defaultWidth.
 * 
 * Props:
 *   onResize(delta) — called with pixel delta as user drags
 *   onReset()       — called on double-click
 *   direction       — 'horizontal' (default)
 */
export function ResizeHandle({ onResize, onReset }) {
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const handleRef = useRef(null);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    startX.current = e.clientX;
    setDragging(true);

    const onMove = (me) => {
      const delta = me.clientX - startX.current;
      startX.current = me.clientX;
      onResize(delta);
    };

    const onUp = () => {
      setDragging(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [onResize]);

  return (
    <div
      ref={handleRef}
      onMouseDown={handleMouseDown}
      onDoubleClick={onReset}
      title="Drag to resize · Double-click to reset"
      style={{
        width: '6px',
        flexShrink: 0,
        height: '100%',
        cursor: 'col-resize',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
        pointerEvents: 'auto',
        transition: 'background 0.2s',
        background: dragging ? 'rgba(0,255,213,0.08)' : 'transparent',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,255,213,0.06)'; }}
      onMouseLeave={e => { if (!dragging) e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Visual grip line */}
      <div style={{
        width: '1px',
        height: '60%',
        borderRadius: '1px',
        background: dragging
          ? 'rgba(0,255,213,0.7)'
          : 'rgba(255,255,255,0.07)',
        boxShadow: dragging ? '0 0 8px rgba(0,255,213,0.4)' : 'none',
        transition: 'background 0.2s, box-shadow 0.2s',
      }} />
    </div>
  );
}
