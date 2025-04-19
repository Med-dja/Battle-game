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
        const game = await Game.findById(gameId).populate('players.user', 'username'); // Populate user info
        if (!game) return;

        // Check if both players are now ready
        const allReady = game.players.length === 2 && game.players.every(player => player.ready);
        if (allReady && game.status === 'setup') {
           // Update game state (handled by API, but we can broadcast the change)
           // Let's broadcast the updated game state to both players
           io.to(`game:${gameId}`).emit('game:state-update', game);
        } else {
          // Notify opponent that this player is ready
          socket.to(`game:${gameId}`).emit('game:opponent-ready');
        }
      } catch (error) {
        console.error('Game ready error:', error);
      }
    });

    socket.on('game:move', async ({ gameId, x, y, result }) => { // Expect result from client API call
      try {
        const game = await Game.findById(gameId)
          .populate('players.user', 'username')
          .populate('currentTurn', 'username')
          .populate('winner', 'username');

        if (!game) return;

        // Broadcast the move result and the updated game state to both players
        io.to(`game:${gameId}`).emit('game:state-update', game);
        // Optionally, emit a specific event for the move result if needed elsewhere
        // io.to(`game:${gameId}`).emit('game:move-result', { userId: socket.userId, x, y, result });

      } catch (error) {
        console.error('Game move broadcast error:', error);
      }
    });

    // Chat events
    socket.on('chat:message', async ({ gameId, message }) => {
      try {
        // Assume message object contains { content: string, isPredefined: boolean }
        if (!message || !message.content || message.content.trim() === '') {
          // Basic validation on server too
          return;
        }

        // Fetch sender username (alternative to populating after save)
        const sender = await User.findById(socket.userId).select('username');
        if (!sender) return; // User not found

        // Create message object to broadcast
        const messageData = {
          sender: { _id: socket.userId, username: sender.username }, // Include sender info
          content: message.content,
          isPredefined: message.isPredefined || false,
          timestamp: new Date(),
          game: gameId // Include gameId if needed on client
        };

        // Broadcast to everyone in the game room, including the sender
        io.to(`game:${gameId}`).emit('chat:message', messageData);

        // Note: Saving the message to DB is still handled by the API POST /api/messages/games/:gameId
        // This socket handler is just for real-time broadcast.

      } catch (error) {
        console.error('Chat message broadcast error:', error);
        // Optionally emit an error back to the sender
        // socket.emit('chat:error', { message: 'Failed to send message' });
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
