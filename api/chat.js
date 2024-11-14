import { Server } from "socket.io";

const users = new Set();
const messages = [];

export default async function handler(req, res) {
  if (res.socket.server.io) {
    res.end();
    return;
  }

  const io = new Server(res.socket.server, {
    path: '/socket.io/',
    addTrailingSlash: false,
    transports: ['polling'],
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    pingTimeout: 10000,
    pingInterval: 5000,
    upgradeTimeout: 5000,
    maxHttpBufferSize: 1e6,
    connectTimeout: 10000,
    allowEIO3: true,
    serveClient: false
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.emit('connected', { id: socket.id });

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
      console.log('Client disconnected:', socket.id);
      if (socket.username && socket.username !== 'viewer') {
        users.delete(socket.id);
        io.emit('line update', users.size);
      }
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  res.socket.server.io = io;
  res.end();
} 