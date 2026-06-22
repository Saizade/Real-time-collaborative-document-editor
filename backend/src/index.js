const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const docRoutes = require('./routes/docRoutes');
const folderRoutes = require('./routes/folderRoutes');
const { initSocketServer } = require('./sockets/editorSocket');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// Configure Socket.io
const io = new Server(server, {
  cors: {
    origin: '*', // For development, allow any client connection
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
  maxHttpBufferSize: 1e7 // Increase buffer size to 10MB for larger documents
});

// Middleware
app.use(cors());
app.use(express.json());

// REST Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', docRoutes);
app.use('/api/folders', folderRoutes);

// Base Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', time: new Date() });
});

// Initialize WebSocket Collaborative Engine
initSocketServer(io);

// Start Server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
