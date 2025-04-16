import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { placeShips } from '../../features/game/gameSlice';
import { notifyReady } from '../../features/socket/socketService';

const PlacementContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
`;

const Board = styled.div`
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 2px;
  width: 100%;
  max-width: 400px;
  margin: 0 auto 2rem;
`;

const Cell = styled.div`
  aspect-ratio: 1;
  background-color: ${(props) => (props.isShip ? '#3d5a80' : '#e0fbfc')};
  border: 1px solid #98c1d9;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${(props) => (props.isShip ? '#3d5a80' : '#98c1d9')};
  }
`;

const Controls = styled.div`
  margin-bottom: 1.5rem;
  text-align: center;
  
  button {
    margin: 0 0.5rem;
  }
  
  .selected {
    border: 2px solid var(--accent-color);
    transform: scale(1.05);
  }
`;

const ShipItem = styled.button`
  padding: 0.5rem 1rem;
  background: var(--secondary-color);
  border: none;
  border-radius: 5px;
  color: white;
  cursor: pointer;
  margin: 0.5rem;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ShipPlacement = ({ gameId }) => {
  const dispatch = useDispatch();
  
  // Board state
  const [board, setBoard] = useState(Array(10).fill().map(() => Array(10).fill(false)));
  
  // Available ships
  const [availableShips, setAvailableShips] = useState([
    { id: 1, type: 'carrier', size: 5, placed: false },
    { id: 2, type: 'battleship', size: 4, placed: false },
    { id: 3, type: 'cruiser', size: 3, placed: false },
    { id: 4, type: 'submarine', size: 3, placed: false },
    { id: 5, type: 'destroyer', size: 2, placed: false }
  ]);
  
  // Currently selected ship
  const [selectedShip, setSelectedShip] = useState(null);
  
  // Ship orientation
  const [orientation, setOrientation] = useState('horizontal'); // 'horizontal' or 'vertical'
  
  // Placed ships
  const [placedShips, setPlacedShips] = useState([]);
  
  // Select a ship to place
  const selectShip = (ship) => {
    setSelectedShip(ship);
  };
  
  // Toggle orientation
  const toggleOrientation = () => {
    setOrientation(orientation === 'horizontal' ? 'vertical' : 'horizontal');
  };
  
  // Check if placement is valid
  const isValidPlacement = (x, y, size, orientation) => {
    // Check boundaries
    if (orientation === 'horizontal') {
      if (x + size > 10) return false;
    } else {
      if (y + size > 10) return false;
    }
    
    // Check overlapping
    for (let i = 0; i < size; i++) {
      const checkX = orientation === 'horizontal' ? x + i : x;
      const checkY = orientation === 'horizontal' ? y : y + i;
      
      if (board[checkY][checkX]) return false;
    }
    
    return true;
  };
  
  // Handle cell click to place a ship
  const handleCellClick = (x, y) => {
    if (!selectedShip) return;
    
    const ship = availableShips.find(s => s.id === selectedShip.id);
    
    if (ship.placed) return;
    
    if (!isValidPlacement(x, y, ship.size, orientation)) return;
    
    // Create a new board with the placed ship
    const newBoard = [...board];
    const positions = [];
    
    for (let i = 0; i < ship.size; i++) {
      const shipX = orientation === 'horizontal' ? x + i : x;
      const shipY = orientation === 'horizontal' ? y : y + i;
      
      newBoard[shipY][shipX] = true;
      positions.push({ x: shipX, y: shipY, hit: false });
    }
    
    setBoard(newBoard);
    
    // Update available ships
    const updatedAvailableShips = availableShips.map(s => 
      s.id === ship.id ? { ...s, placed: true } : s
    );
    
    setAvailableShips(updatedAvailableShips);
    
    // Add to placed ships
    setPlacedShips([
      ...placedShips, 
      {
        type: ship.type,
        size: ship.size,
        positions: positions,
        sunk: false
      }
    ]);
    
    // Clear selected ship
    setSelectedShip(null);
  };
  
  // Reset the board and start over
  const resetBoard = () => {
    setBoard(Array(10).fill().map(() => Array(10).fill(false)));
    setAvailableShips(availableShips.map(s => ({ ...s, placed: false })));
    setSelectedShip(null);
    setPlacedShips([]);
  };
  
  // Submit ship placements
  const submitPlacement = () => {
    // Check if all ships are placed
    if (availableShips.some(s => !s.placed)) {
      alert('Veuillez placer tous les navires avant de continuer.');
      return;
    }
    
    // Dispatch the placement action
    dispatch(placeShips({ gameId, ships: placedShips }));
    
    // Notify opponent ready
    notifyReady(gameId);
  };
  
  return (
    <PlacementContainer>
      <h3>Placez vos navires</h3>
      
      <Controls>
        {availableShips.map((ship) => (
          <ShipItem
            key={ship.id}
            className={selectedShip?.id === ship.id ? 'selected' : ''}
            disabled={ship.placed}
            onClick={() => selectShip(ship)}
          >
            {ship.type} ({ship.size})
          </ShipItem>
        ))}
        
        <div>
          <button className="btn btn-secondary" onClick={toggleOrientation}>
            Orientation: {orientation === 'horizontal' ? 'Horizontale' : 'Verticale'}
          </button>
          <button className="btn btn-accent" onClick={resetBoard}>
            Réinitialiser
          </button>
        </div>
      </Controls>
      
      <Board>
        {board.map((row, y) => (
          row.map((isShip, x) => (
            <Cell
              key={`${x}-${y}`}
              data-x={x}
              data-y={y}
              isShip={isShip}
              onClick={() => handleCellClick(x, y)}
            />
          ))
        ))}
      </Board>
      
      <div className="text-center">
        <button 
          className="btn btn-primary"
          disabled={availableShips.some(s => !s.placed)}
          onClick={submitPlacement}
        >
          Confirmer le placement
        </button>
      </div>
    </PlacementContainer>
  );
};

ShipPlacement.propTypes = {
  gameId: PropTypes.string.isRequired
};

export default ShipPlacement;
