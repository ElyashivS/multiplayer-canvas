# Real-Time Multiplayer Canvas

A modular, real-time multiplayer drawing and "Figma-like" cursor tracking application built with React, Node.js, and Socket.io. 

## How to Run Locally

We use a custom script to handle all installations instantly. Inside the root of the project directory, run:
```bash
npm run install:all
```

Once things are installed, fire up the heavily-optimized cross-environment `concurrently` script. This boots both the Node socket host and the Vite frontend dev watcher simultaneously:
```bash
npm run dev
```

Point multiple browser tabs (or entire different devices on your network) to the local Vite URL (typically `http://localhost:5173`) and test the multiplayer syncing!

## Features
- **Real-Time Cursors**: See other users' customized SVG cursors moving around the screen identically in real-time, complete with generated color-coded name badges.
- **Shared HTML5 Canvas**: Click and drag to freehand draw instantly synced paths across all connected clients with organic performance.
- **Smart History Tracking**: Late-joiners automatically download the existing drawing state from the Node.js server so they are instantly caught up upon connecting.
- **Optimized Networking**: Mouse coordinate emissions are intelligently throttled to native `requestAnimationFrame` boundaries to avoid DDoSing the server on high-refresh-rate monitors.
- **Safe State Deletion**: Interactive "Clear All" and "Clear My Drawings" functionalities natively wipe the local canvas cache and cleanly filter out target user data securely from the backend's master history arrays.

## Tech Stack
- **Frontend**: React (Vite), Tailwind CSS v4, pure HTML5 Canvas API
- **Backend**: Node.js, Express, Socket.io 
- **Communication**: WebSockets (`socket.io-client`)

## Project Structure
```text
/
├── server/
│   ├── index.js             # Basic HTTP/Express entry initialization
│   └── sockets/index.js     # Modularized Socket.io tracking, broadcasting, and history state
├── client/
│   ├── src/App.jsx                # High-level layout wrapper & global mouse event tracker
│   ├── src/components/            # Modular UI (DrawingCanvas, RemoteCursors, Utility Toolbar)
│   └── src/hooks/useSocket.js     # Encapsulated persistent websocket connection Hook
└── package.json             # Root-level workspace concurrently runner
```
