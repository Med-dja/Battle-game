let io = null;

exports.init = (server) => {
  const socketio = require('socket.io');
  const { setupSocketHandlers } = require('./socketHandlers'); // Adjust path if needed

  // Get allowed origins for CORS from environment or use defaults
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000']; // Ensure this matches your client URL

  io = socketio(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  console.log('Socket.io server initialized.'); // Log initialization
  setupSocketHandlers(io); // Pass the io instance to handlers
  return io;
};

exports.getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
