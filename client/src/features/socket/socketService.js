import { io } from 'socket.io-client';
import store from '../../store';
import { updateGameFromSocket, updateBoardFromSocket } from '../game/gameSlice';
import { addMessage } from '../chat/chatSlice';
import { toast } from 'react-toastify';

let socket;

// Setup socket connection
export const setupSocketConnection = (token) => {
  // Close existing connection if any
  if (socket) {
    socket.close();
  }

  // Create new socket connection with auth token
  socket = io({
    auth: {
      token
    }
  });

  // Setup event listeners
  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    toast.error('Problème de connexion au serveur');
  });

  // Game related events
  socket.on('game:update', (data) => {
    store.dispatch(updateGameFromSocket(data));
  });

  socket.on('game:opponent-moved', ({ x, y, result }) => {
    store.dispatch(updateBoardFromSocket({
      x,
      y,
      result,
      isPlayerBoard: true
    }));
    
    // Notifications
    if (result && result.hit) {
      toast.error('Votre navire a été touché !');
      if (result.sunk) {
        toast.error('Un de vos navires a été coulé !');
      }
    }
  });

  socket.on('game:opponent-ready', () => {
    toast.info('Votre adversaire est prêt !');
  });

  socket.on('game:opponent-disconnected', () => {
    toast.warning('Votre adversaire s\'est déconnecté');
  });

  // Matchmaking events
  socket.on('matchmaking:status', (status) => {
    if (status.success) {
      if (status.matched) {
        toast.success('Adversaire trouvé !');
      } else {
        toast.info(status.message);
      }
    } else {
      toast.error(status.message);
    }
  });

  socket.on('matchmaking:matched', (data) => {
    toast.success('Partie trouvée !');
    // Redirect to game page could be handled by another action
  });

  // Chat events
  socket.on('chat:message', (message) => {
    store.dispatch(addMessage(message));
  });

  return socket;
};

// Join a game room
export const joinGameRoom = (gameId) => {
  if (socket) {
    socket.emit('game:join', gameId);
  }
};

// Leave a game room
export const leaveGameRoom = (gameId) => {
  if (socket) {
    socket.emit('game:leave', gameId);
  }
};

// Notify opponent that player is ready
export const notifyReady = (gameId) => {
  if (socket) {
    socket.emit('game:ready', gameId);
  }
};

// Send move notification through socket
export const notifyMove = (gameId, x, y) => {
  if (socket) {
    socket.emit('game:move', { gameId, x, y });
  }
};

// Join matchmaking queue
export const joinMatchmaking = () => {
  if (socket) {
    socket.emit('matchmaking:join');
  }
};

// Cancel matchmaking
export const cancelMatchmaking = () => {
  if (socket) {
    socket.emit('matchmaking:cancel');
  }
};

// Send chat message
export const sendChatMessage = (gameId, message) => {
  if (socket) {
    socket.emit('chat:message', { gameId, message });
  }
};

// Disconnect socket
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};

export const getSocket = () => socket;
