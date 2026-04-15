// Render elements for portraying remote users via custom SVG pointers and tracking labels.

import React from 'react';

export function CursorArrow({ color }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}
    >
      <path
        d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
        fill={color}
        stroke="white"
        strokeWidth="1"
      />
    </svg>
  );
}

// Absolute positioning guarantees cursors map flawlessly to the raw X/Y coordinates beamed back from peers
export function RemoteCursor({ x, y, color, label }) {
  return (
    <div
      className="pointer-events-none fixed z-50 flex items-start gap-1"
      style={{ left: x, top: y, transform: 'translate(-2px, -2px)' }}
    >
      <CursorArrow color={color} />
      <span
        className="text-xs font-semibold px-2 py-0.5 rounded-full shadow-lg mt-3 whitespace-nowrap"
        style={{
          backgroundColor: color,
          color: '#fff',
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
        }}
      >
        {label}
      </span>
    </div>
  );
}
