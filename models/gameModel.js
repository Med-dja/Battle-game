const mongoose = require('mongoose');

const shipSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['carrier', 'battleship', 'cruiser', 'submarine', 'destroyer'],
    required: true
  },
  size: { 
    type: Number,
    required: true
  },
  positions: [{
    x: Number,
    y: Number,
    hit: { type: Boolean, default: false }
  }],
  sunk: {
    type: Boolean,
    default: false
  }
});

const playerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ships: [shipSchema],
  shots: [{
    x: Number,
    y: Number,
    hit: Boolean,
    shipHit: { type: String, default: null },
    timestamp: { type: Date, default: Date.now }
  }],
  ready: {
    type: Boolean,
    default: false
  },
  disconnected: {
    type: Boolean,
    default: false
  },
  lastAction: {
    type: Date,
    default: Date.now
  }
});

const gameSchema = new mongoose.Schema({
  players: [playerSchema],
  status: {
    type: String,
    enum: ['waiting', 'setup', 'active', 'paused', 'completed', 'abandoned'],
    default: 'waiting'
  },
  currentTurn: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  startTime: Date,
  endTime: Date,
  boardSize: {
    width: { type: Number, default: 10 },
    height: { type: Number, default: 10 }
  },
  turnTimeLimit: {
    type: Number,
    default: 30 // seconds
  },
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }]
}, {
  timestamps: true
});

// Methods to check game state
gameSchema.methods.isPlayersTurn = function(userId) {
  return this.currentTurn && this.currentTurn.toString() === userId.toString();
};

gameSchema.methods.checkGameOver = function() {
  for (const player of this.players) {
    const allShipsSunk = player.ships.every(ship => ship.sunk);
    if (allShipsSunk) {
      // Find opponent as winner
      const winner = this.players.find(p => p.user.toString() !== player.user.toString());
      if (winner) {
        this.winner = winner.user;
        this.status = 'completed';
        this.endTime = new Date();
        return true;
      }
    }
  }
  return false;
};

gameSchema.methods.recordShot = function(userId, x, y) {
  const shooter = this.players.find(p => p.user.toString() === userId.toString());
  const opponent = this.players.find(p => p.user.toString() !== userId.toString());
  
  // Find if the shot hit any ship
  let hitShip = null;
  
  for (const ship of opponent.ships) {
    for (const position of ship.positions) {
      if (position.x === x && position.y === y) {
        position.hit = true;
        hitShip = ship;
        break;
      }
    }
    if (hitShip) break;
  }
  
  // Record the shot
  shooter.shots.push({
    x,
    y,
    hit: !!hitShip,
    shipHit: hitShip ? hitShip.type : null,
    timestamp: new Date()
  });
  
  // Update ship status if all positions hit
  if (hitShip) {
    const allPositionsHit = hitShip.positions.every(pos => pos.hit);
    if (allPositionsHit) {
      hitShip.sunk = true;
    }
  }
  
  // Update last action timestamp
  shooter.lastAction = new Date();
  
  // Change turn ONLY if the shot missed
  if (!hitShip) {
    this.currentTurn = opponent.user;
  }
  // If it was a hit, this.currentTurn remains the same, allowing the player to play again.
  
  // Check if game is over
  this.checkGameOver();
  
  return {
    hit: !!hitShip,
    shipType: hitShip ? hitShip.type : null,
    sunk: hitShip ? hitShip.sunk : false,
    gameOver: this.status === 'completed'
  };
};

const Game = mongoose.model('Game', gameSchema);

module.exports = Game;
