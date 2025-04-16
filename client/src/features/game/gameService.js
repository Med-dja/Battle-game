import axios from 'axios';

const API_URL = '/api/games';

// Get user's active games
const getMyGames = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  
  const response = await axios.get(API_URL, config);
  return response.data;
};

// Create a new game
const createGame = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  
  const response = await axios.post(API_URL, {}, config);
  return response.data;
};

// Join a game
const joinGame = async (token, gameId) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  
  const response = await axios.post(`${API_URL}/${gameId}/join`, {}, config);
  return response.data;
};

// Place ships
const placeShips = async (token, gameId, ships) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  
  const response = await axios.put(`${API_URL}/${gameId}/ships`, { ships }, config);
  return response.data;
};

// Make a move
const makeMove = async (token, gameId, x, y) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  
  const response = await axios.post(`${API_URL}/${gameId}/move`, { x, y }, config);
  return { ...response.data, x, y };
};

// Save game (pause)
const saveGame = async (token, gameId) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  
  const response = await axios.put(`${API_URL}/${gameId}/save`, {}, config);
  return response.data;
};

// Resume game
const resumeGame = async (token, gameId) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  
  const response = await axios.put(`${API_URL}/${gameId}/resume`, {}, config);
  return response.data;
};

// Get game by ID
const getGameById = async (token, gameId) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  
  const response = await axios.get(`${API_URL}/${gameId}`, config);
  return response.data;
};

const gameService = {
  getMyGames,
  createGame,
  joinGame,
  placeShips,
  makeMove,
  saveGame,
  resumeGame,
  getGameById,
};

export default gameService;
