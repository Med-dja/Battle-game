import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { FaPlus, FaGamepad, FaUserFriends, FaSearch } from 'react-icons/fa';
import { getMyGames, createGame } from '../features/game/gameSlice';
import { joinQueue, cancelQueue } from '../features/matchmaking/matchmakingSlice';

const GamesContainer = styled.div`
  h2 {
    margin-bottom: 1.5rem;
  }
  
  .games-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    
    @media (max-width: 768px) {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }
  }
  
  .games-actions {
    display: flex;
    gap: 1rem;
    
    @media (max-width: 768px) {
      width: 100%;
      justify-content: space-between;
    }
  }
  
  .games-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }
`;

const GameCard = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  
  .game-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .game-id {
    font-size: 0.8rem;
    color: #777;
  }
  
  .game-status {
    padding: 0.25rem 0.75rem;
    border-radius: 15px;
    font-size: 0.8rem;
    font-weight: bold;
    
    &.waiting {
      background-color: #e9c46a;
      color: #774e00;
    }
    
    &.setup {
      background-color: #4cc9f0;
      color: #05668d;
    }
    
    &.active {
      background-color: #52b788;
      color: #081c15;
    }
    
    &.paused {
      background-color: #8d99ae;
      color: #2b2d42;
    }
  }
  
  .game-details {
    margin-bottom: 1rem;
    flex-grow: 1;
  }
  
  .game-players {
    margin-bottom: 0.5rem;
  }
  
  .game-time {
    font-size: 0.9rem;
    color: #555;
  }
  
  .game-actions {
    text-align: center;
  }
`;

const MatchmakingCard = styled.div`
  background-color: var(--primary-color);
  color: white;
  border-radius: 10px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .matchmaking-info {
    h3 {
      margin-bottom: 0.5rem;
    }
    p {
      opacity: 0.9;
    }
  }
  
  .matchmaking-time {
    font-size: 1.2rem;
    font-weight: bold;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  
  h3 {
    margin-bottom: 1rem;
  }
  
  p {
    margin-bottom: 1.5rem;
    color: #555;
  }
`;

const GamesList = () => {
  const dispatch = useDispatch();
  const { games, loading } = useSelector((state) => state.game);
  const { inQueue, queueTime, message } = useSelector((state) => state.matchmaking);
  
  useEffect(() => {
    document.title = 'Bataille Navale - Mes Parties';
    dispatch(getMyGames());
  }, [dispatch]);
  
  // Format the queue time (MM:SS)
  const formatQueueTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Handle creating a new game
  const handleCreateGame = () => {
    dispatch(createGame());
  };
  
  // Handle joining/cancelling matchmaking
  const handleMatchmaking = () => {
    if (inQueue) {
      dispatch(cancelQueue());
    } else {
      dispatch(joinQueue());
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  return (
    <GamesContainer>
      {inQueue && (
        <MatchmakingCard>
          <div className="matchmaking-info">
            <h3>Matchmaking en cours...</h3>
            <p>{message}</p>
          </div>
          <div className="matchmaking-time">
            {formatQueueTime(queueTime)}
          </div>
          <button className="btn btn-accent" onClick={handleMatchmaking}>
            Annuler
          </button>
        </MatchmakingCard>
      )}
      
      <div className="games-header">
        <h2>Mes Parties</h2>
        <div className="games-actions">
          <button className="btn btn-primary" onClick={handleCreateGame}>
            <FaPlus /> Nouvelle Partie
          </button>
          {!inQueue && (
            <button className="btn btn-secondary" onClick={handleMatchmaking}>
              <FaSearch /> Matchmaking
            </button>
          )}
        </div>
      </div>
      
      {loading ? (
        <div>Chargement...</div>
      ) : games.length === 0 ? (
        <EmptyState>
          <h3>Aucune partie active</h3>
          <p>Vous n'avez pas de parties en cours. Créez une nouvelle partie ou rejoignez le matchmaking.</p>
          <button className="btn btn-primary" onClick={handleCreateGame}>
            <FaGamepad /> Créer une partie
          </button>
        </EmptyState>
      ) : (
        <div className="games-list">
          {games.map((game) => (
            <GameCard key={game._id}>
              <div className="game-header">
                <div className="game-id">ID: {game._id.substring(0, 8)}...</div>
                <div className={`game-status ${game.status}`}>
                  {game.status === 'waiting' && 'En attente'}
                  {game.status === 'setup' && 'Préparation'}
                  {game.status === 'active' && 'En cours'}
                  {game.status === 'paused' && 'En pause'}
                </div>
              </div>
              
              <div className="game-details">
                <div className="game-players">
                  <FaUserFriends /> {game.players.length} / 2 joueurs
                </div>
                <div className="game-time">
                  Créée le: {formatDate(game.createdAt)}
                </div>
              </div>
              
              <div className="game-actions">
                <Link to={`/games/${game._id}`} className="btn btn-primary">
                  {game.status === 'waiting' ? 'Rejoindre' : 'Continuer'}
                </Link>
              </div>
            </GameCard>
          ))}
        </div>
      )}
    </GamesContainer>
  );
};

export default GamesList;
