const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const StickerService = require('./services/stickerService');
const MusicService = require('./services/musicService');
const fs = require('fs/promises');

// Initialize services
const stickerService = new StickerService(path.join(__dirname, 'stickers'));
const musicService = new MusicService(path.join(__dirname, 'music'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/stickers', express.static(path.join(__dirname, 'stickers')));
app.use('/music', express.static(path.join(__dirname, 'music')));

// Simple room state
const room = {
  users: new Set(),
  messages: []
};

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/waiting-room', (req, res) => {
  res.sendFile(__dirname + '/chat.html');
});

app.get('/stickers-list', async (req, res) => {
  try {
    const stickers = await stickerService.getStickers();
    res.json(stickers);
  } catch (error) {
    console.error('Error serving stickers:', error);
    res.json([]);
  }
});

app.get('/playlist', async (req, res) => {
  try {
    const playlist = await musicService.getPlaylist();
    res.json(playlist);
  } catch (error) {
    console.error('Error serving playlist:', error);
    res.json([]);
  }
});

io.on('connection', (socket) => {
  socket.on('join line', (username) => {
    if (username !== 'viewer') {
      room.users.add(socket.id);
      socket.username = username;
      socket.emit('chat history', room.messages);
    }
    // Always broadcast current count
    io.emit('line update', room.users.size);
  });

  socket.on('chat message', (msg) => {
    if (socket.username && socket.username !== 'viewer') {
      const message = {
        ...msg,
        id: socket.id
      };
      room.messages.push(message);
      io.emit('chat message', message);
    }
  });

  socket.on('disconnect', () => {
    if (socket.username && socket.username !== 'viewer') {
      room.users.delete(socket.id);
      io.emit('line update', room.users.size);
    }
  });
});

http.listen(3000, () => {
  console.log('Server running on port 3000');
});

// Start watching sticker directory for changes
stickerService.watchDirectory().then(() => {
  console.log('Watching sticker directory for changes...');
});

// Start watching music directory
musicService.watchDirectory().then(() => {
  console.log('Watching music directory for changes...');
});

// Ensure stickers directory exists on startup
const ensureDirectories = async () => {
  const dirs = ['stickers', 'music'];
  for (const dir of dirs) {
    try {
      await fs.mkdir(path.join(__dirname, dir), { recursive: true });
    } catch (error) {
      console.error(`Error creating ${dir} directory:`, error);
    }
  }
};

ensureDirectories(); 