import axios from 'axios';

const API_URL = '/api/users';

// Register user
const register = async (userData) => {
  const response = await axios.post(`${API_URL}/register`, userData);
  
  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  
  return response.data;
};

// Login user
const login = async (userData) => {
  const response = await axios.post(`${API_URL}/login`, userData);
  
  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  
  return response.data;
};

// Logout user
const logout = () => {
  localStorage.removeItem('user');
  return { success: true };
};

// Get user profile
const getProfile = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  
  const response = await axios.get(`${API_URL}/profile`, config);
  return response.data;
};

// Request password reset
const requestPasswordReset = async (email) => {
  const response = await axios.post(`${API_URL}/request-reset`, { email });
  return response.data;
};

// Reset password
const resetPassword = async (token, password) => {
  const response = await axios.post(`${API_URL}/reset-password`, { token, password });
  return response.data;
};

const authService = {
  register,
  login,
  logout,
  getProfile,
  requestPasswordReset,
  resetPassword,
};

export default authService;
