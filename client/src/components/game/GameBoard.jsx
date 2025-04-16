import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { makeMove } from '../../features/game/gameSlice';
import { notifyMove } from '../../features/socket/socketService';

const BoardContainer = styled.div`
  margin-bottom: 2rem;
  
  h3 {
    margin-bottom: 1rem;
    text-align: center;
  }
`;

const Board = styled.div`
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 2px;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
`;

const Cell = styled.div`
  aspect-ratio: 1;
  background-color: ${(props) => {
    if (props.value === 'ship') return '#3d5a80';
    if (props.value === 'hit') return '#ee6c4d';
    if (props.value === 'miss') return '#293241';
    if (props.value === 'sunk') return '#e71d36';
    return '#e0fbfc';
  }};
  border: 1px solid #98c1d9;
  cursor: ${(props) => (props.interactive && !props.value ? 'pointer' : 'default')};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: ${(props) => (props.interactive && !props.value ? '#98c1d9' : '')};
  }
`;

const GameBoard = ({ 
  gameId, 
  board, 
  isPlayerBoard, 
  isPlayerTurn,
  boardSize = { width: 10, height: 10 }
}) => {
  const dispatch = useDispatch();
  
  useEffect(() => {
    // Setup board rendering logic
  }, [board]);
  
  const handleCellClick = (x, y) => {
    // Only allow clicking on opponent's board and when it's player's turn
    if (isPlayerBoard || !isPlayerTurn) return;
    
    // Only allow clicking on cells that haven't been targeted yet
    if (board[y][x] !== null) return;
    
    // Dispatch action to make move
    dispatch(makeMove({ gameId, x, y }));
    
    // Notify opponent via socket
    notifyMove(gameId, x, y);
  };
  
  return (
    <BoardContainer>
      <h3>{isPlayerBoard ? 'Votre flotte' : 'Flotte ennemie'}</h3>
      <Board>
        {Array.from({ length: boardSize.height }).map((_, y) => (
          Array.from({ length: boardSize.width }).map((_, x) => (
            <Cell
              key={`${x}-${y}`}
              data-x={x}
              data-y={y}
              value={board[y][x]}
              interactive={!isPlayerBoard && isPlayerTurn}
              onClick={() => handleCellClick(x, y)}
            >
              {/* Visual indicators */}
              {board[y][x] === 'hit' && '💥'}
              {board[y][x] === 'miss' && '•'}
              {board[y][x] === 'sunk' && '🔥'}
            </Cell>
          ))
        ))}
      </Board>
    </BoardContainer>
  );
};

GameBoard.propTypes = {
  gameId: PropTypes.string.isRequired,
  board: PropTypes.array.isRequired,
  isPlayerBoard: PropTypes.bool.isRequired,
  isPlayerTurn: PropTypes.bool.isRequired,
  boardSize: PropTypes.shape({
    width: PropTypes.number,
    height: PropTypes.number
  })
};

export default GameBoard;
