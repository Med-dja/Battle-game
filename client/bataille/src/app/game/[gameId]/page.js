'use client';

import { useState, useEffect, useCallback, useRef } from 'react'; // Added useCallback, useRef
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import axios from '@/lib/axios';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import ShipPlacementBoard from '@/components/game/ShipPlacementBoard';
import ChatBox from '@/components/game/ChatBox'; // Assuming ChatBox takes messages and onSendMessage props

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

  // Update ref whenever game state changes
  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  // Function to update game state from fetched data or socket event
  const updateGameState = useCallback((newGameData) => {
    if (!user) return; // Ensure user context is available

    setGame(newGameData);

    const myPlayerIndex = newGameData.players.findIndex(
      player => player.user._id === user._id
    );
    const opponentPlayerIndex = myPlayerIndex === 0 ? 1 : 0;

    if (newGameData.players[opponentPlayerIndex]) {
      setOpponent(newGameData.players[opponentPlayerIndex].user);
    } else {
      setOpponent(null); // Handle case where opponent leaves?
    }

    if (myPlayerIndex !== -1) {
      // setMyShips(newGameData.players[myPlayerIndex].ships || []); // Ships are managed by ShipPlacementBoard until confirmed
      setMyShots(newGameData.players[myPlayerIndex].shots || []);

      if (opponentPlayerIndex !== -1 && newGameData.players[opponentPlayerIndex]) {
        setOpponentShots(newGameData.players[opponentPlayerIndex].shots || []);
      } else {
        setOpponentShots([]);
      }
    } else {
      // User is not in this game? Or spectator? Clear shots.
      setMyShots([]);
      setOpponentShots([]);
    }

    setIsMyTurn(
      newGameData.status === 'active' &&
      newGameData.currentTurn &&
      newGameData.currentTurn._id === user._id // Compare IDs
    );

    setPlacingShips(
      newGameData.status === 'setup' &&
      myPlayerIndex !== -1 &&
      !newGameData.players[myPlayerIndex].ready
    );

    // Check for game over
    if (newGameData.status === 'completed' && gameRef.current?.status !== 'completed') {
       const winner = newGameData.winner;
       if (winner) {
         toast.success(winner._id === user._id ? 'Vous avez gagné !' : 'Vous avez perdu !');
       }
    } else if (newGameData.status === 'abandoned' && gameRef.current?.status !== 'abandoned') {
       const winner = newGameData.winner;
       if (winner) {
         toast.info(winner._id === user._id ? 'Votre adversaire a abandonné. Vous avez gagné !' : 'Vous avez abandonné la partie.');
       }
    }

  }, [user]); // Add user dependency


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
    if (!gameId || !user) return;
    try {
      const response = await axios.get(`/messages/games/${gameId}`);
      setChatMessages(response.data);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      // toast.error('Erreur chargement messages chat'); // Optional: notify user
    }
  }, [gameId, user]);


  const setupSocketListeners = useCallback(() => {
    const socket = getSocket();
    if (!socket || !gameId) return;

    // Clean up previous listeners for this gameId
    socket.off(`game:state-update`);
    socket.off(`game:opponent-ready`); // Keep if server still sends this separately
    socket.off(`game:opponent-disconnected`);
    socket.off(`chat:message`);

    // Join game room
    socket.emit('game:join', gameId);

    // Listen for full game state updates
    socket.on(`game:state-update`, (updatedGameData) => {
      console.log('Received game state update:', updatedGameData);
      updateGameState(updatedGameData);
    });

    // Listen for opponent ready (might be redundant if state-update covers it)
    socket.on(`game:opponent-ready`, () => {
       if (gameRef.current?.status === 'setup') { // Only relevant during setup
         toast.info('Votre adversaire est prêt !');
         fetchGameData(); // Refresh to ensure sync, though state-update is preferred
       }
    });

    // Listen for opponent disconnection
    socket.on(`game:opponent-disconnected`, () => {
      toast.error('Votre adversaire s\'est déconnecté !');
      // Optionally fetch game data to see if game status changed to abandoned
      fetchGameData();
    });

    // Listen for chat messages
    socket.on(`chat:message`, (message) => {
      console.log('Received message:', message);
      // Add message to state, ensuring no duplicates if sender sees their own message
      setChatMessages((prevMessages) => {
         // Simple check: if last message is identical, skip. Improve if needed.
         if (prevMessages.length > 0) {
            const lastMsg = prevMessages[prevMessages.length - 1];
            if (lastMsg.sender._id === message.sender._id && lastMsg.content === message.content) {
               // Potentially duplicate from broadcast, ignore
               // A more robust check might involve message IDs if available
               return prevMessages;
            }
         }
         return [...prevMessages, message];
      });
    });

  }, [gameId, fetchGameData, updateGameState]); // Add dependencies

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


  useEffect(() => {
    if (!user && !authLoading) {
      router.push('/login');
    }
    if (user && gameId) {
      setLoading(true); // Set loading true when starting data fetch
      fetchGameData();
      fetchChatMessages(); // Fetch initial chat messages
      setupSocketListeners();
    }

    return () => {
      cleanup();
    };
  }, [user, authLoading, gameId, router, fetchGameData, fetchChatMessages, setupSocketListeners, cleanup]); // Add dependencies


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
        toast.success(`Touché${result.sunk ? ' et coulé !' : ' !'}`);
      } else {
        toast.info('Manqué !');
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


  // Generate game board grid cells - Adjusted for Responsiveness
  const renderCells = (isMyBoard) => {
    const cells = [];
    const boardSize = game?.boardSize?.width || 10; // Use game data if available

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
        let cellClass = 'border border-gray-300 aspect-square relative'; // Use aspect-square for responsiveness
        let content = null;
        let interactionClass = '';
        let shipSegment = null;

        if (isMyBoard) {
          // My board - show my ships (if placed) and opponent's shots
          const myPlayer = game?.players.find(p => p.user._id === user._id);
          shipSegment = myPlayer?.ships?.find(ship =>
            ship.positions.some(pos => pos.x === x && pos.y === y)
          );

          const shotAtPosition = opponentShots.find(shot => shot.x === x && shot.y === y);

          if (shipSegment) {
            // Find the specific position to check if hit
            const shipPos = shipSegment.positions.find(pos => pos.x === x && pos.y === y);
            cellClass += shipPos?.hit ? ' bg-red-700' : ' bg-blue-500'; // Hit ship or intact ship
          } else {
             cellClass += ' bg-blue-100'; // Water
          }

          if (shotAtPosition) {
             // Overlay for shot result
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
              cellClass += ' bg-red-500'; // Hit
              // Optionally show ship type if sunk info is available
              // content = <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">{shotAtPosition.shipHit ? shotAtPosition.shipHit.charAt(0).toUpperCase() : 'X'}</div>;
               content = <div className="absolute inset-0 flex items-center justify-center text-white">X</div>; // Simple hit marker
            } else {
              cellClass += ' bg-gray-300'; // Miss
               content = <div className="absolute inset-0 flex items-center justify-center text-gray-600">•</div>; // Simple miss marker
            }
          } else {
            cellClass += ' bg-blue-100'; // Water
            if (isMyTurn && game?.status === 'active') {
               interactionClass = ' hover:bg-blue-200 cursor-pointer'; // Clickable cell
            }
          }
        }

        cells.push(
          <div
            key={`${isMyBoard ? 'my' : 'opp'}-${x}-${y}`}
            className={`${cellClass} ${interactionClass}`}
            onClick={!isMyBoard && isMyTurn && game?.status === 'active' && !shotAtPosition ? () => makeMove(x, y) : undefined}
          >
            {content}
          </div>
        );
      }
    }

    return cells;
  };


  // --- Loading and Edge Case Rendering ---
  if (authLoading || (!user && !authLoading)) { // Handle initial auth loading
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold text-gray-700">Chargement...</div>
      </div>
    );
  }

  if (loading && !game) { // Handle initial game data loading
     return (
       <div className="flex items-center justify-center min-h-screen">
         <div className="text-xl font-semibold text-gray-700">Chargement de la partie...</div>
       </div>
     );
   }

  if (!game) { // Handle game not found after loading attempt
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

  return (
    <div className="container mx-auto px-2 sm:px-4 py-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 text-center text-gray-800">
        {game.status === 'setup' ? 'Placement des navires' :
         game.status === 'active' ? `Partie en cours ${opponent ? `contre ${opponent.username}` : ''}${isMyTurn ? ' - À votre tour' : ' - Tour adverse'}` :
         game.status === 'completed' ? `Partie terminée ${opponent ? `contre ${opponent.username}` : ''}` :
         game.status === 'abandoned' ? 'Partie abandonnée' :
         'Bataille Navale'}
      </h1>

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
              </div>
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="w-full lg:w-1/3 lg:max-h-[600px] flex flex-col flex-shrink"> {/* Adjust height as needed */}
          <ChatBox
             gameId={gameId}
             userId={user._id}
             messages={chatMessages}
             onSendMessage={handleSendMessage}
           />
        </div>
      </div>

      {/* Back Button */}
      {(game.status === 'completed' || game.status === 'abandoned') && (
        <div className="flex justify-center mt-8">
          <Button
            variant="secondary"
            onClick={() => router.push('/dashboard')}
          >
            Retour au tableau de bord
          </Button>
        </div>
      )}
    </div>
  );
}
