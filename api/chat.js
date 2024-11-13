import { Server } from "socket.io";

const users = new Set();
const messages = [];

export default function SocketHandler(req, res) {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server, {
      path: '/socket.io/',
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

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

    res.socket.server.io = io;
  }
  res.end();
} 