'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import axios from '@/lib/axios';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import ShipPlacementBoard from '@/components/game/ShipPlacementBoard';

export default function GamePage() {
  const { gameId } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingShips, setPlacingShips] = useState(false);
  const [selectedShip, setSelectedShip] = useState(null);
  const [shipOrientation, setShipOrientation] = useState('horizontal');
  const [myShips, setMyShips] = useState([]);
  const [myShots, setMyShots] = useState([]);
  const [opponentShots, setOpponentShots] = useState([]);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [opponent, setOpponent] = useState(null);

  // Check authentication
  useEffect(() => {
    if (!user && !authLoading) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch game data
  useEffect(() => {
    if (user && gameId) {
      fetchGameData();
      setupSocketListeners();
    }
    
    return () => {
      cleanup();
    };
  }, [user, gameId]);

  const setupSocketListeners = () => {
    const socket = getSocket();
    if (!socket) return;
    
    // Join game room
    socket.emit('game:join', gameId);
    
    // Listen for opponent ready
    socket.on('game:opponent-ready', () => {
      toast.success('Votre adversaire est prêt !');
      fetchGameData(); // Refresh game data
    });
    
    // Listen for opponent moves
    socket.on('game:opponent-moved', ({ x, y }) => {
      toast.info('Votre adversaire a tiré !');
      fetchGameData(); // Refresh game data
    });
    
    // Listen for opponent disconnection
    socket.on('game:opponent-disconnected', () => {
      toast.error('Votre adversaire s\'est déconnecté !');
      fetchGameData(); // Refresh game data
    });
    
    // Listen for chat messages
    socket.on('chat:message', (message) => {
      // Implement chat functionality here
      console.log('Received message:', message);
    });
  };

  const cleanup = () => {
    const socket = getSocket();
    if (socket) {
      socket.off('game:opponent-ready');
      socket.off('game:opponent-moved');
      socket.off('game:opponent-disconnected');
      socket.off('chat:message');
      socket.emit('game:leave', gameId);
    }
  };

  const fetchGameData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/games/${gameId}`);
      setGame(response.data);
      
      // Find my player index
      const myPlayerIndex = response.data.players.findIndex(
        player => player.user._id === user._id
      );
      
      // Find opponent
      const opponentPlayerIndex = myPlayerIndex === 0 ? 1 : 0;
      if (response.data.players[opponentPlayerIndex]) {
        setOpponent(response.data.players[opponentPlayerIndex].user);
      }
      
      // Set ships and shots
      if (myPlayerIndex !== -1) {
        setMyShips(response.data.players[myPlayerIndex].ships || []);
        setMyShots(response.data.players[myPlayerIndex].shots || []);
        
        if (opponentPlayerIndex !== -1 && response.data.players[opponentPlayerIndex]) {
          setOpponentShots(response.data.players[opponentPlayerIndex].shots || []);
        }
      }
      
      // Check if it's my turn
      setIsMyTurn(
        response.data.status === 'active' && 
        response.data.currentTurn && 
        response.data.currentTurn === user._id
      );
      
      // Check if we need to place ships
      if (response.data.status === 'setup' && 
          myPlayerIndex !== -1 && 
          !response.data.players[myPlayerIndex].ready) {
        setPlacingShips(true);
      } else {
        setPlacingShips(false);
      }
      
    } catch (error) {
      console.error('Error fetching game:', error);
      toast.error('Erreur lors du chargement de la partie');
    } finally {
      setLoading(false);
    }
  };

  const joinGame = async () => {
    try {
      await axios.post(`/games/${gameId}/join`);
      toast.success('Vous avez rejoint la partie !');
      fetchGameData();
    } catch (error) {
      console.error('Error joining game:', error);
      toast.error('Erreur lors de la tentative de rejoindre la partie');
    }
  };

  const placeShips = async () => {
    try {
      if (myShips.length !== 5) {
        toast.error('Vous devez placer tous vos navires !');
        return;
      }
      
      await axios.put(`/games/${gameId}/ships`, { ships: myShips });
      toast.success('Navires placés avec succès !');
      
      // Notify opponent via socket
      const socket = getSocket();
      if (socket) {
        socket.emit('game:ready', gameId);
      }
      
      setPlacingShips(false);
      fetchGameData();
    } catch (error) {
      console.error('Error placing ships:', error);
      toast.error('Erreur lors du placement des navires');
    }
  };

  const makeMove = async (x, y) => {
    if (!isMyTurn) {
      toast.error('Ce n\'est pas votre tour !');
      return;
    }
    
    // Check if we already fired at this position
    if (myShots.some(shot => shot.x === x && shot.y === y)) {
      toast.error('Vous avez déjà tiré à cet endroit !');
      return;
    }
    
    try {
      const response = await axios.post(`/games/${gameId}/move`, { x, y });
      
      const { result } = response.data;
      
      if (result.hit) {
        toast.success(`Touché${result.sunk ? ' et coulé !' : ' !'}`);
      } else {
        toast.info('Manqué !');
      }
      
      // Notify opponent via socket
      const socket = getSocket();
      if (socket) {
        socket.emit('game:move', { gameId, x, y });
      }
      
      // Check if game is over
      if (result.gameOver) {
        toast.success('Vous avez gagné la partie !');
      }
      
      fetchGameData();
    } catch (error) {
      console.error('Error making move:', error);
      toast.error('Erreur lors de la tentative de tir');
    }
  };

  // Generate game board grid cells
  const renderCells = (isMyBoard) => {
    const cells = [];
    const boardSize = 10;
    
    for (let y = 0; y < boardSize; y++) {
      for (let x = 0; x < boardSize; x++) {
        let cellClass = 'border border-gray-300 w-8 h-8 md:w-10 md:h-10';
        let content = null;
        
        if (isMyBoard) {
          // My board - show my ships and opponent's shots
          const shipAtPosition = myShips.find(ship => 
            ship.positions.some(pos => pos.x === x && pos.y === y)
          );
          
          const shotAtPosition = opponentShots.find(shot => shot.x === x && shot.y === y);
          
          if (shipAtPosition) {
            cellClass += ' bg-blue-500'; // Ship
            
            // If this position was hit
            const hitPosition = shipAtPosition.positions.find(pos => pos.x === x && pos.y === y && pos.hit);
            if (hitPosition) {
              cellClass = cellClass.replace('bg-blue-500', 'bg-red-500'); // Hit ship
            }
          }
          
          if (shotAtPosition) {
            content = shotAtPosition.hit ? 
              <div className="w-3 h-3 rounded-full bg-red-600 mx-auto"></div> : 
              <div className="w-3 h-3 rounded-full bg-gray-400 mx-auto"></div>;
          }
        } else {
          // Opponent's board - show my shots
          const shotAtPosition = myShots.find(shot => shot.x === x && shot.y === y);
          
          if (shotAtPosition) {
            if (shotAtPosition.hit) {
              cellClass += ' bg-red-500'; // Hit
              if (shotAtPosition.shipHit) {
                content = <div className="text-white text-xs font-bold mx-auto">{shotAtPosition.shipHit.charAt(0).toUpperCase()}</div>;
              }
            } else {
              cellClass += ' bg-gray-300'; // Miss
            }
          } else {
            cellClass += ' hover:bg-gray-100 cursor-pointer'; // Clickable cell
          }
        }
        
        cells.push(
          <div 
            key={`${isMyBoard ? 'my' : 'opp'}-${x}-${y}`}
            className={cellClass}
            onClick={!isMyBoard && isMyTurn ? () => makeMove(x, y) : undefined}
          >
            {content}
          </div>
        );
      }
    }
    
    return cells;
  };

  if (!user) return null;
  
  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl font-semibold">Chargement...</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-xl font-semibold mb-4">Partie introuvable</div>
        <Button onClick={() => router.push('/dashboard')}>Retour au tableau de bord</Button>
      </div>
    );
  }

  // Waiting screen
  if (game.status === 'waiting' && game.players.length < 2) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-center">En attente d'un adversaire...</h1>
        
        <div className="flex flex-col items-center">
          <p className="mb-4">Partagez ce lien avec un ami pour l'inviter à jouer :</p>
          <div className="bg-gray-100 rounded p-3 mb-6 w-full max-w-md text-center">
            {`${window.location.origin}/game/${gameId}`}
          </div>
          
          <Button onClick={() => router.push('/dashboard')}>Retour au tableau de bord</Button>
        </div>
      </div>
    );
  }

  // Join game screen
  if (game.status === 'waiting' && !game.players.some(player => player.user._id === user._id)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Rejoindre la partie ?</h1>
        
        <div className="flex flex-col items-center">
          <p className="mb-4">Voulez-vous rejoindre cette partie ?</p>
          
          <div className="flex gap-4">
            <Button onClick={joinGame}>Rejoindre la partie</Button>
            <Button variant="secondary" onClick={() => router.push('/dashboard')}>Annuler</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">
        {game.status === 'setup' ? 'Placement des navires' :
         game.status === 'active' ? `Partie en cours${isMyTurn ? ' - À votre tour' : ' - Tour de l\'adversaire'}` :
         game.status === 'completed' ? 'Partie terminée' : 'Bataille Navale'}
      </h1>
      
      {game.status === 'completed' && (
        <div className="text-center mb-6">
          <div className={`text-xl font-bold ${game.winner === user._id ? 'text-green-600' : 'text-red-600'}`}>
            {game.winner === user._id ? 'Vous avez gagné !' : 'Vous avez perdu !'}
          </div>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/2">
          <h2 className="text-lg font-semibold mb-2">Mon plateau</h2>
          <div className="grid grid-cols-10 bg-white rounded-lg shadow overflow-hidden">
            {renderCells(true)}
          </div>
        </div>
        
        <div className="w-full md:w-1/2">
          <h2 className="text-lg font-semibold mb-2">
            Plateau de l'adversaire {opponent ? `(${opponent.username})` : ''}
          </h2>
          <div className="grid grid-cols-10 bg-white rounded-lg shadow overflow-hidden">
            {renderCells(false)}
          </div>
        </div>
      </div>
      
      {placingShips && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Placer vos navires</h2>
          <ShipPlacementBoard onPlaceShips={(ships) => {
            setMyShips(ships);
            placeShips();
          }} />
        </div>
      )}
      
      <div className="flex justify-center mt-8">
        <Button 
          variant="secondary" 
          onClick={() => router.push('/dashboard')}
        >
          Retour au tableau de bord
        </Button>
      </div>
    </div>
  );
}
