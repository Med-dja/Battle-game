'use client';

import { useState, useEffect, useCallback, useRef, memo } from 'react'; // Add memo import
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import axios from '@/lib/axios';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import ShipPlacementBoard from '@/components/game/ShipPlacementBoard';
import ChatBox from '@/components/game/ChatBox'; // Assuming ChatBox takes messages and onSendMessage props
import ConfirmationModal from '@/components/ui/ConfirmationModal'; // Assuming you have a confirmation modal

// Use public folder path for sounds in Next.js (no import, just string URLs)
const hitSoundUrl = '/sounds/hit.mp3';
const missSoundUrl = '/sounds/miss.mp3';
const sunkSoundUrl = '/sounds/sunk.mp3';
const winSoundUrl = '/sounds/win.mp3';
const loseSoundUrl = '/sounds/lose.mp3';
const chatSoundUrl = '/sounds/chat.mp3';

// Create a memoized version of ChatBox to prevent unnecessary re-renders
const MemoizedChatBox = memo(ChatBox);

export default function GamePage() {
  const { gameId } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingShips, setPlacingShips] = useState(false);
  // Removed selectedShip, shipOrientation, myShips - managed by ShipPlacementBoard
  const [myShots, setMyShots] = useState([]);
  const [opponentShots, setOpponentShots] = useState([]);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [opponent, setOpponent] = useState(null);
  const [chatMessages, setChatMessages] = useState([]); // State for chat messages
  const gameRef = useRef(game); // Ref to access latest game state in callbacks
  const [showQuitConfirm, setShowQuitConfirm] = useState(false); // State for quit confirmation
  const [chatLoading, setChatLoading] = useState(false); // Add chat loading state
  // Removed gameVersion state: React should re-render automatically on state changes
  // const [gameVersion, setGameVersion] = useState(0);

  // Update ref whenever game state changes
  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  // Function to update game state from fetched data or socket event
  const updateGameState = useCallback((newGameData) => {
    if (!user) return; // Ensure user context is available

    const previousStatus = gameRef.current?.status; // Get status before update
    setGame(newGameData); // Update game state first

    const myPlayerIndex = newGameData.players.findIndex(
      player => player.user._id === user._id
    );
    const opponentPlayerIndex = myPlayerIndex === 0 ? 1 : 0;

    if (newGameData.players[opponentPlayerIndex]) {
      setOpponent(newGameData.players[opponentPlayerIndex].user);
    } else {
      setOpponent(null);
    }

    if (myPlayerIndex !== -1) {
      setMyShots(newGameData.players[myPlayerIndex].shots || []);
      if (opponentPlayerIndex !== -1 && newGameData.players[opponentPlayerIndex]) {
        setOpponentShots(newGameData.players[opponentPlayerIndex].shots || []);
      } else {
        setOpponentShots([]);
      }

      // Update placingShips state based on the *new* game data
      const isPlayerReady = newGameData.players[myPlayerIndex].ready;
      setPlacingShips(newGameData.status === 'setup' && !isPlayerReady);

    } else {
      setMyShots([]);
      setOpponentShots([]);
      setPlacingShips(false); // Not a player, cannot be placing ships
    }

    setIsMyTurn(
      newGameData.status === 'active' &&
      newGameData.currentTurn?._id === user._id
    );

    // Check for game over/abandoned state changes to show toast only once
    if (newGameData.status === 'completed' && previousStatus !== 'completed') {
       const winner = newGameData.winner;
       if (winner) {
         toast.success(winner._id === user._id ? 'Vous avez gagné !' : 'Vous avez perdu !');
       }
    } else if (newGameData.status === 'abandoned' && previousStatus !== 'abandoned') {
       const winner = newGameData.winner;
       if (winner) {
         toast(winner._id === user._id ? 'Votre adversaire a abandonné. Vous avez gagné !' : 'Vous avez abandonné la partie.');
       }
    }

  }, [user]); // Keep user dependency


  const fetchGameData = useCallback(async () => {
    if (!gameId || !user) return; // Ensure gameId and user are available
    try {
      // setLoading(true); // Avoid redundant loading states if called frequently
      const response = await axios.get(`/games/${gameId}`);
      updateGameState(response.data);
    } catch (error) {
      console.error('Error fetching game:', error);
      toast.error('Erreur lors du chargement de la partie');
      // Maybe redirect if game not found or unauthorized
      if (error.response?.status === 404 || error.response?.status === 403) {
        router.push('/dashboard');
      }
    } finally {
      setLoading(false); // Set loading false after fetch attempt
    }
  }, [gameId, user, updateGameState, router]); // Add dependencies

  // Fetch initial chat messages
  const fetchChatMessages = useCallback(async () => {
    if (!gameId || !game) return; // Add check for game object

    setChatLoading(true);
    try {
      const response = await axios.get(`/messages/games/${gameId}`);
      setChatMessages(response.data);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      // toast.error('Erreur chargement messages chat'); // Optional: notify user
    } finally {
      setChatLoading(false);
    }
  }, [gameId, game]);

  // --- Sound effect helpers ---
  const playSound = useCallback((url) => {
    if (typeof window !== 'undefined' && url) {
      const audio = new window.Audio(url);
      audio.volume = 0.5;
      audio.play().catch(() => {});
    }
  }, []);

  // --- Robust socket listeners for real-time game and chat ---
  const setupSocketListeners = useCallback(() => {
    const socket = getSocket();
    if (!socket || !gameId) return;

    // Remove all listeners for this gameId to avoid duplicates
    socket.off(`game:state-update`);
    socket.off(`game:opponent-ready`);
    socket.off(`game:opponent-disconnected`);
    socket.off(`chat:message`);
    socket.off('connect');
    socket.off('reconnect');

    // Always join the room on connect/reconnect
    const joinRoom = () => {
      console.log(`[Socket] Joining game room: ${gameId}`);
      socket.emit('game:join', gameId);
    };
    socket.on('connect', joinRoom);
    socket.on('reconnect', joinRoom);
    joinRoom();

    // Listen for full game state updates (moves, ship placement, etc.)
    socket.on(`game:state-update`, (updatedGameData) => {
      console.log(`[Socket] Received game update for game ${gameId}:`, updatedGameData);

      // Defensive: ensure all user IDs are strings for comparison
      if (updatedGameData && updatedGameData.players) {
        updatedGameData.players = updatedGameData.players.map(player => ({
          ...player,
          user: typeof player.user === 'object' && player.user._id ? player.user : { _id: String(player.user) }
        }));
      }

      // Defensive: ensure currentTurn and winner are objects with _id
      if (updatedGameData && updatedGameData.currentTurn && typeof updatedGameData.currentTurn === 'string') {
        updatedGameData.currentTurn = { _id: updatedGameData.currentTurn };
      }
      if (updatedGameData && updatedGameData.winner && typeof updatedGameData.winner === 'string') {
        updatedGameData.winner = { _id: updatedGameData.winner };
      }

      // Deep copy to force React state update (paranoia for socket payloads)
      updateGameState(JSON.parse(JSON.stringify(updatedGameData)));
    });

    // Listen for opponent ready (optional, for legacy support)
    socket.on(`game:opponent-ready`, () => {
      if (gameRef.current?.status === 'setup') {
        toast('Votre adversaire est prêt !');
        // No need to fetchGameData if state-update is always sent
      }
    });

    // Listen for opponent disconnection
    socket.on(`game:opponent-disconnected`, () => {
      toast.error('Votre adversaire s\'est déconnecté !');
      // Optionally fetch game data to see if game status changed to abandoned
      fetchGameData();
    });

    // Listen for chat messages in real-time
    socket.on(`chat:message`, (message) => {
      playSound(chatSoundUrl);
      setChatMessages((prevMessages) => {
        // Prevent duplicate messages (by _id if available, else fallback)
        if (prevMessages.length > 0) {
          const lastMsg = prevMessages[prevMessages.length - 1];
          if (
            (message._id && lastMsg._id === message._id) ||
            (lastMsg.sender._id === message.sender._id && lastMsg.content === message.content && lastMsg.timestamp === message.timestamp)
          ) {
            return prevMessages;
          }
        }
        return [...prevMessages, message];
      });
    });
  }, [gameId, fetchGameData, updateGameState, playSound]);

  // Add this effect to log when important game state changes occur
  useEffect(() => {
    if (game) {
      console.log(`[Game state] Status: ${game.status}, My turn: ${isMyTurn}, Shots: ${myShots.length}/${opponentShots.length}`);
    }
  }, [game, isMyTurn, myShots, opponentShots]);

  // --- Ensure listeners are always up-to-date and re-setup on reconnect ---
  useEffect(() => {
    setupSocketListeners();
    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, user]); // Only re-run when gameId or user changes

  // --- Fetch game and chat data on mount and when user/gameId changes ---
  useEffect(() => {
    if (!user && !authLoading) {
      router.push('/login');
    }
    if (user && gameId) {
      setLoading(true);
      fetchGameData();
      fetchChatMessages();
    }
    // No cleanup here; handled in socket effect above
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, gameId, router]);

  // Effect to fetch messages when game state is updated (e.g., after initial load)
  useEffect(() => {
    if (game && game.status !== 'loading') { // Check if game is loaded
        fetchChatMessages();
    }
  }, [game, fetchChatMessages]); // Re-fetch messages if game object changes

  const cleanup = useCallback(() => {
    const socket = getSocket();
    if (socket && gameId) {
      // Remove specific listeners when component unmounts or gameId changes
      socket.off(`game:state-update`);
      socket.off(`game:opponent-ready`);
      socket.off(`game:opponent-disconnected`);
      socket.off(`chat:message`);
      socket.emit('game:leave', gameId); // Leave the room
    }
  }, [gameId]);

  const joinGame = async () => {
    // ... (joinGame logic remains mostly the same)
    try {
      await axios.post(`/games/${gameId}/join`);
      toast.success('Vous avez rejoint la partie !');
      fetchGameData(); // Fetch data after joining
    } catch (error) {
      console.error('Error joining game:', error);
      toast.error(error.response?.data?.message || 'Erreur pour rejoindre la partie');
      router.push('/dashboard'); // Redirect on failure
    }
  };

  // Called by ShipPlacementBoard upon confirmation
  const handlePlaceShips = async (ships) => {
    if (!game || game.status !== 'setup') return;
    try {
      const response = await axios.put(`/games/${gameId}/ships`, { ships });
      toast.success('Navires placés avec succès !');
      // Update local state immediately based on response
      updateGameState(response.data);
      // Notify server/opponent via socket (server might handle broadcasting state update)
      const socket = getSocket();
      if (socket) {
        socket.emit('game:ready', gameId);
      }
      // No longer need setPlacingShips(false) here, updateGameState handles it
      // No longer need fetchGameData() here if API returns updated state

    } catch (error) {
      console.error('Error placing ships:', error);
      toast.error(error.response?.data?.message || 'Erreur lors du placement des navires');
    }
  };

  const makeMove = async (x, y) => {
    if (!isMyTurn || game?.status !== 'active') {
      toast.error('Ce n\'est pas votre tour ou la partie n\'est pas active !');
      return;
    }

    if (myShots.some(shot => shot.x === x && shot.y === y)) {
      toast.warning('Vous avez déjà tiré à cet endroit !');
      return;
    }

    try {
      // Optimistic UI update (optional, makes it feel faster)
      // setMyShots(prev => [...prev, { x, y, hit: null, timestamp: new Date() }]); // Mark as pending
      // setIsMyTurn(false); // Assume turn changes

      const response = await axios.post(`/games/${gameId}/move`, { x, y });
      // API response should contain the updated game state
      const updatedGame = response.data.game;
      const result = response.data.result;

      // Update state based on the definitive response
      updateGameState(updatedGame);

      if (result.hit) {
        if (result.sunk) playSound(sunkSoundUrl);
        else playSound(hitSoundUrl);
        toast.success(`Touché${result.sunk ? ' et coulé !' : ' !'}`);
      } else {
        playSound(missSoundUrl);
        toast('Manqué !');
      }

      // Notify opponent via socket, sending the result and updated game state
      const socket = getSocket();
      if (socket) {
        // Server now broadcasts 'game:state-update' based on API call,
        // so client-side emit might be redundant unless specifically needed.
        // socket.emit('game:move', { gameId, x, y, result });
      }

      // No need for fetchGameData() if updateGameState handles the response

    } catch (error) {
      console.error('Error making move:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la tentative de tir');
      // Revert optimistic updates if necessary
      // fetchGameData(); // Fetch to re-sync state on error
    }
  };

  // Send chat message via API and Socket
  const handleSendMessage = async (messageContent, isPredefined = false) => {
    if (!gameId || !messageContent || messageContent.trim() === '') return;

    const message = {
      content: messageContent,
      isPredefined: isPredefined
    };

    try {
      // 1. Send to API to save
      const response = await axios.post(`/messages/games/${gameId}`, message);
      const savedMessage = response.data; // Message with sender populated by API

      // 2. Emit via Socket for real-time broadcast (handled by server now)
      const socket = getSocket();
      if (socket) {
         // Server listener 'chat:message' will get this and broadcast
         socket.emit('chat:message', { gameId, message });
      }

      // 3. Optimistic UI update (optional, as broadcast should update)
      // setChatMessages((prev) => [...prev, savedMessage]); // Use savedMessage from API

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.response?.data?.message || 'Erreur envoi message');
    }
  };

  // Handle quitting the game
  const handleQuitGame = useCallback(async () => {
    if (!gameId) return;

    try {
      setShowQuitConfirm(false); // Close modal immediately
      // API call to quit the game
      await axios.post(`/games/${gameId}/quit`);
      toast('Vous avez abandonné la partie.');
      // The backend will emit 'game:state-update' which will update the UI
      // No need to manually push router here, let the state update handle it
    } catch (error) {
      console.error('Error quitting game:', error);
      // Error toast is likely handled by the axios interceptor
      // toast.error(error.response?.data?.message || 'Erreur lors de l\'abandon');
    }
  }, [gameId]); // Add dependencies

  // Generate game board grid cells - Adjusted for Responsiveness
  const renderCells = (isMyBoard) => {
    const cells = [];
    const boardSize = game?.boardSize?.width || 10; // Use game data if available
    const gameStatus = game?.status; // Get current game status

    // Add Header Row (A-J)
    cells.push(<div key="corner" className="aspect-square"></div>); // Top-left corner
    for (let x = 0; x < boardSize; x++) {
      cells.push(
        <div key={`col-header-${x}`} className="aspect-square flex items-center justify-center text-xs sm:text-sm font-semibold text-gray-500">
          {String.fromCharCode(65 + x)}
        </div>
      );
    }

    // Add Grid Cells and Row Headers (1-10)
    for (let y = 0; y < boardSize; y++) {
       // Row Header
       cells.push(
         <div key={`row-header-${y}`} className="aspect-square flex items-center justify-center text-xs sm:text-sm font-semibold text-gray-500">
           {y + 1}
         </div>
       );
       // Grid Cells for the row
      for (let x = 0; x < boardSize; x++) {
        let cellClass = 'border border-gray-300 aspect-square relative';
        let content = null;
        let interactionClass = '';
        let shipSegment = null;

        if (isMyBoard) {
          // My board - show my ships (if placed) and opponent's shots
          const myPlayer = game?.players.find(p => p.user._id === user._id);
          // Only find ship segment if ships exist and placement is done or game active/over
          if (myPlayer?.ships && (!placingShips || gameStatus !== 'setup')) {
            shipSegment = myPlayer.ships.find(ship =>
              ship.positions.some(pos => pos.x === x && pos.y === y)
            );
          }

          // Always define shotAtPosition for this cell
          const shotAtPosition = opponentShots.find(shot => shot.x === x && shot.y === y);

          if (shipSegment) {
            // Find the specific position to check if hit
            const shipPos = shipSegment.positions.find(pos => pos.x === x && pos.y === y);
            cellClass += shipPos?.hit ? ' bg-red-700' : ' bg-blue-500';
          } else {
            cellClass += ' bg-blue-100';
          }

          if (shotAtPosition) {
            content = (
              <div className={`absolute inset-0 flex items-center justify-center ${shotAtPosition.hit ? 'text-white' : 'text-gray-600'}`}>
                <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${shotAtPosition.hit ? 'bg-white' : 'bg-gray-400'}`}></div>
              </div>
            );
          }
        } else {
          // Opponent's board - show my shots
          const shotAtPosition = myShots.find(shot => shot.x === x && shot.y === y);

          if (shotAtPosition) {
            if (shotAtPosition.hit) {
              cellClass += ' bg-red-500';
              content = <div className="absolute inset-0 flex items-center justify-center text-white">X</div>;
            } else {
              cellClass += ' bg-gray-300';
              content = <div className="absolute inset-0 flex items-center justify-center text-gray-600">•</div>;
            }
          } else {
            cellClass += ' bg-blue-100';
            if (isMyTurn && gameStatus === 'active') {
              interactionClass = ' hover:bg-blue-200 cursor-pointer';
            }
          }
        }

        cells.push(
          <div
            key={`${isMyBoard ? 'my' : 'opp'}-${x}-${y}`}
            className={`${cellClass} ${interactionClass}`}
            onClick={
              !isMyBoard && isMyTurn && gameStatus === 'active' && !myShots.some(shot => shot.x === x && shot.y === y)
                ? () => makeMove(x, y)
                : undefined
            }
          >
            {content}
          </div>
        );
      }
    }
    return cells;
  };

  // --- Loading and Edge Case Rendering ---
  // Show loading spinner if auth is loading OR if game data is loading initially
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {/* Consider using a dedicated loading component/spinner here */}
        <div className="text-xl font-semibold text-gray-700">Chargement...</div>
      </div>
    );
  }

  // Show error if game data failed to load after loading state is false
  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-xl font-semibold mb-4 text-red-600">Partie introuvable ou accès refusé</div>
        <Button onClick={() => router.push('/dashboard')}>Retour au tableau de bord</Button>
      </div>
    );
  }

  // --- Game State Rendering ---
  // Find if current user is actually a player in this game
  const isPlayer = game.players.some(player => player.user._id === user._id);

  // Waiting screen (if user is the first player)
  if (game.status === 'waiting' && game.players.length < 2 && isPlayer) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">En attente d'un adversaire...</h1>
        <p className="mb-4 text-gray-600">Partagez ce lien pour inviter un ami :</p>
        <div className="bg-gray-100 rounded p-3 mb-6 w-full max-w-md mx-auto text-gray-700 break-words">
          {typeof window !== 'undefined' ? `${window.location.origin}/game/${gameId}` : 'Chargement du lien...'}
        </div>
        {/* Add a copy button maybe */}
        <Button variant="secondary" onClick={() => router.push('/dashboard')}>Retour au tableau de bord</Button>
      </div>
    );
  }

  // Join game screen (if user is not yet a player)
  if (game.status === 'waiting' && !isPlayer) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Rejoindre la partie ?</h1>
        <p className="mb-4 text-gray-600">Cette partie attend un deuxième joueur.</p>
        <div className="flex gap-4 justify-center">
          <Button onClick={joinGame}>Rejoindre la partie</Button>
          <Button variant="secondary" onClick={() => router.push('/dashboard')}>Annuler</Button>
        </div>
      </div>
    );
  }

  // --- Main Game View ---
  const boardSize = game?.boardSize?.width || 10;
  const gridColsClass = `grid-cols-${boardSize + 1}`; // e.g., grid-cols-11 for 10x10 board + header

  // Remove container padding, handled by layout.js now
  return (
    // Removed key={gameVersion}: Let React handle re-renders based on state updates
    <div className="mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 text-center text-gray-800">
        {game.status === 'setup' ? (placingShips ? 'Placement des navires' : 'En attente de l\'adversaire...') :
         game.status === 'active' ? `Partie en cours ${opponent ? `contre ${opponent.username}` : ''}${isMyTurn ? ' - À votre tour' : ' - Tour adverse'}` :
         game.status === 'completed' ? `Partie terminée ${opponent ? `contre ${opponent.username}` : ''}` :
         game.status === 'abandoned' ? 'Partie abandonnée' :
         'Bataille Navale'}
      </h1>

      {/* ... Game Over/Abandoned messages ... */}
       {game.status === 'completed' && (
        <div className="text-center mb-4">
          <div className={`text-xl font-bold ${game.winner?._id === user._id ? 'text-green-600' : 'text-red-600'}`}>
            {game.winner?._id === user._id ? 'Vous avez gagné !' : 'Vous avez perdu !'}
          </div>
        </div>
      )}
       {game.status === 'abandoned' && (
        <div className="text-center mb-4">
          <div className={`text-xl font-bold ${game.winner?._id === user._id ? 'text-green-600' : 'text-red-600'}`}>
            {game.winner?._id === user._id ? 'Victoire par abandon !' : 'Défaite par abandon !'}
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">
        {/* Game Boards Area */}
        <div className="w-full lg:w-2/3 flex-shrink-0">
          {placingShips ? (
             <div className="mt-8">
               <h2 className="text-lg font-semibold mb-4 text-center text-gray-700">Placez vos navires</h2>
               <ShipPlacementBoard onPlaceShips={handlePlaceShips} boardSize={boardSize} />
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
              {/* My Board */}
              <div>
                <h2 className="text-base sm:text-lg font-semibold mb-2 text-gray-700">Mon plateau</h2>
                <div className={`grid ${gridColsClass} bg-white rounded shadow overflow-hidden border border-gray-300`}>
                  {renderCells(true)}
                </div>
              </div>

              {/* Opponent's Board */}
              <div>
                <h2 className="text-base sm:text-lg font-semibold mb-2 text-gray-700">
                  Plateau adverse {opponent ? `(${opponent.username})` : ''}
                </h2>
                <div className={`grid ${gridColsClass} bg-white rounded shadow overflow-hidden border border-gray-300`}>
                  {renderCells(false)}
                </div>
                 {isMyTurn && game.status === 'active' && <p className="text-center mt-2 text-blue-600 font-semibold">Cliquez sur une case pour tirer.</p>}
                 {!isMyTurn && game.status === 'active' && <p className="text-center mt-2 text-gray-500">En attente du tir adverse...</p>}
                 {/* Show waiting message if setup is done but game not active yet */}
                 {game.status === 'setup' && !placingShips && <p className="text-center mt-2 text-gray-500">En attente de l'adversaire...</p>}
              </div>
            </div>
          )}
        </div>

        {/* Chat Area */}
        {/* Ensure ChatBox itself handles internal scrolling */}
        <div className="w-full lg:w-1/3 lg:max-h-[600px] flex flex-col flex-shrink bg-white rounded shadow">
          <MemoizedChatBox
             gameId={gameId} // Keep gameId if ChatBox needs it for internal logic unrelated to messages
             userId={user._id} // Pass userId for message alignment
             messages={chatMessages} // Pass messages state
             onSendMessage={handleSendMessage} // Pass the send message handler
             loading={chatLoading} // Pass loading state
           />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center mt-8 space-x-4">
         {/* Show Quit button only during playable states */}
         {isPlayer && ['setup', 'active', 'paused'].includes(game.status) && (
           <Button
             variant="danger"
             onClick={() => setShowQuitConfirm(true)} // Open confirmation modal
           >
             Abandonner la partie
           </Button>
         )}
         {/* Back Button - Show after game ends or if not a player */}
         {(!isPlayer || game.status === 'completed' || game.status === 'abandoned') && (
           <Button
             variant="secondary"
             onClick={() => router.push('/dashboard')}
           >
             Retour au tableau de bord
           </Button>
         )}
      </div>

      {/* Quit Confirmation Modal */}
      {showQuitConfirm && (
        <ConfirmationModal
          title="Abandonner la partie"
          message="Êtes-vous sûr de vouloir abandonner ? Cela comptera comme une défaite."
          confirmText="Abandonner"
          cancelText="Annuler"
          onConfirm={handleQuitGame}
          onCancel={() => setShowQuitConfirm(false)}
          variant="danger"
        />
      )}
    </div>
  );
}
