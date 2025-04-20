'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import axios from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import { getSocket, joinMatchmaking, cancelMatchmaking } from '@/lib/socket';
import ConfirmationModal from '@/components/ui/ConfirmationModal'; // Import ConfirmationModal

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchmakingStatus, setMatchmakingStatus] = useState('idle');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // State for delete modal
  const [gameToDeleteId, setGameToDeleteId] = useState(null); // State for game ID to delete
  const router = useRouter();

  useEffect(() => {
    if (!user && !authLoading) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchGames();
      setupSocketListeners();
    }
    
    // Cleanup function
    return () => {
      cleanupSocketListeners();
    };
  }, [user, authLoading, router]);

  const setupSocketListeners = () => {
    const socket = getSocket();
    if (!socket) return;

    // Remove existing listeners to prevent duplicates
    cleanupSocketListeners();

    socket.on('matchmaking:status', (status) => {
      console.log('Matchmaking status received:', status);
      if (status.success) {
        if (status.matched) {
          setMatchmakingStatus('matched');
          // Toast is handled by the 'matchmaking:matched' listener now
        } else if (status.message === 'Ajouté à la file d\'attente') {
          setMatchmakingStatus('searching');
          toast.success('Recherche d\'un adversaire...');
        } else if (status.removed) { // Check if removal was successful
          setMatchmakingStatus('idle');
          toast('Recherche annulée'); // Show toast on confirmation
        } else if (!status.removed && status.message === 'N\'était pas dans la file d\'attente') {
          // If already removed or not in queue, ensure state is idle
          setMatchmakingStatus('idle');
        }
      } else {
        setMatchmakingStatus('idle'); // Go back to idle on error
        toast.error(status.message);
      }
    });

    socket.on('matchmaking:matched', (data) => {
      console.log('Matchmaking matched received:', data);
      setMatchmakingStatus('matched'); // Keep this for potential immediate feedback
      toast.success('Partie trouvée ! Redirection...');
      router.push(`/game/${data.gameId}`);
    });
  };

  const cleanupSocketListeners = () => {
    const socket = getSocket();
    if (socket) {
      socket.off('matchmaking:status');
      socket.off('matchmaking:matched');
    }
  };

  const fetchGames = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/games');
      setGames(response.data);
    } catch (error) {
      console.error('Error fetching games:', error);
      toast.error('Erreur lors du chargement des parties');
    } finally {
      setLoading(false);
    }
  };

  const createGame = async () => {
    try {
      const response = await axios.post('/games');
      toast.success('Partie créée avec succès !');
      router.push(`/game/${response.data._id}`);
    } catch (error) {
      console.error('Error creating game:', error);
      toast.error('Erreur lors de la création de la partie');
    }
  };

  const handleJoinMatchmaking = () => {
    // Optimistically set to searching, will be confirmed by socket event
    setMatchmakingStatus('searching');
    const success = joinMatchmaking();
    if (!success) {
      // If immediate failure (e.g., no socket), revert state
      setMatchmakingStatus('idle');
    }
    // Don't show toast here, wait for 'matchmaking:status' event
  };

  const handleCancelMatchmaking = () => {
    // Just emit the cancel event. The UI update will happen
    // when the 'matchmaking:status' event with { removed: true } is received.
    const success = cancelMatchmaking();
    if (!success) {
      // Handle potential immediate failure (e.g., no socket)
      toast.error('Erreur de connexion pour annuler la recherche');
    }
    // Do not change matchmakingStatus here or show toast optimistically
  };

  // Function to initiate game deletion (opens modal)
  const handleDeleteGame = (gameId) => {
    setGameToDeleteId(gameId);
    setShowDeleteConfirm(true);
  };

  // Function to confirm and execute game deletion
  const confirmDeleteGame = async () => {
    if (!gameToDeleteId) return;

    try {
      await axios.delete(`/games/${gameToDeleteId}`);
      toast.success('Partie supprimée avec succès');
      // Update local state to remove the game
      setGames(prevGames => prevGames.filter(g => g._id !== gameToDeleteId));
    } catch (error) {
      console.error('Error deleting game:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setShowDeleteConfirm(false);
      setGameToDeleteId(null);
    }
  };

  return (
    // Remove container and padding classes, handled by layout.js
    <div className="mx-auto text-black">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mes Parties</h1>
        <div className="space-x-4">
          {matchmakingStatus === 'idle' ? (
            <>
              <Button variant="primary" className="my-4" onClick={handleJoinMatchmaking}>
                Matchmaking Rapide
              </Button>
              <Button onClick={createGame}>Nouvelle Partie</Button>
            </>
          ) : matchmakingStatus === 'searching' ? (
            <Button variant="danger" onClick={handleCancelMatchmaking} loading={false}> {/* Ensure loading state is managed if needed */}
              Annuler la recherche
            </Button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Chargement...</div>
      ) : games.length === 0 ? (
        <div className="text-center py-8">
          <p className="mb-4">Vous n'avez aucune partie en cours.</p>
          <Button onClick={createGame}>Créer une nouvelle partie</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <div key={game._id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col"> {/* Added flex flex-col */}
              <div className="p-6 flex-grow"> {/* Added flex-grow */}
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">
                    Partie #{game._id.substring(0, 8)}
                  </h2>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {game.status === 'waiting'
                      ? 'En attente'
                      : game.status === 'setup'
                      ? 'Configuration'
                      : game.status === 'active'
                      ? 'Active'
                      : game.status === 'paused'
                      ? 'En pause'
                      : 'Terminée'}
                  </span>
                </div>
                <div className="mb-4">
                  <p>
                    <span className="font-medium">Créée le:</span>{' '}
                    {new Date(game.createdAt).toLocaleDateString()}
                  </p>
                  <p>
                    <span className="font-medium">Joueurs:</span> {game.players.length}/2
                    {/* Display player names if available */}
                    {game.players.map(p => p.user?.username).join(', ')}
                  </p>
                </div>
              </div>
              {/* Buttons at the bottom */}
              <div className="p-4 bg-gray-50 border-t flex gap-2 justify-end"> {/* Changed padding and added flex */}
                <Link href={`/game/${game._id}`} className="flex-grow"> {/* Link takes full width */}
                  <Button className="w-full"> {/* Button takes full width */}
                    {game.status === 'waiting' && game.players.length < 2
                      ? 'Rejoindre'
                      : ['setup', 'active', 'paused'].includes(game.status)
                      ? 'Continuer'
                      : 'Voir partie'} {/* Changed label for completed/abandoned */}
                  </Button>
                </Link>
                {/* Add Delete Button */}
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteGame(game._id)}
                  title="Supprimer la partie" // Accessibility
                >
                  {/* Simple Icon or Text */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <ConfirmationModal
          title="Supprimer la partie"
          message="Êtes-vous sûr de vouloir supprimer cette partie ? Cette action est irréversible."
          confirmText="Supprimer"
          cancelText="Annuler"
          onConfirm={confirmDeleteGame}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setGameToDeleteId(null);
          }}
          variant="danger"
        />
      )}
    </div>
  );
}
