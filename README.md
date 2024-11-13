# $DMV Chat Room

## Quick Setup

1. Create project directory and initialize:

```bash
mkdir dmv-chat
c
```

A fun, DMV-themed waiting room chat application with real-time user counting, sticker support, and chat functionality.

## Features
- Real-time chat with user presence
- Sticker support with dynamic loading
- Animated DMV-style interface
- User count tracking
- Random username generation
- Chat history for new users
- Mobile-responsive design

# Usage
- Main page: `http://localhost:3000`
- Chat room: `http://localhost:3000/waiting-room`
- Click "GET IN LINE" to enter the chat room
- Use the emoji button to access stickers
- Chat messages support text and stickers

## Development
- Server: Express.js + Socket.IO
- Frontend: Vanilla JavaScript
- Styling: CSS3 with animations
- Real-time: WebSocket communication

## File Structure
- `chat-server.js`: Main server file
- `chat.html`: Chat room interface
- `index.html`: Landing page
- `stickers/`: Directory for sticker images
- `music/`: Directory for music files

## Notes
- Usernames are randomly generated
- Chat history persists during server runtime
- Stickers are loaded dynamically from the stickers directory