import axios from 'axios';

const API_URL = '/api/leaderboard';

// Get global leaderboard
const getGlobalLeaderboard = async () => {
  const response = await axios.get(`${API_URL}/global`);
  return response.data;
};

// Get weekly leaderboard
const getWeeklyLeaderboard = async () => {
  const response = await axios.get(`${API_URL}/weekly`);
  return response.data;
};

// Get daily leaderboard
const getDailyLeaderboard = async () => {
  const response = await axios.get(`${API_URL}/daily`);
  return response.data;
};

// Get player history
const getPlayerHistory = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  
  const response = await axios.get(`${API_URL}/history`, config);
  return response.data;
};

const leaderboardService = {
  getGlobalLeaderboard,
  getWeeklyLeaderboard,
  getDailyLeaderboard,
  getPlayerHistory,
};

export default leaderboardService;
