require('dotenv').config();
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const userRoutes = require('./routes/userRoutes');
const gameRoutes = require('./routes/gameRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const messageRoutes = require('./routes/messageRoutes');
const { setupSocketHandlers } = require('./socket/socketHandlers');

// Initialize express app
const app = express();
const server = http.createServer(app);

// Get allowed origins for CORS from environment or use defaults
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000'];

// Setup Socket.io with proper CORS configuration
const io = socketio(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
// CORS configuration for Express
const corsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

// Serve static files from the React app in development mode
if (process.env.NODE_ENV === 'development') {
  app.use(express.static(path.join(__dirname, 'client', 'dist')));
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/messages', messageRoutes);

// Socket.IO setup
setupSocketHandlers(io);

// Default route
app.get('/', (req, res) => {
  res.send('API Bataille Navale est opérationnelle');
});

// The "catchall" handler for any request that doesn't match an API route
app.use('*', (req, res, next) => { // Added 'next'
  // If it's an API call, let it pass to the 404 handler below
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({ message: 'API route not found' });
  }

  // In development, let Vite handle all non-API requests
  if (process.env.NODE_ENV === 'development') {
    // We don't redirect here anymore, Vite should handle it.
    // If Vite isn't running or configured correctly, this might result in a browser-level connection error,
    // which is different from the backend sending a 404.
    // Let the request fall through (or explicitly do nothing and let the browser handle it)
    console.log(`[Backend Catchall DEV] Ignoring non-API request: ${req.originalUrl}`);
    // It's often better to just let the browser fail to connect to Vite if it's misconfigured
    // rather than the backend interfering. We can simply end the request here or call next().
    // Calling next() might lead to Express's default 404 if no other middleware handles it.
    // Let's explicitly end it to avoid confusion.
    // Alternatively, redirecting might hide the underlying Vite issue.
    // Let's try simply ending the response without action for non-API dev requests.
    // Or better, let the request timeout or fail naturally if Vite isn't serving it.
    // We will just call next() and let Express handle the final 404 if nothing else matches.
    return next();
  } else {
    // In production, serve the built index.html for any non-API request
    res.sendFile(path.join(__dirname, 'client/dist/index.html'), (err) => {
      if (err) {
        res.status(500).send(err);
      }
    });
  }
});

const PORT = process.env.PORT;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
