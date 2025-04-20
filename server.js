require('dotenv').config();
const express = require('express');
const http = require('http');
// const socketio = require('socket.io'); // No longer directly needed here
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const userRoutes = require('./routes/userRoutes');
const gameRoutes = require('./routes/gameRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const messageRoutes = require('./routes/messageRoutes');
// const { setupSocketHandlers } = require('./socket/socketHandlers'); // Handled by socketServer.js
const socketServer = require('./socket/socketServer'); // Import the new module

// Initialize express app
const app = express();
const server = http.createServer(app);

// Get allowed origins for CORS from environment or use defaults
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000']; // Ensure this matches your client URL

// Setup Socket.io using the module
const io = socketServer.init(server); // Initialize socket.io via the module

// Middleware
// CORS configuration for Express
const corsOptions = {
  origin: allowedOrigins,
  credentials: true, // Allow cookies/auth headers
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};
app.use(cors(corsOptions)); // Use CORS for Express routes

app.use(express.json()); // Parse JSON bodies

// Routes
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/messages', messageRoutes);

// Serve static assets in production (optional)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build'))); // Adjust path if needed
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client/build', 'index.html')); // Adjust path if needed
  });
}

// Database connection
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    // Start the server
    const PORT = process.env.PORT || 5001;
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit if DB connection fails
  });
