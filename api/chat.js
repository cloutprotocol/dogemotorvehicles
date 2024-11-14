import { Server } from "socket.io";
import StickerService from "./services/stickerService";
import MusicService from "./services/musicService";
import path from "path";

const users = new Set();
const messages = [];

const stickerService = new StickerService(path.join(process.cwd(), 'public/stickers'));
const musicService = new MusicService(path.join(process.cwd(), 'public/music'));

export default async function SocketHandler(req, res) {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server, {
      path: '/socket.io',
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    io.on('connection', async socket => {
      console.log('Client connected to Vercel');

      const stickers = await stickerService.getStickers();
      const playlist = await musicService.getPlaylist();
      socket.emit('stickers', stickers);
      socket.emit('playlist', playlist);

      socket.on('join line', (role) => {
        console.log('User joined:', role);
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