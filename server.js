const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const StickerService = require('./api/services/stickerService');
const MusicService = require('./api/services/musicService');

const app = express();
const httpServer = createServer(app);

const stickerService = new StickerService(path.join(__dirname, 'public/stickers'));
const musicService = new MusicService(path.join(__dirname, 'public/music'));

const io = new Server(httpServer, {
  path: '/socket.io/',
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ['polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

app.use(express.static('public'));

app.get('/stickers-list', async (req, res) => {
  const stickers = await stickerService.getStickers();
  res.json(stickers);
});

app.get('/playlist', async (req, res) => {
  const playlist = await musicService.getPlaylist();
  res.json(playlist);
});

app.get('/waiting-room', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/chat.html'));
});

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

httpServer.listen(3000, () => {
  console.log('Server listening on port 3000');
}); 