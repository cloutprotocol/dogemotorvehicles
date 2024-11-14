const fs = require('fs').promises;
const path = require('path');

class MusicService {
  constructor(musicDirectory) {
    this.musicDirectory = musicDirectory;
    this.supportedFormats = new Set(['.mp3', '.wav']);
  }

  async getPlaylist() {
    try {
      const files = await fs.readdir(this.musicDirectory);
      const tracks = [];

      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (this.supportedFormats.has(ext)) {
          tracks.push({
            name: file.replace(ext, ''),
            path: `/music/${file}`,
            type: ext.slice(1)
          });
        }
      }

      return tracks;
    } catch (error) {
      console.error('Error loading music:', error);
      return [];
    }
  }

  async watchDirectory() {
    try {
      const watcher = fs.watch(this.musicDirectory, (eventType, filename) => {
        if (filename) {
          console.log(`Music change detected: ${filename}`);
        }
      });

      return watcher;
    } catch (error) {
      console.error('Error watching music directory:', error);
    }
  }
}

module.exports = MusicService; 