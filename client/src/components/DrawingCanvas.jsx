// Coordinates all native HTML5 layer mechanics and directly parses incoming strokes and bulk history distributions.

import React, { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';

export const DrawingCanvas = forwardRef(({ socket }, ref) => {
  const canvasRef = useRef(null);

  // Bridges the React boundary to allow the parent App layout to pump high-frequency drag events straight into native drawing cycles without React virtual DOM re-renders
  useImperativeHandle(ref, () => ({
    drawLine: (x0, y0, x1, y1, color) => {
      drawLineOnCanvas(x0, y0, x1, y1, color);
    }
  }));

  const drawLineOnCanvas = useCallback((x0, y0, x1, y1, color) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.closePath();
  }, []);

  const clearLocalCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    // Rapidly drops the entire active bitmap cache instead of manually tracing and erasing old paths
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      // Native canvases dump data internally when width/height shift; we must temporarily save and repaste the raw image bytes specifically to fix UI stretching.
      const tempCtx = canvas.getContext('2d');
      const data = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
      
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      tempCtx.putImageData(data, 0, 0);
    };

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    socket.on('drawing_history', (historyLines) => {
      // Timeout hack to guarantee the DOM tree and underlying width dimensions mount securely before rapidly pushing thousands of lines into the new viewport
      setTimeout(() => {
        historyLines.forEach(({ x0, y0, x1, y1, color }) => {
          drawLineOnCanvas(x0, y0, x1, y1, color);
        });
      }, 50);
    });

    socket.on('draw_line', ({ x0, y0, x1, y1, color }) => {
      drawLineOnCanvas(x0, y0, x1, y1, color);
    });

    socket.on('clear_board', () => {
      clearLocalCanvas();
    });

    // When the node server successfully strips a single specific user out of the backend history array, it beams the remainder array down to us. 
    // We instantly blast our previous canvas state blank and sequentially redraw every other user's past data.
    socket.on('update_board', (historyLines) => {
      clearLocalCanvas();
      historyLines.forEach(({ x0, y0, x1, y1, color }) => {
        drawLineOnCanvas(x0, y0, x1, y1, color);
      });
    });

    return () => {
      socket.off('drawing_history');
      socket.off('draw_line');
      socket.off('clear_board');
      socket.off('update_board');
    };
  }, [socket, drawLineOnCanvas, clearLocalCanvas]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10"
    />
  );
});
