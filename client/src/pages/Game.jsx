import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import GameBoard from '../components/game/GameBoard';
import ShipPlacement from '../components/game/ShipPlacement';
import ChatBox from '../components/chat/ChatBox';
import { getGameById, resetGame, saveGame, resumeGame } from '../features/game/gameSlice';
import { getGameMessages } from '../features/chat/chatSlice';
import { joinGameRoom, leaveGameRoom } from '../features/socket/socketService';
import { FaPause, FaPlay, FaFlag } from 'react-icons/fa';

const GameContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  
  @media (min-width: 1200px) {
    grid-template-columns: 3fr 1fr;
  }
  
  .game-info {
    padding: 1rem;
    background-color: white;
    border-radius: 10px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    margin-bottom: 1rem;
  }
  
  .game-status {
    text-align: center;
    margin-bottom: 1rem;
    font-size: 1.2rem;
    font-weight: bold;
  }
  
  .game-actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .boards-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
`;

const Game = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [waitingMessage, setWaitingMessage] = useState('');
  const [waitingTime, setWaitingTime] = useState(0);
  
  const { activeGame, gameState, playerBoard, opponentBoard, isPlayerTurn, loading } = useSelector(
    (state) => state.game
  );
  const { messages } = useSelector((state) => state.chat);
  const { user } = useSelector((state) => state.auth);
  
  // Status message based on game state
  const getStatusMessage = () => {
    switch (gameState) {
      case 'waiting':
        return 'En attente d\'un adversaire...';
      case 'setup':
        return 'Placez vos navires sur le plateau';
      case 'active':
        return isPlayerTurn ? 'À vous de jouer !' : 'Tour de l\'adversaire';
      case 'paused':
        return 'Partie en pause';
      case 'completed':
        if (activeGame && activeGame.winner && activeGame.winner === user._id) {
          return 'Victoire ! Vous avez gagné !';
        }
        return 'Défaite ! Vous avez perdu !';
      default:
        return '';
    }
  };
  
  useEffect(() => {
    document.title = 'Bataille Navale - Partie';
    
    dispatch(getGameById(id));
    dispatch(getGameMessages(id));
    
    // Join socket room for this game
    joinGameRoom(id);
    
    // Clean up when leaving
    return () => {
      dispatch(resetGame());
      leaveGameRoom(id);
    };
  }, [dispatch, id]);
  
  useEffect(() => {
    // Timer for waiting message
    if (gameState === 'waiting') {
      const interval = setInterval(() => {
        setWaitingTime((prevTime) => prevTime + 1);
        
        // Update waiting message
        if (waitingTime % 10 === 0) {
          setWaitingMessage('En attente d\'un adversaire...');
        } else if (waitingTime % 10 === 3) {
          setWaitingMessage('En attente d\'un adversaire..');
        } else if (waitingTime % 10 === 6) {
          setWaitingMessage('En attente d\'un adversaire.');
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [gameState, waitingTime]);
  
  const handleTogglePause = () => {
    if (gameState === 'active') {
      dispatch(saveGame(id));
    } else if (gameState === 'paused') {
      dispatch(resumeGame(id));
    }
  };
  
  const handleSurrender = () => {
    if (confirm('Êtes-vous sûr de vouloir abandonner cette partie ?')) {
      // TODO: Implement surrender logic
      navigate('/games');
    }
  };
  
  if (loading) {
    return <div className="loading">Chargement...</div>;
  }
  
  return (
    <GameContainer>
      <div>
        <div className="game-info">
          <div className="game-status">{getStatusMessage()}</div>
          
          {['active', 'paused'].includes(gameState) && (
            <div className="game-actions">
              <button 
                className="btn btn-secondary" 
                onClick={handleTogglePause}
              >
                {gameState === 'active' ? <><FaPause /> Pause</> : <><FaPlay /> Reprendre</>}
              </button>
              <button 
                className="btn btn-accent" 
                onClick={handleSurrender}
              >
                <FaFlag /> Abandonner
              </button>
            </div>
          )}
        </div>
        
        {gameState === 'setup' ? (
          <ShipPlacement gameId={id} />
        ) : (
          <div className="boards-container">
            <GameBoard 
              gameId={id}
              board={playerBoard}
              isPlayerBoard={true}
              isPlayerTurn={isPlayerTurn}
            />
            
            <GameBoard 
              gameId={id}
              board={opponentBoard}
              isPlayerBoard={false}
              isPlayerTurn={isPlayerTurn}
            />
          </div>
        )}
      </div>
      
      {activeGame && activeGame.status !== 'waiting' && (
        <ChatBox gameId={id} messages={messages} />
      )}
    </GameContainer>
  );
};

export default Game;
