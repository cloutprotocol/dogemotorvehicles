const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const StickerService = require('./api/services/stickerService');
const MusicService = require('./api/services/musicService');

const app = express();
const httpServer = createServer(app);

// Initialize services
const stickerService = new StickerService(path.join(__dirname, 'public/stickers'));
const musicService = new MusicService(path.join(__dirname, 'public/music'));

const io = new Server(httpServer, {
  path: '/socket.io/',
  addTrailingSlash: false,
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Serve static files from public directory
app.use(express.static('public'));

// Route handlers
app.get('/waiting-room', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/chat.html'));
});

// Socket.IO logic
const users = new Set();
const messages = [];

io.on('connection', async socket => {
  console.log('Client connected');

  // Send initial stickers and music data
  const stickers = await stickerService.getStickers();
  const playlist = await musicService.getPlaylist();
  socket.emit('stickers', stickers);
  socket.emit('playlist', playlist);

  socket.on('join line', (role) => {
    if (role !== 'viewer') {
      users.add(socket.id);
      socket.username = role;
      socket.emit('chat history', messages);
    }
    io.emit('line update', users.size);
  });

  socket.on('chat message', (msg) => {
    if (socket.username && socket.username !== 'viewer') {
      const message = { ...msg, id: socket.id };
      messages.push(message);
      io.emit('chat message', message);
    }
  });

  socket.on('disconnect', () => {
    if (socket.username && socket.username !== 'viewer') {
      users.delete(socket.id);
      io.emit('line update', users.size);
    }
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 