import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';

let socket;

export const initializeSocket = (token) => {
  if (socket) socket.disconnect();
  
  const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ;
  
  socket = io(SOCKET_URL, {
    auth: {
      token
    }
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err);
    toast.error('Erreur de connexion au serveur de jeu');
  });

  // Add global socket event listeners
  setupGlobalListeners(socket);

  return socket;
};

const setupGlobalListeners = (socket) => {
  // Clean up any existing listeners first to avoid duplicates
  socket.off('matchmaking:status');
  socket.off('matchmaking:matched');
  
  // Setup listeners
  socket.on('matchmaking:status', (status) => {
    console.log('Matchmaking status:', status);
    if (!status.success) {
      toast.error(status.message);
    }
  });
  
  socket.on('matchmaking:matched', (data) => {
    console.log('Matchmaking matched:', data);
    toast.success('Partie trouvée !');
    // The redirection will be handled in the component
  });
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) socket.disconnect();
};

// New helper methods for matchmaking
export const joinMatchmaking = () => {
  if (!socket) {
    toast.error('Problème de connexion au serveur');
    return false;
  }
  
  socket.emit('matchmaking:join');
  return true;
};

export const cancelMatchmaking = () => {
  if (!socket) {
    return false;
  }
  
  socket.emit('matchmaking:cancel');
  return true;
};
