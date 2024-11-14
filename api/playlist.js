import MusicService from "./services/musicService";
import path from "path";

export default async function handler(req, res) {
  const musicService = new MusicService(path.join(process.cwd(), 'public/music'));
  const playlist = await musicService.getPlaylist();
  res.json(playlist);
} 