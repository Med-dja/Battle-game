'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const [gameHistory, setGameHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!user && !authLoading) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchGameHistory();
    }
  }, [user, authLoading, router]);

  const fetchGameHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/leaderboard/history');
      setGameHistory(response.data);
    } catch (error) {
      console.error('Error fetching game history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="flex items-center">
          <div className="h-20 w-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold mr-6">
            {user.avatar ? (
              <img
                className="h-20 w-20 rounded-full"
                src={user.avatar}
                alt={user.username}
              />
            ) : (
              user.username.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user.username}</h1>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Statistiques</h2>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Parties jouées:</span> {user.stats?.gamesPlayed || 0}
            </p>
            <p>
              <span className="font-medium">Victoires:</span> {user.stats?.wins || 0}
            </p>
            <p>
              <span className="font-medium">Défaites:</span> {user.stats?.losses || 0}
            </p>
            <p>
              <span className="font-medium">Ratio de victoire:</span>{' '}
              {user.stats?.gamesPlayed
                ? ((user.stats.wins / user.stats.gamesPlayed) * 100).toFixed(1) + '%'
                : '0%'}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Classement</h2>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Rang global:</span> {user.stats?.rank || 'N/A'}
            </p>
            <p>
              <span className="font-medium">Points:</span> {user.stats?.points || 0}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Compte</h2>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Membre depuis:</span>{' '}
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
            <p>
              <span className="font-medium">Dernière connexion:</span>{' '}
              {new Date(user.lastActive).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <h2 className="text-lg font-semibold px-6 py-4 border-b">Historique des parties</h2>

        {loading ? (
          <div className="text-center py-8">Chargement...</div>
        ) : gameHistory.length === 0 ? (
          <div className="text-center py-8">Aucune partie jouée.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Adversaire
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Résultat
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Durée
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {gameHistory.map((game) => (
                  <tr key={game.gameId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(game.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {game.opponent}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          game.result === 'win'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {game.result === 'win' ? 'Victoire' : 'Défaite'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Math.floor(game.duration / 60)}m {game.duration % 60}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
