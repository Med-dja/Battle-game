const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Game = require('../models/gameModel');
const Message = require('../models/messageModel');
const { addToQueue, removeFromQueue } = require('../services/matchmakingService');
const { getIo } = require('./socketServer'); // Import getIo

exports.setupSocketHandlers = (io) => { // io is passed in here
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
      console.log(`User ${socket.userId} joining game room: game:${gameId}`); // Log join
      socket.join(`game:${gameId}`);
    });

    socket.on('game:leave', (gameId) => {
      console.log(`User ${socket.userId} leaving game room: game:${gameId}`); // Log leave
      socket.leave(`game:${gameId}`);
    });

    // This is triggered by the client after the placeShips API call returns.
    // The API controller now handles the primary broadcast if the game becomes active.
    // This listener can remain as a secondary notification or for potential future use.
    socket.on('game:ready', async (gameId) => {
      try {
        // We might not strictly need to fetch/broadcast here anymore if the controller does it,
        // but it can serve as confirmation or handle edge cases.
        const game = await Game.findById(gameId)
            .populate('players.user', 'username')
            .populate('currentTurn', 'username')
            .populate('winner', 'username');

        if (!game) return;

        const playerIndex = game.players.findIndex(p => p.user._id.toString() === socket.userId);
        if (playerIndex === -1 || !game.players[playerIndex].ready) {
            console.log(`[Socket game:ready] Player ${socket.userId} not found or not ready in game ${gameId}.`);
            // Optionally handle this case, maybe emit an error back?
            return;
        }

        console.log(`[Socket game:ready] Player ${socket.userId} is ready for game ${gameId}.`);

        // Check if the game became active *just now* due to this player becoming ready
        // (The controller might have already set it to active and broadcasted)
        const allReady = game.players.length === 2 && game.players.every(player => player.ready);

        if (allReady && game.status === 'active') {
             console.log(`[Socket game:ready] Both players ready, game ${gameId} is active. Broadcasting state (potentially redundant).`);
             // Broadcasting here might be redundant if the controller did it, but ensures consistency.
             io.to(`game:${gameId}`).emit('game:state-update', game);
        } else if (game.players.length === 2 && game.status === 'setup') {
             // If the other player isn't ready yet, just notify them.
             console.log(`[Socket game:ready] Player ${socket.userId} ready, notifying opponent in game ${gameId}.`);
             socket.to(`game:${gameId}`).emit('game:opponent-ready');
        }
      } catch (error) {
        console.error(`[Socket game:ready] Error for game ${gameId}:`, error);
      }
    });

    // REMOVED: socket.on('game:move', ...) - Logic moved to controller

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
          // Check if the game should be abandoned
          if (game.status === 'active' || game.status === 'setup') {
             const opponentPlayer = game.players.find(p => p.user.toString() !== socket.userId);
             if (opponentPlayer) {
                 game.status = 'abandoned';
                 game.winner = opponentPlayer.user; // The opponent wins
                 game.endTime = new Date();
                 await game.save();

                 // Update stats for abandoned game
                 await updatePlayerStats(game); // Use the helper function

                 // Fetch populated game to broadcast
                 const populatedGame = await Game.findById(game._id)
                    .populate('players.user', 'username')
                    .populate('currentTurn', 'username')
                    .populate('winner', 'username');

                 console.log(`[Socket Disconnect] Game ${game._id} abandoned due to user ${socket.userId}. Broadcasting state.`);
                 io.to(`game:${game._id}`).emit('game:state-update', populatedGame); // Broadcast abandonment
             }
          } else {
             // If game wasn't active/setup, maybe just mark player disconnected without ending game
             game.players[playerIndex].disconnected = true;
             await game.save();
             // Notify opponent without changing game state drastically
             socket.to(`game:${game._id}`).emit('game:opponent-disconnected'); // Simple notification
          }
        }
      }
    });
  });
};

// Add a helper function to get player stats update logic (similar to the one in gameController)
// This avoids duplicating the logic. Ideally, this logic would live in a service layer.
async function updatePlayerStats(game) {
  try {
    if (!game.winner) return; // Can't update stats without a winner

    const winnerId = game.winner.toString();
    const loserPlayer = game.players.find(player => player.user.toString() !== winnerId);
    if (!loserPlayer) return; // Can't find loser
    const loserId = loserPlayer.user.toString();

    const winner = await User.findById(winnerId);
    const loser = await User.findById(loserId);

    if (!winner || !loser) return; // User not found

    winner.stats.gamesPlayed = (winner.stats.gamesPlayed || 0) + 1;
    winner.stats.wins = (winner.stats.wins || 0) + 1;
    winner.stats.points = (winner.stats.points || 0) + 10;

    loser.stats.gamesPlayed = (loser.stats.gamesPlayed || 0) + 1;
    loser.stats.losses = (loser.stats.losses || 0) + 1;

    await winner.save();
    await loser.save();
    console.log(`Stats updated for game ${game._id}. Winner: ${winner.username}, Loser: ${loser.username}`);
  } catch (error) {
    console.error(`Error updating player stats from socket handler for game ${game._id}:`, error);
  }
}
