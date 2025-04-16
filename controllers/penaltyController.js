const User = require('../models/userModel');
const Game = require('../models/gameModel');

// Check for inactive players and apply penalties
exports.checkInactivity = async () => {
  try {
    // Find active games where a player hasn't made a move in over 3 minutes
    const inactiveGames = await Game.find({
      status: 'active',
      'players.lastAction': { $lt: new Date(Date.now() - 3 * 60 * 1000) }
    });
    
    for (const game of inactiveGames) {
      const now = new Date();
      
      // Identify inactive player
      const inactivePlayer = game.players.find(player => 
        player.lastAction < new Date(now - 3 * 60 * 1000)
      );
      
      if (inactivePlayer) {
        // Get active player
        const activePlayer = game.players.find(player =>
          player.user.toString() !== inactivePlayer.user.toString()
        );
        
        // Mark game as abandoned and set winner
        game.status = 'abandoned';
        game.winner = activePlayer.user;
        game.endTime = now;
        
        await game.save();
        
        // Apply penalty to inactive player
        const user = await User.findById(inactivePlayer.user);
        
        user.penalties.push({
          reason: 'Inactivité prolongée',
          appliedAt: now,
          expiresAt: new Date(now.getTime() + 30 * 60 * 1000), // 30 min timeout
          type: 'timeout'
        });
        
        await user.save();
        
        // Update player stats
        await updatePlayerStats(game);
      }
    }
  } catch (error) {
    console.error('Error checking inactivity:', error);
  }
};

// Check if a user is currently penalized
exports.checkUserPenalties = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Check for active penalties
    const now = new Date();
    const activePenalties = user.penalties.filter(penalty => 
      penalty.expiresAt > now
    );
    
    if (activePenalties.length > 0) {
      // Sort by most recent
      activePenalties.sort((a, b) => b.appliedAt - a.appliedAt);
      
      return res.json({
        hasPenalty: true,
        penalty: activePenalties[0]
      });
    }
    
    res.json({
      hasPenalty: false
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Apply a manual penalty (for admin use)
exports.applyPenalty = async (req, res) => {
  try {
    const { userId, reason, type, durationMinutes } = req.body;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    const now = new Date();
    
    user.penalties.push({
      reason,
      appliedAt: now,
      expiresAt: new Date(now.getTime() + durationMinutes * 60 * 1000),
      type
    });
    
    await user.save();
    
    res.json({ message: 'Pénalité appliquée' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Helper function to update player stats
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
  } catch (error) {
    console.error('Error updating player stats:', error);
  }
}
