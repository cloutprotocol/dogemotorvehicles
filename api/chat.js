import { Server } from "socket.io";
import StickerService from "./services/stickerService";
import MusicService from "./services/musicService";
import path from "path";

const users = new Set();
const messages = [];

export default async function SocketHandler(req, res) {
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
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["*"],
      credentials: false
    },
    allowEIO3: true,
    maxHttpBufferSize: 1e8,
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
    cookie: false
  });

  io.engine.on("connection_error", (err) => {
    console.log(err.req);      // the request object
    console.log(err.code);     // the error code, for example 1
    console.log(err.message);  // the error message, for example "Session ID unknown"
    console.log(err.context);  // some additional error context
  });

  io.on('connection', socket => {
    console.log('Client connected to Vercel');

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
  res.end();
} 