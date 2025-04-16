import PropTypes from 'prop-types';
import styled from 'styled-components';
import { FaPlay, FaPause, FaFlag, FaClock } from 'react-icons/fa';

const StatusContainer = styled.div`
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  
  .status-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    
    .game-id {
      font-size: 0.8rem;
      color: #777;
    }
    
    .game-status {
      padding: 0.25rem 0.75rem;
      border-radius: 15px;
      font-size: 0.9rem;
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
      
      &.completed {
        background-color: #3d5a80;
        color: white;
      }
    }
  }
  
  .status-message {
    text-align: center;
    font-size: 1.2rem;
    font-weight: bold;
    margin-bottom: 1rem;
  }
  
  .timer {
    text-align: center;
    font-size: 1.1rem;
    margin-bottom: 1rem;
    
    .clock-icon {
      margin-right: 0.5rem;
    }
  }
  
  .actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
  }
`;

const GameStatus = ({ 
  gameId, 
  gameStatus, 
  statusMessage, 
  isPlayerTurn,
  onPause, 
  onResume, 
  onSurrender 
}) => {
  // Format the game ID for display
  const formattedGameId = gameId ? `ID: ${gameId.substring(0, 8)}...` : '';
  
  // Get status label
  const getStatusLabel = (status) => {
    switch (status) {
      case 'waiting':
        return 'En attente';
      case 'setup':
        return 'Préparation';
      case 'active':
        return 'En cours';
      case 'paused':
        return 'En pause';
      case 'completed':
        return 'Terminée';
      default:
        return status;
    }
  };
  
  return (
    <StatusContainer>
      <div className="status-header">
        <div className="game-id">{formattedGameId}</div>
        <div className={`game-status ${gameStatus}`}>
          {getStatusLabel(gameStatus)}
        </div>
      </div>
      
      <div className="status-message">
        {statusMessage}
      </div>
      
      {['active', 'paused'].includes(gameStatus) && (
        <div className="actions">
          {gameStatus === 'active' ? (
            <button className="btn btn-secondary" onClick={onPause} disabled={!isPlayerTurn}>
              <FaPause /> Pause
            </button>
          ) : (
            <button className="btn btn-secondary" onClick={onResume}>
              <FaPlay /> Reprendre
            </button>
          )}
          
          <button className="btn btn-accent" onClick={onSurrender}>
            <FaFlag /> Abandonner
          </button>
        </div>
      )}
    </StatusContainer>
  );
};

GameStatus.propTypes = {
  gameId: PropTypes.string.isRequired,
  gameStatus: PropTypes.string.isRequired,
  statusMessage: PropTypes.string.isRequired,
  isPlayerTurn: PropTypes.bool,
  onPause: PropTypes.func,
  onResume: PropTypes.func,
  onSurrender: PropTypes.func
};

export default GameStatus;
