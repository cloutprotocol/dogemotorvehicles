const fs = require('fs').promises;
const path = require('path');

class StickerService {
  constructor(stickerDirectory) {
    this.stickerDirectory = stickerDirectory;
    this.supportedFormats = new Set(['.webp', '.jpg', '.jpeg', '.png', '.gif']);
  }

  async getStickers() {
    try {
      const files = await fs.readdir(this.stickerDirectory);
      const stickers = [];

      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (this.supportedFormats.has(ext)) {
          const fileName = encodeURIComponent(file);
          stickers.push({
            name: file,
            path: `/stickers/${fileName}`,
            type: ext.slice(1)
          });
        }
      }

      return stickers.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error loading stickers:', error);
      return [];
    }
  }

  async watchDirectory() {
    try {
      await fs.mkdir(this.stickerDirectory, { recursive: true });
      
      const watcher = fs.watch(this.stickerDirectory, async (eventType, filename) => {
        if (filename) {
          console.log(`Sticker change detected: ${filename}`);
        }
      });

      return watcher;
    } catch (error) {
      console.error('Error watching sticker directory:', error);
    }
  }
}

module.exports = StickerService; 