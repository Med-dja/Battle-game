const User = require('../models/userModel');
const Game = require('../models/gameModel');

// Get global leaderboard
exports.getGlobalLeaderboard = async (req, res) => {
  try {
    const leaderboard = await User.find()
      .sort({ 'stats.points': -1 })
      .select('username avatar stats')
      .limit(50);
    
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Get weekly leaderboard
exports.getWeeklyLeaderboard = async (req, res) => {
  try {
    // Calculate start of week
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    // Get games from this week
    const weeklyGames = await Game.find({
      status: 'completed',
      endTime: { $gte: startOfWeek }
    });
    
    // Calculate weekly stats
    const weeklyStats = {};
    
    weeklyGames.forEach(game => {
      const winnerId = game.winner.toString();
      
      // Initialize player stats if not exists
      if (!weeklyStats[winnerId]) {
        weeklyStats[winnerId] = {
          userId: winnerId,
          wins: 0,
          gamesPlayed: 0,
          points: 0
        };
      }
      
      // Update winner stats
      weeklyStats[winnerId].wins += 1;
      weeklyStats[winnerId].gamesPlayed += 1;
      weeklyStats[winnerId].points += 10;
      
      // Update loser stats
      game.players.forEach(player => {
        const playerId = player.user.toString();
        
        if (playerId !== winnerId) {
          if (!weeklyStats[playerId]) {
            weeklyStats[playerId] = {
              userId: playerId,
              wins: 0,
              gamesPlayed: 0,
              points: 0
            };
          }
          
          weeklyStats[playerId].gamesPlayed += 1;
        }
      });
    });
    
    // Convert to array and sort
    const leaderboardArray = Object.values(weeklyStats)
      .sort((a, b) => b.points - a.points);
    
    // Get user details for each entry
    const leaderboard = await Promise.all(
      leaderboardArray.map(async (entry) => {
        const user = await User.findById(entry.userId).select('username avatar');
        return {
          user: user,
          stats: {
            wins: entry.wins,
            gamesPlayed: entry.gamesPlayed,
            points: entry.points
          }
        };
      })
    );
    
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Get daily leaderboard
exports.getDailyLeaderboard = async (req, res) => {
  try {
    // Calculate start of day
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    // Get games from today
    const dailyGames = await Game.find({
      status: 'completed',
      endTime: { $gte: startOfDay }
    });
    
    // Calculate daily stats (similar to weekly)
    const dailyStats = {};
    
    dailyGames.forEach(game => {
      const winnerId = game.winner.toString();
      
      // Initialize player stats if not exists
      if (!dailyStats[winnerId]) {
        dailyStats[winnerId] = {
          userId: winnerId,
          wins: 0,
          gamesPlayed: 0,
          points: 0
        };
      }
      
      // Update winner stats
      dailyStats[winnerId].wins += 1;
      dailyStats[winnerId].gamesPlayed += 1;
      dailyStats[winnerId].points += 10;
      
      // Update loser stats
      game.players.forEach(player => {
        const playerId = player.user.toString();
        
        if (playerId !== winnerId) {
          if (!dailyStats[playerId]) {
            dailyStats[playerId] = {
              userId: playerId,
              wins: 0,
              gamesPlayed: 0,
              points: 0
            };
          }
          
          dailyStats[playerId].gamesPlayed += 1;
        }
      });
    });
    
    // Convert to array and sort
    const leaderboardArray = Object.values(dailyStats)
      .sort((a, b) => b.points - a.points);
    
    // Get user details for each entry
    const leaderboard = await Promise.all(
      leaderboardArray.map(async (entry) => {
        const user = await User.findById(entry.userId).select('username avatar');
        return {
          user: user,
          stats: {
            wins: entry.wins,
            gamesPlayed: entry.gamesPlayed,
            points: entry.points
          }
        };
      })
    );
    
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Get player history
exports.getPlayerHistory = async (req, res) => {
  try {
    const games = await Game.find({
      'players.user': req.user._id,
      status: 'completed'
    })
    .populate('players.user', 'username')
    .populate('winner', 'username')
    .sort({ endTime: -1 });
    
    const history = games.map(game => {
      const isWinner = game.winner && game.winner._id.toString() === req.user._id.toString();
      const opponent = game.players.find(player => 
        player.user._id.toString() !== req.user._id.toString()
      );
      
      return {
        gameId: game._id,
        opponent: opponent ? opponent.user.username : 'Unknown',
        result: isWinner ? 'win' : 'loss',
        date: game.endTime,
        duration: game.endTime && game.startTime ? 
          Math.floor((game.endTime - game.startTime) / 1000) : 0 // in seconds
      };
    });
    
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};
