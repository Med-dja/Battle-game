import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import leaderboardService from './leaderboardService';

const initialState = {
  globalLeaderboard: [],
  weeklyLeaderboard: [],
  dailyLeaderboard: [],
  playerHistory: [],
  activeTab: 'global', // 'global', 'weekly', 'daily', 'history'
  loading: false,
  error: null,
};

// Get global leaderboard
export const getGlobalLeaderboard = createAsyncThunk(
  'leaderboard/getGlobalLeaderboard',
  async (_, thunkAPI) => {
    try {
      return await leaderboardService.getGlobalLeaderboard();
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message || 
        error.toString();
      
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get weekly leaderboard
export const getWeeklyLeaderboard = createAsyncThunk(
  'leaderboard/getWeeklyLeaderboard',
  async (_, thunkAPI) => {
    try {
      return await leaderboardService.getWeeklyLeaderboard();
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message || 
        error.toString();
      
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get daily leaderboard
export const getDailyLeaderboard = createAsyncThunk(
  'leaderboard/getDailyLeaderboard',
  async (_, thunkAPI) => {
    try {
      return await leaderboardService.getDailyLeaderboard();
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message || 
        error.toString();
      
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get player history
export const getPlayerHistory = createAsyncThunk(
  'leaderboard/getPlayerHistory',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      return await leaderboardService.getPlayerHistory(token);
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message || 
        error.toString();
      
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState,
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Global leaderboard cases
      .addCase(getGlobalLeaderboard.pending, (state) => {
        state.loading = true;
      })
      .addCase(getGlobalLeaderboard.fulfilled, (state, action) => {
        state.loading = false;
        state.globalLeaderboard = action.payload;
      })
      .addCase(getGlobalLeaderboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Weekly leaderboard cases
      .addCase(getWeeklyLeaderboard.pending, (state) => {
        state.loading = true;
      })
      .addCase(getWeeklyLeaderboard.fulfilled, (state, action) => {
        state.loading = false;
        state.weeklyLeaderboard = action.payload;
      })
      .addCase(getWeeklyLeaderboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Daily leaderboard cases
      .addCase(getDailyLeaderboard.pending, (state) => {
        state.loading = true;
      })
      .addCase(getDailyLeaderboard.fulfilled, (state, action) => {
        state.loading = false;
        state.dailyLeaderboard = action.payload;
      })
      .addCase(getDailyLeaderboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Player history cases
      .addCase(getPlayerHistory.pending, (state) => {
        state.loading = true;
      })
      .addCase(getPlayerHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.playerHistory = action.payload;
      })
      .addCase(getPlayerHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setActiveTab } = leaderboardSlice.actions;
export default leaderboardSlice.reducer;
