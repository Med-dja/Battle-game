'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import axios from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import { getSocket, joinMatchmaking, cancelMatchmaking } from '@/lib/socket';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchmakingStatus, setMatchmakingStatus] = useState('idle');
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

  return (
    // Remove container and padding classes, handled by layout.js
    <div className="mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mes Parties</h1>
        <div className="space-x-4">
          {matchmakingStatus === 'idle' ? (
            <>
              <Button variant="primary" onClick={handleJoinMatchmaking}>
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
            <div key={game._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
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
                  </p>
                </div>
                <Link href={`/game/${game._id}`}>
                  <Button className="w-full">
                    {game.status === 'waiting'
                      ? 'Rejoindre'
                      : 'Continuer la partie'}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
