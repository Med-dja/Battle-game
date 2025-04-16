import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import chatService from './chatService';
import { toast } from 'react-toastify';

const initialState = {
  messages: [],
  predefinedMessages: [],
  loading: false,
  error: null,
};

// Get predefined messages
export const getPredefinedMessages = createAsyncThunk(
  'chat/getPredefinedMessages',
  async (_, thunkAPI) => {
    try {
      return await chatService.getPredefinedMessages();
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

// Send message
export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ gameId, content, isPredefined = false }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      return await chatService.sendMessage(token, gameId, content, isPredefined);
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

// Get messages for a game
export const getGameMessages = createAsyncThunk(
  'chat/getGameMessages',
  async (gameId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      return await chatService.getGameMessages(token, gameId);
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

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    resetMessages: (state) => {
      state.messages = [];
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Get predefined messages cases
      .addCase(getPredefinedMessages.pending, (state) => {
        state.loading = true;
      })
      .addCase(getPredefinedMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.predefinedMessages = action.payload;
      })
      .addCase(getPredefinedMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Send message cases
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.messages.push(action.payload);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get messages cases
      .addCase(getGameMessages.pending, (state) => {
        state.loading = true;
      })
      .addCase(getGameMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload;
      })
      .addCase(getGameMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetMessages, addMessage } = chatSlice.actions;
export default chatSlice.reducer;
