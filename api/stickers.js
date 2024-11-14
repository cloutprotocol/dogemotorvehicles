import StickerService from "./services/stickerService";
import path from "path";

export default async function handler(req, res) {
  const stickerService = new StickerService(path.join(process.cwd(), 'public/stickers'));
  const stickers = await stickerService.getStickers();
  res.json(stickers);
} 