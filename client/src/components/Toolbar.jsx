// Fixed utility navigation to emit destructive board wipe commands securely to the backend.

import React from 'react';

export function Toolbar({ socket }) {
  const handleClearAll = () => {
    // Using native confirm prevents rapid accidental wipe-outs of the entire room's collective work
    if (window.confirm("Are you sure you want to clear the board for everyone?")) {
      socket.emit('clear_all');
    }
  };

  const handleClearUser = () => {
    if (window.confirm("Are you sure you want to clear your drawings?")) {
      socket.emit('clear_user');
    }
  };

  return (
    // pointer-events-auto ensures the buttons remain clickable while sitting atop the non-interactive global UI wrapper
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-4 z-50 pointer-events-auto">
      <button
        onClick={handleClearUser}
        className="px-6 py-2.5 bg-indigo-50 text-indigo-600 font-semibold rounded-xl shadow-lg border border-indigo-100 hover:bg-indigo-100 transition-colors"
      >
        Clear My Drawings
      </button>
      <button
        onClick={handleClearAll}
        className="px-6 py-2.5 bg-red-50 text-red-600 font-semibold rounded-xl shadow-lg border border-red-100 hover:bg-red-100 transition-colors"
      >
        Clear All
      </button>
    </div>
  );
}
