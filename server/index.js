// Server entry point responsible for initializing Express and wiring up our modular sockets.
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { setupSockets } from './sockets/index.js';

const app = express();
const httpServer = createServer(app);

// We attach Socket.io directly to the core HTTP server so that Express routes and WebSockets can share the same port smoothly.
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

setupSockets(io);

const PORT = process.env.PORT || 3001;

app.use(cors());

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
