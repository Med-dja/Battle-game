'use client';

import { useState, useEffect } from 'react';
import axios from '@/lib/axios';

export default function Leaderboard() {
  const [leaderboardType, setLeaderboardType] = useState('global');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard(leaderboardType);
  }, [leaderboardType]);

  const fetchLeaderboard = async (type) => {
    try {
      setLoading(true);
      const response = await axios.get(`/leaderboard/${type}`);
      setLeaderboard(response.data);
    } catch (error) {
      console.error(`Error fetching ${type} leaderboard:`, error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-900">Classement</h1> {/* Ensure title is visible */}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="flex border-b">
          <button
            className={`px-4 py-3 text-sm font-medium ${
              leaderboardType === 'global' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700' : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setLeaderboardType('global')}
          >
            Classement Global
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${
              leaderboardType === 'weekly' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700' : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setLeaderboardType('weekly')}
          >
            Classement Hebdomadaire
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${
              leaderboardType === 'daily' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700' : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setLeaderboardType('daily')}
          >
            Classement Quotidien
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-700">Chargement...</div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-8 text-gray-700">Aucune donnée disponible pour ce classement.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Rang
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Joueur
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Victoires
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Parties
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Points
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaderboard.map((entry, index) => {
                const player = leaderboardType === 'global' ? entry : entry.user;
                const stats = leaderboardType === 'global' ? entry.stats : entry.stats;

                // Ensure player and stats exist before trying to access properties
                if (!player || !stats) return null;

                return (
                  <tr key={player._id || index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"> {/* Changed text color */}
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                          {player.avatar ? (
                            <img
                              className="h-8 w-8 rounded-full"
                              src={player.avatar}
                              alt=""
                            />
                          ) : (
                            <span className="text-sm">{player.username?.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="text-sm font-medium text-gray-900"> {/* Ensure text color */}
                          {player.username}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"> {/* Changed text color */}
                      {stats?.wins || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"> {/* Changed text color */}
                      {stats?.gamesPlayed || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"> {/* Changed text color */}
                      {stats?.points || 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
