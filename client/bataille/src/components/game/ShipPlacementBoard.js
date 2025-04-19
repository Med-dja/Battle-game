'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';

const SHIP_TYPES = [
  { type: 'carrier', name: 'Porte-avions', size: 5 },
  { type: 'battleship', name: 'Cuirassé', size: 4 },
  { type: 'cruiser', name: 'Croiseur', size: 3 },
  { type: 'submarine', name: 'Sous-marin', size: 3 },
  { type: 'destroyer', name: 'Destroyer', size: 2 }
];

export default function ShipPlacementBoard({ onPlaceShips }) {
  const [selectedShipType, setSelectedShipType] = useState(SHIP_TYPES[0].type);
  const [orientation, setOrientation] = useState('horizontal');
  const [placedShips, setPlacedShips] = useState([]);
  const [hoveredCells, setHoveredCells] = useState([]);
  
  const boardSize = 10;
  
  const getSelectedShip = () => SHIP_TYPES.find(ship => ship.type === selectedShipType);
  
  const handleCellHover = (x, y) => {
    const ship = getSelectedShip();
    if (!ship) return;
    
    const cells = [];
    
    for (let i = 0; i < ship.size; i++) {
      const newX = orientation === 'horizontal' ? x + i : x;
      const newY = orientation === 'vertical' ? y + i : y;
      
      // Check if out of bounds
      if (newX >= boardSize || newY >= boardSize) {
        setHoveredCells([]);
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
    
    // Clear hover state
    setHoveredCells([]);
  };
  
  const handleRotate = () => {
    setOrientation(orientation === 'horizontal' ? 'vertical' : 'horizontal');
  };
  
  const handleReset = () => {
    setPlacedShips([]);
  };
  
  const handleConfirm = () => {
    if (placedShips.length !== SHIP_TYPES.length) {
      alert('Veuillez placer tous vos navires !');
      return;
    }
    
    onPlaceShips(placedShips);
  };
  
  const renderGrid = () => {
    const cells = [];
    
    for (let y = 0; y < boardSize; y++) {
      for (let x = 0; x < boardSize; x++) {
        // Check if cell has a ship
        const hasShip = placedShips.some(ship => 
          ship.positions.some(pos => pos.x === x && pos.y === y)
        );
        
        // Check if cell is being hovered
        const isHovered = hoveredCells.some(cell => cell.x === x && cell.y === y);
        
        let cellClass = 'w-8 h-8 md:w-10 md:h-10 border border-gray-300 ';
        
        if (hasShip) {
          cellClass += 'bg-blue-500 ';
        } else if (isHovered) {
          cellClass += 'bg-blue-300 ';
        } else {
          cellClass += 'bg-white hover:bg-gray-100 ';
        }
        
        cells.push(
          <div
            key={`${x}-${y}`}
            className={cellClass}
            onMouseEnter={() => handleCellHover(x, y)}
            onClick={() => handleCellClick(x, y)}
          />
        );
      }
    }
    
    return cells;
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className="flex space-x-4 mb-4">
        {SHIP_TYPES.map(ship => (
          <button
            key={ship.type}
            className={`px-3 py-1 rounded ${
              selectedShipType === ship.type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800'
            } ${
              placedShips.some(s => s.type === ship.type)
                ? 'opacity-50'
                : ''
            }`}
            onClick={() => setSelectedShipType(ship.type)}
          >
            {ship.name} ({ship.size})
          </button>
        ))}
      </div>
      
      <div className="mb-4">
        <Button variant="secondary" onClick={handleRotate}>
          Rotation {orientation === 'horizontal' ? '(Horizontal)' : '(Vertical)'}
        </Button>
      </div>
      
      <div className="grid grid-cols-10 bg-white rounded-lg shadow overflow-hidden mb-6">
        {renderGrid()}
      </div>
      
      <div className="flex space-x-4">
        <Button variant="danger" onClick={handleReset}>
          Réinitialiser
        </Button>
        <Button onClick={handleConfirm}>
          Confirmer le placement
        </Button>
      </div>
    </div>
  );
}
