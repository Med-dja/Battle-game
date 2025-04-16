const Game = require('../models/gameModel');
const User = require('../models/userModel');

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
    
    const game = await Game.findById(gameId);
    
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
    if (!ships || !Array.isArray(ships) || ships.length !== 5) {
      return res.status(400).json({ message: 'Configuration des navires invalide' });
    }
    
    // Set player's ships
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
    
    res.json(game);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Make a move
exports.makeMove = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { x, y } = req.body;
    
    const game = await Game.findById(gameId);
    
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
    
    // Make the move
    const result = game.recordShot(req.user._id, x, y);
    
    await game.save();
    
    // Update player stats if game is over
    if (game.status === 'completed') {
      await updatePlayerStats(game);
    }
    
    res.json({ game, result });
  } catch (error) {
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
    }).sort({ updatedAt: -1 });
    
    res.json(games);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Get game details
exports.getGameById = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const game = await Game.findById(gameId)
      .populate('players.user', 'username')
      .populate('currentTurn', 'username')
      .populate('winner', 'username');
    
    if (!game) {
      return res.status(404).json({ message: 'Partie non trouvée' });
    }
    
    // Check if user is in game
    const isPlayerInGame = game.players.some(
      player => player.user._id.toString() === req.user._id.toString()
    );
    
    if (!isPlayerInGame && game.status !== 'completed') {
      return res.status(403).json({ message: 'Vous n\'avez pas accès à cette partie' });
    }
    
    res.json(game);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Helper function to update player stats when a game ends
async function updatePlayerStats(game) {
  try {
    const winner = await User.findById(game.winner);
    const loser = await User.findById(
      game.players.find(player => player.user.toString() !== game.winner.toString()).user
    );
    
    // Update winner stats
    winner.stats.gamesPlayed += 1;
    winner.stats.wins += 1;
    winner.stats.points += 10;
    
    // Update loser stats
    loser.stats.gamesPlayed += 1;
    loser.stats.losses += 1;
    
    await winner.save();
    await loser.save();
    
    // Update leaderboard rankings (could be done in a separate process)
    await updateLeaderboardRankings();
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
  } catch (error) {
    console.error('Error updating leaderboard rankings:', error);
  }
}
