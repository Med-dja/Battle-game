import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import gameService from './gameService';
import { toast } from 'react-toastify';

const initialState = {
  games: [],
  activeGame: null,
  gameState: 'idle', // 'idle', 'waiting', 'setup', 'active', 'completed'
  playerBoard: Array(10).fill().map(() => Array(10).fill(null)),
  opponentBoard: Array(10).fill().map(() => Array(10).fill(null)),
  ships: [],
  isPlayerTurn: false,
  loading: false,
  error: null,
};

// Get user's active games
export const getMyGames = createAsyncThunk(
  'game/getMyGames',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      return await gameService.getMyGames(token);
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message || 
        error.toString();
      
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Create a new game
export const createGame = createAsyncThunk(
  'game/createGame',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      return await gameService.createGame(token);
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message || 
        error.toString();
      
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Join a game
export const joinGame = createAsyncThunk(
  'game/joinGame',
  async (gameId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      return await gameService.joinGame(token, gameId);
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message || 
        error.toString();
      
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Place ships
export const placeShips = createAsyncThunk(
  'game/placeShips',
  async ({ gameId, ships }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      return await gameService.placeShips(token, gameId, ships);
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message || 
        error.toString();
      
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Make a move
export const makeMove = createAsyncThunk(
  'game/makeMove',
  async ({ gameId, x, y }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      return await gameService.makeMove(token, gameId, x, y);
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message || 
        error.toString();
      
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Save game (pause)
export const saveGame = createAsyncThunk(
  'game/saveGame',
  async (gameId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      return await gameService.saveGame(token, gameId);
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message || 
        error.toString();
      
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Resume game
export const resumeGame = createAsyncThunk(
  'game/resumeGame',
  async (gameId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      return await gameService.resumeGame(token, gameId);
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message || 
        error.toString();
      
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get game by ID
export const getGameById = createAsyncThunk(
  'game/getGameById',
  async (gameId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      return await gameService.getGameById(token, gameId);
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message || 
        error.toString();
      
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    resetGame: (state) => {
      state.activeGame = null;
      state.gameState = 'idle';
      state.playerBoard = Array(10).fill().map(() => Array(10).fill(null));
      state.opponentBoard = Array(10).fill().map(() => Array(10).fill(null));
      state.ships = [];
      state.isPlayerTurn = false;
    },
    updateGameFromSocket: (state, action) => {
      const { game } = action.payload;
      state.activeGame = game;
      
      // Update game state
      state.gameState = game.status;
      
      // Update turn
      if (game.currentTurn) {
        const userId = JSON.parse(localStorage.getItem('user'))?._id;
        state.isPlayerTurn = game.currentTurn === userId;
      }
    },
    updateBoardFromSocket: (state, action) => {
      const { x, y, result, isPlayerBoard } = action.payload;
      
      if (isPlayerBoard) {
        state.playerBoard[y][x] = result.hit ? 'hit' : 'miss';
      } else {
        state.opponentBoard[y][x] = result.hit ? 'hit' : 'miss';
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Get my games cases
      .addCase(getMyGames.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMyGames.fulfilled, (state, action) => {
        state.loading = false;
        state.games = action.payload;
      })
      .addCase(getMyGames.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create game cases
      .addCase(createGame.pending, (state) => {
        state.loading = true;
      })
      .addCase(createGame.fulfilled, (state, action) => {
        state.loading = false;
        state.activeGame = action.payload;
        state.gameState = 'waiting';
        state.games.push(action.payload);
        toast.success('Nouvelle partie créée');
      })
      .addCase(createGame.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Join game cases
      .addCase(joinGame.pending, (state) => {
        state.loading = true;
      })
      .addCase(joinGame.fulfilled, (state, action) => {
        state.loading = false;
        state.activeGame = action.payload;
        state.gameState = 'setup';
        
        // Update game in games list
        const index = state.games.findIndex(g => g._id === action.payload._id);
        if (index !== -1) {
          state.games[index] = action.payload;
        }
        
        toast.success('Partie rejointe');
      })
      .addCase(joinGame.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Place ships cases
      .addCase(placeShips.pending, (state) => {
        state.loading = true;
      })
      .addCase(placeShips.fulfilled, (state, action) => {
        state.loading = false;
        state.activeGame = action.payload;
        state.gameState = action.payload.status;
        
        // If game is active, determine if it's player's turn
        if (action.payload.status === 'active' && action.payload.currentTurn) {
          const userId = JSON.parse(localStorage.getItem('user'))?._id;
          state.isPlayerTurn = action.payload.currentTurn === userId;
        }
        
        toast.success('Navires placés');
      })
      .addCase(placeShips.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Make move cases
      .addCase(makeMove.pending, (state) => {
        state.loading = true;
      })
      .addCase(makeMove.fulfilled, (state, action) => {
        state.loading = false;
        state.activeGame = action.payload.game;
        state.gameState = action.payload.game.status;
        state.isPlayerTurn = false; // After move, it's opponent's turn
        
        // Update opponent board with the result of the move
        const { x, y, result } = action.payload;
        state.opponentBoard[y][x] = result.hit ? 'hit' : 'miss';
        
        if (result.hit) {
          toast.success('Touché !');
          if (result.sunk) {
            toast.success('Coulé !');
          }
        } else {
          toast.info('Manqué !');
        }
        
        if (result.gameOver) {
          toast.success('Partie terminée !');
        }
      })
      .addCase(makeMove.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Save game cases
      .addCase(saveGame.pending, (state) => {
        state.loading = true;
      })
      .addCase(saveGame.fulfilled, (state, action) => {
        state.loading = false;
        state.activeGame = action.payload.game;
        state.gameState = 'paused';
        toast.success('Partie sauvegardée');
      })
      .addCase(saveGame.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Resume game cases
      .addCase(resumeGame.pending, (state) => {
        state.loading = true;
      })
      .addCase(resumeGame.fulfilled, (state, action) => {
        state.loading = false;
        state.activeGame = action.payload.game;
        state.gameState = 'active';
        
        // Determine if it's player's turn
        if (action.payload.game.currentTurn) {
          const userId = JSON.parse(localStorage.getItem('user'))?._id;
          state.isPlayerTurn = action.payload.game.currentTurn === userId;
        }
        
        toast.success('Partie reprise');
      })
      .addCase(resumeGame.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get game by ID cases
      .addCase(getGameById.pending, (state) => {
        state.loading = true;
      })
      .addCase(getGameById.fulfilled, (state, action) => {
        state.loading = false;
        state.activeGame = action.payload;
        state.gameState = action.payload.status;
        
        // Initialize game boards based on the game data
        const userId = JSON.parse(localStorage.getItem('user'))?._id;
        const playerIndex = action.payload.players.findIndex(
          p => p.user._id === userId || p.user === userId
        );
        
        if (playerIndex !== -1) {
          // Setup player board
          const playerShips = action.payload.players[playerIndex].ships;
          if (playerShips && playerShips.length > 0) {
            // Clear player board
            state.playerBoard = Array(10).fill().map(() => Array(10).fill(null));
            
            // Place ships on board
            playerShips.forEach(ship => {
              ship.positions.forEach(pos => {
                if (pos.x >= 0 && pos.x < 10 && pos.y >= 0 && pos.y < 10) {
                  state.playerBoard[pos.y][pos.x] = pos.hit ? 'hit' : 'ship';
                }
              });
            });
            
            // Set ships array for ship placement component
            state.ships = playerShips;
          }
          
          // Setup opponent board with shots
          const opponentIndex = playerIndex === 0 ? 1 : 0;
          
          // Only if we have an opponent
          if (action.payload.players.length > opponentIndex) {
            // Clear opponent board
            state.opponentBoard = Array(10).fill().map(() => Array(10).fill(null));
            
            // Mark shots on opponent board
            const shots = action.payload.players[playerIndex].shots || [];
            shots.forEach(shot => {
              if (shot.x >= 0 && shot.x < 10 && shot.y >= 0 && shot.y < 10) {
                state.opponentBoard[shot.y][shot.x] = shot.hit ? 'hit' : 'miss';
              }
            });
          }
          
          // Set turn
          if (action.payload.currentTurn) {
            state.isPlayerTurn = action.payload.currentTurn === userId ||
              action.payload.currentTurn._id === userId;
          }
        }
      })
      .addCase(getGameById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { resetGame, updateGameFromSocket, updateBoardFromSocket } = gameSlice.actions;
export default gameSlice.reducer;
