import React, { useState, useEffect } from 'react';
import { FaHistory } from 'react-icons/fa';
import styled from 'styled-components';
import axios from 'axios';

const LeaderboardContainer = styled.div`
  // Add your styles here
`;

const Leaderboard = () => {
  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState([]);
  const [dailyLeaderboard, setDailyLeaderboard] = useState([]);
  const [playerHistory, setPlayerHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('global');
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Fetch leaderboard data
    const fetchLeaderboardData = async () => {
      try {
        const [globalRes, weeklyRes, dailyRes] = await Promise.all([
          axios.get('/api/leaderboard/global'),
          axios.get('/api/leaderboard/weekly'),
          axios.get('/api/leaderboard/daily'),
        ]);
        setGlobalLeaderboard(globalRes.data);
        setWeeklyLeaderboard(weeklyRes.data);
        setDailyLeaderboard(dailyRes.data);
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, []);

  useEffect(() => {
    // Fetch player history if authenticated
    const fetchPlayerHistory = async () => {
      if (isAuthenticated) {
        try {
          const res = await axios.get('/api/player/history');
          setPlayerHistory(res.data);
        } catch (error) {
          console.error('Error fetching player history:', error);
        }
      }
    };

    fetchPlayerHistory();
  }, [isAuthenticated]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const formatDate = (date) => {
    // Format date as needed
    return new Date(date).toLocaleDateString();
  };

  const formatDuration = (duration) => {
    // Format duration as needed
    return `${Math.floor(duration / 60)}m ${duration % 60}s`;
  };

  const renderLeaderboardTable = (leaderboard) => {
    if (loading) {
      return <div>Chargement du classement...</div>;
    }

    if (!leaderboard || leaderboard.length === 0) {
      return <div>Aucun classement disponible.</div>;
    }

    return (
      <table>
        <thead>
          <tr>
            <th>Rang</th>
            <th>Joueur</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((player, index) => (
            <tr key={player.id}>
              <td>{index + 1}</td>
              <td>{player.name}</td>
              <td>{player.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderPlayerHistory = () => {
    if (loading) {
      return <div>Chargement de l'historique...</div>;
    }
    
    if (!playerHistory || playerHistory.length === 0) {
      return <div>Aucun historique de partie disponible.</div>;
    }
    
    return (
      <div className="history-list">
        {playerHistory.map((game) => (
          <div key={game.gameId} className="history-card">
            <div className="history-header">
              <span className={`history-result ${game.result}`}>
                {game.result === 'win' ? 'Victoire' : 'Défaite'}
              </span>
              <span className="history-date">{formatDate(game.date)}</span>
            </div>
            <div className="history-opponent">
              Adversaire: {game.opponent}
            </div>
            <div className="history-details">
              Durée: {formatDuration(game.duration)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <LeaderboardContainer>
      <h2>Classement des joueurs</h2>
      
      <div className="tabs">
        <div 
          className={`tab ${activeTab === 'global' ? 'active' : ''}`}
          onClick={() => handleTabChange('global')}
        >
          Classement Global
        </div>
        <div 
          className={`tab ${activeTab === 'weekly' ? 'active' : ''}`}
          onClick={() => handleTabChange('weekly')}
        >
          Classement Hebdomadaire
        </div>
        <div 
          className={`tab ${activeTab === 'daily' ? 'active' : ''}`}
          onClick={() => handleTabChange('daily')}
        >
          Classement Quotidien
        </div>
        {isAuthenticated && (
          <div 
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => handleTabChange('history')}
          >
            <FaHistory /> Mon Historique
          </div>
        )}
      </div>
      
      {activeTab === 'global' && renderLeaderboardTable(globalLeaderboard)}
      {activeTab === 'weekly' && renderLeaderboardTable(weeklyLeaderboard)}
      {activeTab === 'daily' && renderLeaderboardTable(dailyLeaderboard)}
      {activeTab === 'history' && isAuthenticated && renderPlayerHistory()}
      
      {!isAuthenticated && activeTab === 'history' && (
        <div>
          <p>Veuillez vous connecter pour voir votre historique de parties.</p>
        </div>
      )}
    </LeaderboardContainer>
  );
};

export default Leaderboard;