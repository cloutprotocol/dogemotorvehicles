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

let currentRaid = {
  name: 'No Active Raid',
  url: '#'
};

app.get('/api/raid', (req, res) => {
  res.json(currentRaid);
});

app.post('/api/raid', express.json(), (req, res) => {
  const { name, url } = req.body;
  
  if (!name || !url) {
    return res.status(400).json({ error: 'Name and URL required' });
  }
  
  currentRaid = { name, url };
  return res.json({ success: true });
});

app.get('/raid', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/raid.html'));
});

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
const MAX_HISTORY = 50;
const messages = [];

io.on('connection', socket => {
  console.log('Client connected');

  socket.on('join line', (role) => {
    if (role !== 'viewer') {
      users.add(socket.id);
      socket.username = role;
      
      socket.emit('system message', {
        type: 'welcome',
        content: `👋 Welcome to the $DMV Waiting Room!\n\nShowing last ${messages.length} messages...`
      });
      
      if (messages.length > 0) {
        socket.emit('chat history', messages);
      }
    }
    io.emit('line update', users.size);
  });

  socket.on('chat message', (msg) => {
    if (socket.username && socket.username !== 'viewer') {
      const message = { ...msg, id: socket.id, timestamp: Date.now() };
      messages.push(message);
      
      if (messages.length > MAX_HISTORY) {
        messages.shift();
      }
      
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