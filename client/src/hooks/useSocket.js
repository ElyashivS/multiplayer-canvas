// Manages the persistent WebSocket connection lifecycle and structures incoming sibling cursor positions into state.

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', { transports: ['websocket'] });

export function useSocket() {
  const [cursors, setCursors] = useState({});
  const [me, setMe] = useState(null);

  useEffect(() => {
    socket.on('self_identity', (data) => setMe(data));

    // Consumes the initial batch payload on join to instantly build the room dictionary
    socket.on('current_users', (users) => {
      setCursors((prev) => {
        const next = { ...prev };
        users.forEach((u) => {
          next[u.id] = { color: u.color, label: u.label, x: -200, y: -200 };
        });
        return next;
      });
    });

    socket.on('user_joined', ({ id, color, label }) => {
      setCursors((prev) => ({
        ...prev,
        [id]: { color, label, x: -200, y: -200 }, // Start off-screen until they actively move the mouse
      }));
    });

    socket.on('cursor_update', ({ id, x, y, color, label }) => {
      setCursors((prev) => ({
        ...prev,
        [id]: { ...prev[id], x, y, color, label },
      }));
    });

    socket.on('user_disconnected', ({ id }) => {
      // Target and destroy state for dropped connections to prevent zombie cursors lingering on screen
      setCursors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    });

    return () => {
      socket.off('self_identity');
      socket.off('current_users');
      socket.off('user_joined');
      socket.off('cursor_update');
      socket.off('user_disconnected');
    };
  }, []);

  return { socket, cursors, me };
}
