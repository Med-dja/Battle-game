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
          toast.success('Partie trouvée !');
          fetchGames();
        } else {
          setMatchmakingStatus('searching');
          toast.success('Recherche d\'un adversaire...');
        }
      } else {
        setMatchmakingStatus('idle');
        toast.error(status.message);
      }
    });

    socket.on('matchmaking:matched', (data) => {
      console.log('Matchmaking matched received:', data);
      setMatchmakingStatus('matched');
      toast.success('Partie trouvée !');
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
    setMatchmakingStatus('searching');
    const success = joinMatchmaking();
    if (!success) {
      setMatchmakingStatus('idle');
    }
  };

  const handleCancelMatchmaking = () => {
    const success = cancelMatchmaking();
    if (success) {
      setMatchmakingStatus('idle');
      toast.info('Recherche annulée');
    } else {
      toast.error('Erreur lors de l\'annulation de la recherche');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
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
            <Button variant="danger" onClick={handleCancelMatchmaking}>
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
