import { Server } from "socket.io";

const users = new Set();
const messages = [];

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  console.log('Socket.IO handler called:', req.method, req.url);

  if (res.socket.server.io) {
    console.log('Socket.IO server already running');
    res.end();
    return;
  }

  const io = new Server(res.socket.server, {
    path: '/socket.io/',
    transports: ['polling'],
    cors: {
      origin: "*",
      methods: ["GET", "POST", "OPTIONS"],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 30000,
    allowEIO3: true
  });

  // Store state
  res.socket.server.users = users;
  res.socket.server.messages = messages;

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    socket.emit('connected', { id: socket.id });

    socket.on('join line', (role) => {
      console.log('Join line:', socket.id, role);
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

    socket.on('disconnect', (reason) => {
      console.log('Client disconnected:', socket.id, reason);
      if (socket.username && socket.username !== 'viewer') {
        users.delete(socket.id);
        io.emit('line update', users.size);
      }
    });

    socket.on('error', (error) => {
      console.error('Socket error for client:', socket.id, error);
    });
  });

  res.socket.server.io = io;
  console.log('Socket.IO server initialized');
  
  // Send success response
  res.writeHead(200, {
    'Content-Type': 'text/plain'
  });
  res.end('Socket.IO server running');
} 