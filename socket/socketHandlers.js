const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Game = require('../models/gameModel');
const Message = require('../models/messageModel');
const { addToQueue, removeFromQueue } = require('../services/matchmakingService');

exports.setupSocketHandlers = (io) => {
  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });
  
  io.on('connection', async (socket) => {
    console.log('User connected:', socket.userId);
    
    try {
      // Update user to online status
      await User.findByIdAndUpdate(socket.userId, { 
        lastActive: Date.now() 
      });
      
      // Join personal room for targeted messages
      socket.join(`user:${socket.userId}`);
      
      // Get active games and join their rooms
      const activeGames = await Game.find({
        'players.user': socket.userId,
        status: { $in: ['waiting', 'setup', 'active', 'paused'] }
      });
      
      activeGames.forEach(game => {
        socket.join(`game:${game._id}`);
      });
    } catch (error) {
      console.error('Socket init error:', error);
    }
    
    // Handle matchmaking
    socket.on('matchmaking:join', async () => {
      try {
        const result = await addToQueue(socket.userId);
        
        socket.emit('matchmaking:status', result);
        
        if (result.matched) {
          // Notify both players about the match
          const game = result.game;
          game.players.forEach(player => {
            io.to(`user:${player.user}`).emit('matchmaking:matched', {
              gameId: game._id
            });
          });
        }
      } catch (error) {
        console.error('Matchmaking error:', error);
        socket.emit('matchmaking:status', { success: false, message: 'Erreur du matchmaking' });
      }
    });
    
    socket.on('matchmaking:cancel', () => {
      const result = removeFromQueue(socket.userId);
      socket.emit('matchmaking:status', result);
    });
    
    // Game events
    socket.on('game:join', (gameId) => {
      socket.join(`game:${gameId}`);
    });
    
    socket.on('game:leave', (gameId) => {
      socket.leave(`game:${gameId}`);
    });
    
    socket.on('game:ready', async (gameId) => {
      try {
        const game = await Game.findById(gameId);
        if (!game) return;
        
        // Notify opponent
        socket.to(`game:${gameId}`).emit('game:opponent-ready');
      } catch (error) {
        console.error('Game ready error:', error);
      }
    });
    
    socket.on('game:move', async ({ gameId, x, y }) => {
      try {
        const game = await Game.findById(gameId);
        if (!game) return;
        
        // The actual move is processed by the API endpoint
        // This just notifies the opponent
        socket.to(`game:${gameId}`).emit('game:opponent-moved', { x, y });
      } catch (error) {
        console.error('Game move error:', error);
      }
    });
    
    // Chat events
    socket.on('chat:message', async ({ gameId, message }) => {
      try {
        // Create message in database through controller to ensure validation
        // This is just for immediate feedback in the UI
        socket.to(`game:${gameId}`).emit('chat:message', {
          sender: socket.userId,
          content: message,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Chat message error:', error);
      }
    });
    
    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.userId);
      
      // Update user's last active timestamp
      await User.findByIdAndUpdate(socket.userId, {
        lastActive: Date.now()
      });
      
      // Remove from matchmaking queue if present
      removeFromQueue(socket.userId);
      
      // Handle disconnect in active games
      const activeGames = await Game.find({
        'players.user': socket.userId,
        status: 'active'
      });
      
      for (const game of activeGames) {
        // Mark player as disconnected
        const playerIndex = game.players.findIndex(p => p.user.toString() === socket.userId);
        if (playerIndex !== -1) {
          game.players[playerIndex].disconnected = true;
          await game.save();
          
          // Notify opponent
          socket.to(`game:${game._id}`).emit('game:opponent-disconnected');
        }
      }
    });
  });
};
