// Implements top-level DOM event aggregation, ensuring mouse drag cycles coordinate perfectly between native canvas outputs and UDP-style web socket cursor trackers.

import React, { useRef, useCallback } from 'react';
import { useSocket } from './hooks/useSocket.js';
import { RemoteCursor } from './components/Cursor.jsx';
import { Toolbar } from './components/Toolbar.jsx';
import { DrawingCanvas } from './components/DrawingCanvas.jsx';

export default function App() {
  const { socket, cursors, me } = useSocket();

  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Rate-limiting safeguards preventing standard +60-hz monitors from DOS'ing our backend with infinite rapid-fire coordinate emissions
  const rafPending = useRef(false);
  const pendingPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e) => {
    // Guards against triggering destructive drawing segments when actively clicking internal GUI utility layers like "Clear All" buttons
    if (e.target.tagName.toLowerCase() === 'button') return;
    
    isDrawing.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseUpOrLeave = useCallback(() => {
    isDrawing.current = false;
  }, []);

  const handleMouseMove = useCallback((e) => {
    const x = e.clientX;
    const y = e.clientY;

    if (isDrawing.current && me && canvasRef.current) {
      const prevX = lastPos.current.x;
      const prevY = lastPos.current.y;

      // Fires immediately via refs avoiding heavy React Virtual DOM renders so strokes bypass typical component lifecycle and feel completely instant locally
      canvasRef.current.drawLine(prevX, prevY, x, y, me.color);

      socket.emit('draw_line', {
        x0: prevX,
        y0: prevY,
        x1: x,
        y1: y,
        color: me.color,
      });

      lastPos.current = { x, y };
    }

    pendingPos.current = { x, y };
    
    // Limits intense coordinate broadcasting maps directly into the hardware's native requestAnimationFrame boundaries
    if (!rafPending.current) {
      rafPending.current = true;
      requestAnimationFrame(() => {
        socket.emit('cursor_move', pendingPos.current);
        rafPending.current = false;
      });
    }
  }, [me, socket]);

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-white select-none cursor-crosshair"
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
    >
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <DrawingCanvas ref={canvasRef} socket={socket} />
      <Toolbar socket={socket} />

      {Object.entries(cursors).map(([id, { x, y, color, label }]) => (
        <RemoteCursor key={id} x={x} y={y} color={color} label={label} />
      ))}
    </div>
  );
}
