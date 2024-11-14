import { Server } from "socket.io";

const users = new Set();
const messages = [];

export default async function handler(req, res) {
  try {
    if (!res.socket.server.io) {
      const io = new Server(res.socket.server, {
        path: '/socket.io/',
        addTrailingSlash: false,
        transports: ['polling'],
        cors: {
          origin: "*",
          methods: ["GET", "POST"]
        },
        pingTimeout: 60000,
        pingInterval: 25000
      });

      res.socket.server.users = users;
      res.socket.server.messages = messages;

      io.on('connection', (socket) => {
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

      res.socket.server.io = io;
    }

    res.setHeader('Content-Type', 'text/plain');
    res.status(200).end('Socket.IO server running');
  } catch (error) {
    console.error('Socket.IO server error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
} 