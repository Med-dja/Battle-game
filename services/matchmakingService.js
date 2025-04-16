const User = require('../models/userModel');
const Game = require('../models/gameModel');

/**
 * Queue of players waiting for a match
 * { userId, eloRating, joinedAt }
 */
let matchmakingQueue = [];

// Add player to matchmaking queue
exports.addToQueue = async (userId) => {
  try {
    // Check if user already in queue
    const existingEntry = matchmakingQueue.find(entry => entry.userId.toString() === userId.toString());
    
    if (existingEntry) {
      return { success: false, message: 'Vous êtes déjà dans la file d\'attente' };
    }
    
    // Get user Elo rating
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: 'Utilisateur non trouvé' };
    }
    
    const eloRating = user.getEloRating();
    
    // Add to queue
    matchmakingQueue.push({
      userId,
      eloRating,
      joinedAt: Date.now()
    });
    
    // Try to find a match
    const match = await findMatch(userId, eloRating);
    
    if (match) {
      return { 
        success: true, 
        matched: true, 
        game: match 
      };
    }
    
    return { 
      success: true, 
      matched: false, 
      message: 'Ajouté à la file d\'attente' 
    };
    
  } catch (error) {
    console.error('Matchmaking error:', error);
    return { success: false, message: 'Erreur du serveur de matchmaking' };
  }
};

// Remove player from matchmaking queue
exports.removeFromQueue = (userId) => {
  const initialLength = matchmakingQueue.length;
  matchmakingQueue = matchmakingQueue.filter(entry => entry.userId.toString() !== userId.toString());
  
  return { 
    success: true, 
    removed: initialLength > matchmakingQueue.length,
    message: initialLength > matchmakingQueue.length ? 'Retiré de la file d\'attente' : 'N\'était pas dans la file d\'attente' 
  };
};

// Find a match for a player
async function findMatch(userId, eloRating) {
  // Sort by closest Elo rating and then by longest wait time
  matchmakingQueue.sort((a, b) => {
    if (a.userId.toString() === userId.toString()) return -1;
    if (b.userId.toString() === userId.toString()) return 1;
    
    const eloDistanceA = Math.abs(a.eloRating - eloRating);
    const eloDistanceB = Math.abs(b.eloRating - eloRating);
    
    // First prioritize Elo within 200 points
    const aIsWithinRange = eloDistanceA <= 200;
    const bIsWithinRange = eloDistanceB <= 200;
    
    if (aIsWithinRange && !bIsWithinRange) return -1;
    if (!aIsWithinRange && bIsWithinRange) return 1;
    
    // If both are within range or both outside range, pick longer waiting time
    return a.joinedAt - b.joinedAt;
  });
  
  // Find the first player that isn't the current user
  const opponent = matchmakingQueue.find(entry => entry.userId.toString() !== userId.toString());
  
  if (!opponent) {
    return null; // No match found
  }
  
  // Create a new game
  const game = new Game({
    players: [
      { user: userId },
      { user: opponent.userId }
    ],
    status: 'setup'
  });
  
  await game.save();
  
  // Remove both players from queue
  matchmakingQueue = matchmakingQueue.filter(entry => 
    entry.userId.toString() !== userId.toString() && 
    entry.userId.toString() !== opponent.userId.toString()
  );
  
  return game;
}
