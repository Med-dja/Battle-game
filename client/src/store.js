import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';
import gameReducer from './features/game/gameSlice';
import chatReducer from './features/chat/chatSlice';
import leaderboardReducer from './features/leaderboard/leaderboardSlice';
import matchmakingReducer from './features/matchmaking/matchmakingSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    game: gameReducer,
    chat: chatReducer,
    leaderboard: leaderboardReducer,
    matchmaking: matchmakingReducer,
  },
});

export default store;
