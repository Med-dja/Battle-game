const Message = require('../models/messageModel');
const Game = require('../models/gameModel');

// Get predefined messages
exports.getPredefinedMessages = (req, res) => {
  const predefinedMessages = [
    "Bien joué !",
    "Bonne chance !",
    "Touché !",
    "Joli coup !",
    "Bien essayé !",
    "Oups !",
    "Je dois partir bientôt.",
    "Une dernière partie ?",
    "GG !",
    "Je reviens dans un instant."
  ];
  
  res.json(predefinedMessages);
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { content, isPredefined } = req.body;
    
    // Validate message content
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Le message ne peut pas être vide' });
    }
    
    // Check if game exists
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
    
    // Create message
    const message = await Message.create({
      game: gameId,
      sender: req.user._id,
      content,
      isPredefined: isPredefined || false
    });
    
    // Update game with message reference
    game.messages.push(message._id);
    await game.save();
    
    // Populate sender info
    await message.populate('sender', 'username');
    
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Get messages for a game
exports.getGameMessages = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    // Check if game exists
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
    
    // Get messages
    const messages = await Message.find({ game: gameId })
      .populate('sender', 'username')
      .sort({ timestamp: 1 });
    
    // Mark messages as read
    await Message.updateMany(
      { 
        game: gameId, 
        sender: { $ne: req.user._id }, 
        isRead: false 
      },
      { isRead: true }
    );
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};
