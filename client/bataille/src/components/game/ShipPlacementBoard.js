'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

const SHIP_TYPES = [
  { type: 'carrier', name: 'Porte-avions', size: 5, color: 'bg-blue-600' },
  { type: 'battleship', name: 'Cuirassé', size: 4, color: 'bg-green-600' },
  { type: 'cruiser', name: 'Croiseur', size: 3, color: 'bg-yellow-600' },
  { type: 'submarine', name: 'Sous-marin', size: 3, color: 'bg-purple-600' },
  { type: 'destroyer', name: 'Destroyer', size: 2, color: 'bg-red-600' }
];

export default function ShipPlacementBoard({ onPlaceShips, boardSize = 10 }) {
  const [selectedShipType, setSelectedShipType] = useState(SHIP_TYPES[0].type);
  const [orientation, setOrientation] = useState('horizontal');
  const [placedShips, setPlacedShips] = useState([]);
  const [hoveredCells, setHoveredCells] = useState([]);
  const [placementError, setPlacementError] = useState(null);
  const [readyToConfirm, setReadyToConfirm] = useState(false);
  
  // Check if all ships are placed
  useEffect(() => {
    setReadyToConfirm(placedShips.length === SHIP_TYPES.length);
  }, [placedShips]);
  
  const getSelectedShip = () => SHIP_TYPES.find(ship => ship.type === selectedShipType);
  const getShipColor = (shipType) => SHIP_TYPES.find(ship => ship.type === shipType)?.color || 'bg-blue-500';
  
  const handleCellHover = (x, y) => {
    setPlacementError(null);
    const ship = getSelectedShip();
    if (!ship) return;
    
    const cells = [];
    
    for (let i = 0; i < ship.size; i++) {
      const newX = orientation === 'horizontal' ? x + i : x;
      const newY = orientation === 'vertical' ? y + i : y;
      
      // Check if out of bounds
      if (newX >= boardSize || newY >= boardSize) {
        setHoveredCells([]);
        setPlacementError(`Le navire dépasse les limites du plateau`);
        return;
      }
      
      cells.push({ x: newX, y: newY });
    }
    
    // Check for collision with placed ships
    const hasCollision = cells.some(cell => 
      placedShips.some(ship => 
        ship.positions.some(pos => pos.x === cell.x && pos.y === cell.y)
      )
    );
    
    if (hasCollision) {
      setHoveredCells([]);
      setPlacementError(`Les navires ne peuvent pas se chevaucher`);
      return;
    }
    
    setHoveredCells(cells);
  };
  
  const handleCellClick = (x, y) => {
    if (hoveredCells.length === 0) return;
    
    const ship = getSelectedShip();
    
    // Create ship object
    const newShip = {
      type: ship.type,
      size: ship.size,
      positions: hoveredCells.map(cell => ({
        x: cell.x,
        y: cell.y,
        hit: false
      })),
      sunk: false
    };
    
    // Remove any existing ship of the same type
    const filteredShips = placedShips.filter(s => s.type !== ship.type);
    
    // Add new ship
    setPlacedShips([...filteredShips, newShip]);
    toast.success(`${ship.name} placé!`);
    
    // Auto-select next unplaced ship
    const placedTypes = [...filteredShips, newShip].map(s => s.type);
    const nextUnplacedShip = SHIP_TYPES.find(ship => !placedTypes.includes(ship.type));
    if (nextUnplacedShip) {
      setSelectedShipType(nextUnplacedShip.type);
    }
    
    // Clear hover state
    setHoveredCells([]);
  };
  
  const handleRotate = () => {
    setOrientation(orientation === 'horizontal' ? 'vertical' : 'horizontal');
    setHoveredCells([]); // Clear hover when rotating
    setPlacementError(null);
  };
  
  const handleReset = () => {
    setPlacedShips([]);
    setSelectedShipType(SHIP_TYPES[0].type);
    setHoveredCells([]);
    setPlacementError(null);
    setReadyToConfirm(false);
    toast.info('Placement réinitialisé');
  };
  
  const handleRandomPlacement = () => {
    // Auto-place all ships randomly
    const newPlacedShips = [];
    
    // Try to place each ship type
    for (const shipType of SHIP_TYPES) {
      let placed = false;
      let attemptCount = 0;
      const maxAttempts = 100; // Avoid infinite loop
      
      while (!placed && attemptCount < maxAttempts) {
        attemptCount++;
        // Random orientation
        const isHorizontal = Math.random() > 0.5;
        
        // Random starting position (accounting for ship size)
        const maxX = isHorizontal ? boardSize - shipType.size : boardSize - 1;
        const maxY = isHorizontal ? boardSize - 1 : boardSize - shipType.size;
        
        const x = Math.floor(Math.random() * (maxX + 1));
        const y = Math.floor(Math.random() * (maxY + 1));
        
        // Generate positions
        const positions = [];
        for (let i = 0; i < shipType.size; i++) {
          positions.push({
            x: isHorizontal ? x + i : x,
            y: isHorizontal ? y : y + i,
            hit: false
          });
        }
        
        // Check for collisions with already placed ships
        const hasCollision = positions.some(pos => 
          newPlacedShips.some(ship => 
            ship.positions.some(shipPos => 
              shipPos.x === pos.x && shipPos.y === pos.y
            )
          )
        );
        
        if (!hasCollision) {
          newPlacedShips.push({
            type: shipType.type,
            size: shipType.size,
            positions,
            sunk: false
          });
          placed = true;
        }
      }
      
      if (!placed) {
        // If we couldn't place all ships, start over
        return handleRandomPlacement();
      }
    }
    
    setPlacedShips(newPlacedShips);
    setReadyToConfirm(true);
    toast.success('Placement aléatoire effectué!');
  };
  
  const handleConfirm = () => {
    if (!readyToConfirm) {
      toast.error('Vous devez placer tous vos navires !');
      return;
    }
    
    onPlaceShips(placedShips);
  };
  
  const renderGrid = () => {
    const cells = [];
    
    // Render column headers (A-J)
    cells.push(<div key="corner" className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-gray-500 font-semibold"></div>);
    for (let x = 0; x < boardSize; x++) {
      cells.push(
        <div key={`col-${x}`} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-gray-500 font-semibold">
          {String.fromCharCode(65 + x)}
        </div>
      );
    }
    
    for (let y = 0; y < boardSize; y++) {
      // Render row header (1-10)
      cells.push(
        <div key={`row-${y}`} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-gray-500 font-semibold">
          {y + 1}
        </div>
      );
      
      for (let x = 0; x < boardSize; x++) {
        // Check if cell has a ship
        const placedShip = placedShips.find(ship => 
          ship.positions.some(pos => pos.x === x && pos.y === y)
        );
        
        // Check if cell is being hovered
        const isHovered = hoveredCells.some(cell => cell.x === x && cell.y === y);
        
        let cellClass = 'w-8 h-8 md:w-10 md:h-10 border border-gray-300 transition-colors';
        let cellTitle = '';
        
        if (placedShip) {
          cellClass += ` ${getShipColor(placedShip.type)} text-white flex items-center justify-center`;
          cellTitle = SHIP_TYPES.find(s => s.type === placedShip.type)?.name || '';
        } else if (isHovered) {
          cellClass += ' bg-blue-300 cursor-pointer';
        } else {
          cellClass += ' bg-white hover:bg-gray-100 cursor-pointer';
        }
        
        cells.push(
          <div
            key={`${x}-${y}`}
            className={cellClass}
            onMouseEnter={() => handleCellHover(x, y)}
            onClick={() => handleCellClick(x, y)}
            title={cellTitle}
          >
            {placedShip && 
              <span className="text-xs md:text-sm">{placedShip.type.charAt(0).toUpperCase()}</span>
            }
          </div>
        );
      }
    }
    
    return cells;
  };
  
  return (
    <div className="flex flex-col items-center max-w-full">
      <div className="flex flex-wrap justify-center gap-2 mb-4 w-full">
        {SHIP_TYPES.map(ship => {
          const isPlaced = placedShips.some(s => s.type === ship.type);
          return (
            <button
              key={ship.type}
              className={`px-3 py-1 rounded text-sm md:text-base flex items-center ${
                selectedShipType === ship.type
                  ? 'bg-blue-600 text-white ring-2 ring-offset-2 ring-blue-500'
                  : 'bg-gray-200 text-gray-800'
              } ${
                isPlaced ? 'opacity-70' : ''
              }`}
              onClick={() => setSelectedShipType(ship.type)}
              title={isPlaced ? 'Déjà placé - Cliquez pour replacer' : `Placer votre ${ship.name}`}
            >
              <div className={`w-4 h-4 rounded-full mr-2 ${getShipColor(ship.type)}`}></div>
              {ship.name} ({ship.size})
              {isPlaced && 
                <svg className="h-4 w-4 ml-1 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              }
            </button>
          );
        })}
      </div>
      
      {placementError && (
        <Alert variant="error" className="mb-4 max-w-md">
          {placementError}
        </Alert>
      )}
      
      <div className="flex space-x-4 mb-4">
        <Button variant="secondary" onClick={handleRotate} size="sm">
          {orientation === 'horizontal' ? 'Horizontal' : 'Vertical'}
          <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        </Button>
        
        <Button variant="secondary" onClick={handleRandomPlacement} size="sm">
          Placement aléatoire
        </Button>
      </div>
      
      <div className="grid grid-cols-[auto_repeat(10,1fr)] grid-rows-[auto_repeat(10,1fr)] bg-white rounded-lg shadow overflow-hidden mb-6 max-w-full overflow-x-auto">
        {renderGrid()}
      </div>
      
      <div className="flex flex-wrap justify-center gap-4">
        <Button variant="danger" onClick={handleReset} size="sm">
          Réinitialiser
        </Button>
        <Button 
          onClick={handleConfirm} 
          disabled={!readyToConfirm}
          className={!readyToConfirm ? 'opacity-60' : ''}
        >
          Confirmer le placement
        </Button>
      </div>
    </div>
  );
}
