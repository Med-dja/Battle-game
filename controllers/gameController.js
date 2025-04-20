const Game = require('../models/gameModel');
const User = require('../models/userModel');
const { getIo } = require('../socket/socketServer'); // Import getIo

// Create a new game
exports.createGame = async (req, res) => {
  try {
    const game = new Game({
      players: [{
        user: req.user._id
      }],
      status: 'waiting'
    });

    await game.save();
    
    res.status(201).json(game);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Join an existing game
exports.joinGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const game = await Game.findById(gameId);
    
    if (!game) {
      return res.status(404).json({ message: 'Partie non trouvée' });
    }
    
    if (game.status !== 'waiting') {
      return res.status(400).json({ message: 'Cette partie n\'est plus disponible' });
    }
    
    if (game.players.length >= 2) {
      return res.status(400).json({ message: 'La partie est complète' });
    }
    
    // Check if user already in game
    const alreadyInGame = game.players.some(
      player => player.user.toString() === req.user._id.toString()
    );
    
    if (alreadyInGame) {
      return res.status(400).json({ message: 'Vous êtes déjà dans cette partie' });
    }
    
    // Add player to game
    game.players.push({
      user: req.user._id
    });
    
    // Update game status
    game.status = 'setup';
    
    await game.save();
    
    res.json(game);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Place ships
exports.placeShips = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { ships } = req.body;
    const io = getIo(); // Get socket.io instance

    let game = await Game.findById(gameId);

    if (!game) {
      return res.status(404).json({ message: 'Partie non trouvée' });
    }

    if (game.status !== 'setup') {
      return res.status(400).json({ message: 'Impossible de placer les navires à ce stade' });
    }

    // Find player in game
    const playerIndex = game.players.findIndex(
      player => player.user.toString() === req.user._id.toString()
    );

    if (playerIndex === -1) {
      return res.status(403).json({ message: 'Vous n\'êtes pas dans cette partie' });
    }

    // Validate ships (simplified validation)
    if (!ships || !Array.isArray(ships) || ships.length !== 5) { // Assuming 5 ships
      return res.status(400).json({ message: 'Configuration des navires invalide' });
    }

    // Set player's ships and ready status
    game.players[playerIndex].ships = ships;
    game.players[playerIndex].ready = true;

    // Check if both players are ready
    const allReady = game.players.length === 2 && game.players.every(player => player.ready);

    if (allReady) {
      game.status = 'active';
      game.startTime = new Date();
      // Randomly select who starts
      const startingPlayerIndex = Math.floor(Math.random() * 2);
      game.currentTurn = game.players[startingPlayerIndex].user;
    }

    await game.save();

    // Re-fetch the game with populated fields to send back and broadcast
    const populatedGame = await Game.findById(gameId)
      .populate('players.user', 'username')
      .populate('currentTurn', 'username')
      .populate('winner', 'username');

    // Broadcast the updated state to the game room
    io.to(`game:${gameId}`).emit('game:state-update', populatedGame);

    res.json(populatedGame); // Send populated game back in API response
  } catch (error) {
    console.error("Error in placeShips:", error); // Add logging
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Make a move
exports.makeMove = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { x, y } = req.body;
    const io = getIo(); // Get socket.io instance

    let game = await Game.findById(gameId);

    if (!game) {
      return res.status(404).json({ message: 'Partie non trouvée' });
    }

    if (game.status !== 'active') {
      return res.status(400).json({ message: 'La partie n\'est pas active' });
    }

    // Check if it's player's turn
    if (!game.isPlayersTurn(req.user._id)) {
      return res.status(403).json({ message: 'Ce n\'est pas votre tour' });
    }

    // Check if already shot here (add validation)
    const player = game.players.find(p => p.user.toString() === req.user._id.toString());
    if (player.shots.some(shot => shot.x === x && shot.y === y)) {
        return res.status(400).json({ message: 'Vous avez déjà tiré à cet endroit !' });
    }


    // Make the move
    const result = game.recordShot(req.user._id, x, y);

    await game.save();

    // Update player stats if game is over
    if (game.status === 'completed') {
      await updatePlayerStats(game); // Ensure this doesn't modify the game object directly before populating
    }

    // Re-fetch the game with populated fields to send back and broadcast
    const populatedGame = await Game.findById(gameId)
      .populate('players.user', 'username')
      .populate('currentTurn', 'username')
      .populate('winner', 'username');

    // Broadcast the updated state to the game room
    io.to(`game:${gameId}`).emit('game:state-update', populatedGame);

    res.json({ game: populatedGame, result }); // Send populated game back
  } catch (error) {
    console.error("Error in makeMove:", error); // Add logging
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Save game (pause)
exports.saveGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const game = await Game.findById(gameId);
    
    if (!game) {
      return res.status(404).json({ message: 'Partie non trouvée' });
    }
    
    // Check if user is in game
    const isPlayerInGame = game.players.some(
      player => player.user.toString() === req.user._id.toString()
    );
    
    if (!isPlayerInGame) {
      return res.status(403).json({ message: 'Vous n\'êtes pas dans cette partie' });
    }
    
    // Can only pause active games
    if (game.status !== 'active') {
      return res.status(400).json({ message: 'Impossible de mettre en pause cette partie' });
    }
    
    game.status = 'paused';
    
    await game.save();
    
    res.json({ message: 'Partie sauvegardée', game });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Resume game
exports.resumeGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const game = await Game.findById(gameId);
    
    if (!game) {
      return res.status(404).json({ message: 'Partie non trouvée' });
    }
    
    // Check if user is in game
    const isPlayerInGame = game.players.some(
      player => player.user.toString() === req.user._id.toString()
    );
    
    if (!isPlayerInGame) {
      return res.status(403).json({ message: 'Vous n\'êtes pas dans cette partie' });
    }
    
    // Can only resume paused games
    if (game.status !== 'paused') {
      return res.status(400).json({ message: 'Impossible de reprendre cette partie' });
    }
    
    game.status = 'active';
    
    await game.save();
    
    res.json({ message: 'Partie reprise', game });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Get user's active games
exports.getMyGames = async (req, res) => {
  try {
    const games = await Game.find({
      'players.user': req.user._id,
      status: { $in: ['waiting', 'setup', 'active', 'paused'] }
    })
    .populate('players.user', 'username avatar') // Added avatar
    .sort({ updatedAt: -1 });
    
    res.json(games);
  } catch (error) {
    console.error("Error in getMyGames:", error); // Add logging
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Get game details
exports.getGameById = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const game = await Game.findById(gameId)
      .populate('players.user', 'username avatar') // Added avatar
      .populate('currentTurn', 'username')
      .populate('winner', 'username');
    
    if (!game) {
      return res.status(404).json({ message: 'Partie non trouvée' });
    }
    
    // Check if user is in game or if game is completed (allow viewing completed games)
    const isPlayerInGame = game.players.some(
      player => player.user._id.toString() === req.user._id.toString()
    );
    
    if (!isPlayerInGame && game.status !== 'completed' && game.status !== 'abandoned') { // Allow viewing finished games
      return res.status(403).json({ message: 'Vous n\'avez pas accès à cette partie' });
    }
    
    res.json(game);
  } catch (error) {
    console.error("Error in getGameById:", error); // Add logging
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Helper function to update player stats when a game ends
async function updatePlayerStats(game) { // Make sure game object passed here is the one *before* re-fetching/populating for the response
  try {
    // Ensure winner and loser IDs are valid before fetching
    if (!game.winner) {
        console.error("Game completed but no winner found for stat update:", game._id);
        return;
    }
    const winnerId = game.winner.toString();
    const loserPlayer = game.players.find(player => player.user.toString() !== winnerId);
    if (!loserPlayer) {
        console.error("Game completed but loser not found for stat update:", game._id);
        return;
    }
    const loserId = loserPlayer.user.toString();

    const winner = await User.findById(winnerId);
    const loser = await User.findById(loserId);

    if (!winner || !loser) {
        console.error("Winner or loser not found in DB for stat update. WinnerID:", winnerId, "LoserID:", loserId);
        return;
    }

    // Update winner stats
    winner.stats.gamesPlayed = (winner.stats.gamesPlayed || 0) + 1;
    winner.stats.wins = (winner.stats.wins || 0) + 1;
    winner.stats.points = (winner.stats.points || 0) + 10; // Add points for win

    // Update loser stats
    loser.stats.gamesPlayed = (loser.stats.gamesPlayed || 0) + 1;
    loser.stats.losses = (loser.stats.losses || 0) + 1;
    // loser.stats.points = Math.max(0, (loser.stats.points || 0) - 5); // Optional: Deduct points for loss

    await winner.save();
    await loser.save();

    // Update leaderboard rankings (consider doing this less frequently or in a background job)
    // await updateLeaderboardRankings();
  } catch (error) {
    console.error('Error updating player stats:', error);
  }
}

// Helper function to update leaderboard rankings
async function updateLeaderboardRankings() {
  try {
    // Get all users sorted by points
    const users = await User.find().sort({ 'stats.points': -1 });

    // Update rankings
    for (let i = 0; i < users.length; i++) {
      users[i].stats.rank = i + 1;
      await users[i].save();
    }
    console.log("Leaderboard rankings updated."); // Add log
  } catch (error) {
    console.error('Error updating leaderboard rankings:', error);
  }
}
