const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  createGame,
  joinGame,
  placeShips,
  makeMove,
  saveGame,
  resumeGame,
  getMyGames,
  getGameById,
  quitGame,
  deleteGame // Import deleteGame
} = require('../controllers/gameController');

const router = express.Router();

router.post('/', protect, createGame);
router.get('/', protect, getMyGames);
router.post('/:gameId/join', protect, joinGame);
router.put('/:gameId/ships', protect, placeShips);
router.post('/:gameId/move', protect, makeMove);
router.put('/:gameId/save', protect, saveGame);
router.put('/:gameId/resume', protect, resumeGame);
router.get('/:gameId', protect, getGameById);
router.post('/:gameId/quit', protect, quitGame);
router.delete('/:gameId', protect, deleteGame); // Add delete route

module.exports = router;
