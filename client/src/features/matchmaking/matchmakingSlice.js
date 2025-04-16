import { createSlice } from '@reduxjs/toolkit';
import { joinMatchmaking, cancelMatchmaking } from '../socket/socketService';

const initialState = {
  inQueue: false,
  queueTime: 0,
  message: '',
};

export const matchmakingSlice = createSlice({
  name: 'matchmaking',
  initialState,
  reducers: {
    joinQueue: (state) => {
      state.inQueue = true;
      state.queueTime = 0;
      state.message = 'Recherche d\'adversaires...';
      
      // Emit socket event to join matchmaking
      joinMatchmaking();
    },
    cancelQueue: (state) => {
      state.inQueue = false;
      state.queueTime = 0;
      state.message = '';
      
      // Emit socket event to cancel matchmaking
      cancelMatchmaking();
    },
    updateQueueTime: (state) => {
      state.queueTime += 1;
    },
    setMessage: (state, action) => {
      state.message = action.payload;
    },
    matchFound: (state, action) => {
      state.inQueue = false;
      state.queueTime = 0;
      state.message = `Adversaire trouvé: ${action.payload}`;
    },
  },
});

export const { 
  joinQueue, 
  cancelQueue, 
  updateQueueTime, 
  setMessage, 
  matchFound 
} = matchmakingSlice.actions;
export default matchmakingSlice.reducer;
