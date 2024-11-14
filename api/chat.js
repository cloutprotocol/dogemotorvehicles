import { Server } from "socket.io";

const users = new Set();
const messages = [];

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Handle the initial polling request
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server, {
      path: '/socket.io/',
      addTrailingSlash: false,
      transports: ['polling'],
      cors: {
        origin: "*",
        methods: ["GET", "POST", "OPTIONS"],
        credentials: true
      },
      pingTimeout: 10000,
      pingInterval: 5000,
      connectTimeout: 10000,
      allowEIO3: true,
      perMessageDeflate: false,
      httpCompression: false,
      maxHttpBufferSize: 1e6
    });

    // Store state in the server instance
    if (!res.socket.server.users) {
      res.socket.server.users = users;
      res.socket.server.messages = messages;
    }

    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);
      
      // Send immediate acknowledgment
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
  }

  // Handle the Socket.IO request
  if (req.url?.startsWith('/socket.io/')) {
    res.socket.server.io.engine.handleRequest(req, res);
  } else {
    res.end('Socket.IO server running');
  }
} 