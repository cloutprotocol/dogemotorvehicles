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
  transports: ['polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Serve static files from public directory
app.use(express.static('public'));

// API Routes
app.get('/stickers-list', async (req, res) => {
  const stickers = await stickerService.getStickers();
  res.json(stickers);
});

app.get('/playlist', async (req, res) => {
  const playlist = await musicService.getPlaylist();
  res.json(playlist);
});

// Route handlers
app.get('/waiting-room', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/chat.html'));
});

// Socket.IO logic
const users = new Set();
const messages = [];

io.on('connection', socket => {
  console.log('Client connected');

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