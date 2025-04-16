import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from './authService';
import { toast } from 'react-toastify';

// Get user from localStorage
const user = JSON.parse(localStorage.getItem('user'));

const initialState = {
  user: user || null,
  token: user?.token || null,
  isAuthenticated: !!user,
  loading: false,
  error: null,
  success: false,
};

// Register user
export const register = createAsyncThunk(
  'auth/register',
  async (userData, thunkAPI) => {
    try {
      return await authService.register(userData);
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

// Login user
export const login = createAsyncThunk(
  'auth/login',
  async (userData, thunkAPI) => {
    try {
      return await authService.login(userData);
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

// Logout user
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, thunkAPI) => {
    try {
      return await authService.logout();
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

// Request password reset
export const requestPasswordReset = createAsyncThunk(
  'auth/requestPasswordReset',
  async (email, thunkAPI) => {
    try {
      return await authService.requestPasswordReset(email);
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

// Reset password
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, password }, thunkAPI) => {
    try {
      return await authService.resetPassword(token, password);
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

// Check user session (called on app load)
export const checkUserSession = createAsyncThunk(
  'auth/checkSession',
  async (_, thunkAPI) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        return thunkAPI.rejectWithValue('No active session');
      }
      return user;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    reset: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register cases
      .addCase(register.pending, (state) => {
        state.loading = true;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.token = action.payload.token;
        state.success = true;
        toast.success('Inscription réussie !');
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.user = null;
        state.isAuthenticated = false;
      })
      
      // Login cases
      .addCase(login.pending, (state) => {
        state.loading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.token = action.payload.token;
        toast.success('Connexion réussie !');
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.user = null;
        state.isAuthenticated = false;
      })
      
      // Logout cases
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        toast.info('Déconnexion réussie');
      })
      
      // Password reset request cases
      .addCase(requestPasswordReset.pending, (state) => {
        state.loading = true;
      })
      .addCase(requestPasswordReset.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        toast.success('Email de réinitialisation envoyé');
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Reset password cases
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        toast.success('Mot de passe réinitialisé avec succès');
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Check session cases
      .addCase(checkUserSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkUserSession.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.token = action.payload.token;
      })
      .addCase(checkUserSession.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      });
  },
});

export const { reset } = authSlice.actions;
export default authSlice.reducer;
