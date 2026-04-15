// Encapsulates all real-time multiplayer logic, user tracking, and active board state synchronization.

const randomColor = () =>
  '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');

// We cache drawing lines in-memory so late joiners can immediately see the existing artwork upon connecting.
let drawingHistory = [];

export function setupSockets(io) {
  io.on('connection', (socket) => {
    const userColor = randomColor();
    const userLabel = 'Guest-' + socket.id.slice(0, 4).toUpperCase();

    // Confirm connection credentials to the specific user making the connection
    socket.emit('self_identity', { id: socket.id, color: userColor, label: userLabel });

    // Alert existing room members to immediately instantiate a rendering cursor for the new joiner
    socket.broadcast.emit('user_joined', { id: socket.id, color: userColor, label: userLabel });

    // Aggregate previously connected clients and beam them to the new user so they can populate their initial cursor map
    const currentUsers = [];
    for (const [, s] of io.of('/').sockets) {
      if (s.id !== socket.id && s.data.color) {
        currentUsers.push({ id: s.id, color: s.data.color, label: s.data.label });
      }
    }
    socket.emit('current_users', currentUsers);

    // Send the active server canvas cache
    socket.emit('drawing_history', drawingHistory);

    // Persisted directly inside socket.data for easy discovery loops later on
    socket.data.color = userColor;
    socket.data.label = userLabel;

    socket.on('cursor_move', ({ x, y }) => {
      socket.broadcast.emit('cursor_update', {
        id: socket.id,
        color: userColor,
        label: userLabel,
        x,
        y,
      });
    });

    socket.on('draw_line', (data) => {
      // We append socket.id here specifically so clients can later target and delete strokes belonging to a single user
      const lineData = { ...data, socketId: socket.id };
      drawingHistory.push(lineData);
      
      // Memory safeguard: slice the oldest lines out if the canvas has been left running indefinitely
      if (drawingHistory.length > 50000) {
        drawingHistory.shift(); 
      }
      
      // Relay instantly to remaining peers to avoid perceived drawing latency
      socket.broadcast.emit('draw_line', data);
    });

    socket.on('clear_all', () => {
      drawingHistory = [];
      io.emit('clear_board');
    });

    socket.on('clear_user', () => {
      // By isolating the sender's socket ID, we non-destructively rebuild the array minus their contributions
      drawingHistory = drawingHistory.filter((line) => line.socketId !== socket.id);
      
      // Clients must wipe their local canvas completely before digesting the new array to fake a deletion effect
      io.emit('update_board', drawingHistory);
    });

    socket.on('disconnect', () => {
      io.emit('user_disconnected', { id: socket.id });
      console.log(`Socket: User disconnected: ${socket.id}`);
    });

    console.log(`Socket: User connected: ${socket.id} (${userLabel}) color=${userColor}`);
  });
}
