import axios from 'axios';

const API_URL = '/api/messages';

// Get predefined messages
const getPredefinedMessages = async () => {
  const response = await axios.get(`${API_URL}/predefined`);
  return response.data;
};

// Send message
const sendMessage = async (token, gameId, content, isPredefined) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  
  const response = await axios.post(
    `${API_URL}/games/${gameId}`, 
    { content, isPredefined }, 
    config
  );
  
  return response.data;
};

// Get messages for a game
const getGameMessages = async (token, gameId) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  
  const response = await axios.get(`${API_URL}/games/${gameId}`, config);
  return response.data;
};

const chatService = {
  getPredefinedMessages,
  sendMessage,
  getGameMessages,
};

export default chatService;
