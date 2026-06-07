import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Mock user database for validation
const USERS = {
  'admin@nexus.io': { password: 'password123', name: 'Alex Architect' },
  'user@nexus.io': { password: 'password123', name: 'Sam Developer' },
  'guest@nexus.io': { password: 'password123', name: 'Taylor Designer' }
};

// HTTP Authentication Endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = USERS[email];
  
  if (user && user.password === password) {
    const token = jwt.sign({ email, name: user.name }, JWT_SECRET, { expiresIn: '2h' });
    return res.json({ token, name: user.name, email });
  }
  return res.status(401).json({ message: 'Invalid credentials' });
});

// Socket Room State
const rooms = {};

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join-room', ({ roomId, username }) => {
    socket.join(roomId);
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }
    
    // Prevent duplicate entries
    if (!rooms[roomId].some(u => u.id === socket.id)) {
      rooms[roomId].push({ id: socket.id, username });
    }

    // Inform existing users to connect with this new user
    const usersInRoom = rooms[roomId].filter(u => u.id !== socket.id);
    socket.emit('all-users', usersInRoom);

    // Notify others
    socket.to(roomId).emit('user-joined', { id: socket.id, username });
  });

  // WebRTC Signaling Handlers
  socket.on('sending-signal', (payload) => {
    io.to(payload.userToSignal).emit('user-joined-signal', {
      signal: payload.signal,
      callerId: payload.callerId,
      username: payload.username
    });
  });

  socket.on('returning-signal', (payload) => {
    io.to(payload.callerId).emit('receiving-returned-signal', {
      signal: payload.signal,
      id: socket.id
    });
  });

  // Chat Coordination
  socket.on('send-message', (payload) => {
    // payload: { roomId, sender, text, fileData }
    socket.to(payload.roomId).emit('receive-message', {
      sender: payload.sender,
      text: payload.text,
      fileData: payload.fileData,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  });

  // Whiteboard Real-time Coordination
  socket.on('draw', (payload) => {
    // payload: { roomId, x0, y0, x1, y1, color, width, mode }
    socket.to(payload.roomId).emit('draw', payload);
  });

  socket.on('clear-canvas', ({ roomId }) => {
    socket.to(roomId).emit('clear-canvas');
  });

  // Disconnect Lifecycle Handling
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    Object.keys(rooms).forEach(roomId => {
      rooms[roomId] = rooms[roomId].filter(user => user.id !== socket.id);
      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
      } else {
        socket.to(roomId).emit('user-left', socket.id);
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`NexusCall Backend running seamlessly on port ${PORT}`);
});