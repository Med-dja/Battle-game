'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

const MISS_CELL = 'bg-blue-200';
const HIT_CELL = 'bg-red-500';
const SUNK_CELL = 'bg-red-800';
const MY_SHIP_CELL = 'bg-gray-400';
const HOVER_CELL = 'bg-gray-300';
const EMPTY_CELL = 'bg-white hover:bg-gray-100';

export default function GameBoard({ 
  isMyBoard = false, 
  ships = [], 
  shots = [], 
  opponentShots = [],
  onCellClick,
  isMyTurn = false,
  boardSize = 10,
  showShipLabels = true,
  gameOver = false
}) {
  const [hoveredCell, setHoveredCell] = useState(null);

  // Get the state of a cell (what to display)
  const getCellState = (x, y) => {
    if (isMyBoard) {
      // My board: show my ships and opponent's shots
      const ship = ships.find(ship => 
        ship.positions.some(pos => pos.x === x && pos.y === y)
      );
      
      const shot = opponentShots.find(shot => shot.x === x && shot.y === y);
      
      if (ship) {
        // Is this position of the ship hit?
        const position = ship.positions.find(pos => pos.x === x && pos.y === y);
        if (position && position.hit) {
          return {
            className: ship.sunk ? SUNK_CELL : HIT_CELL,
            label: showShipLabels ? ship.type.charAt(0).toUpperCase() : '',
            ship: ship
          };
        }
        return {
          className: MY_SHIP_CELL,
          label: showShipLabels ? ship.type.charAt(0).toUpperCase() : '',
          ship: ship
        };
      }
      
      if (shot) {
        return {
          className: shot.hit ? HIT_CELL : MISS_CELL,
          label: '',
        };
      }
    } else {
      // Opponent's board: show my shots
      const shot = shots.find(s => s.x === x && s.y === y);
      
      if (shot) {
        if (shot.hit) {
          const shipType = shot.shipHit;
          return {
            className: shot.sunk ? SUNK_CELL : HIT_CELL,
            label: shipType ? shipType.charAt(0).toUpperCase() : 'X',
          };
        }
        return {
          className: MISS_CELL,
          label: '',
        };
      }
      
      // If it's my turn and I'm hovering, show hover state
      if (isMyTurn && hoveredCell && hoveredCell.x === x && hoveredCell.y === y) {
        return {
          className: HOVER_CELL,
          label: '',
          isHover: true
        };
      }
    }
    
    // Empty cell
    return {
      className: EMPTY_CELL,
      label: '',
    };
  };

  const handleCellClick = (x, y) => {
    if (!isMyBoard && isMyTurn) {
      // Check if we already fired at this cell
      if (shots.some(shot => shot.x === x && shot.y === y)) {
        toast.error('Vous avez déjà tiré à cet endroit !');
        return;
      }
      
      onCellClick && onCellClick(x, y);
    }
  };

  const handleMouseEnter = (x, y) => {
    if (!isMyBoard && isMyTurn) {
      setHoveredCell({ x, y });
    }
  };

  const handleMouseLeave = () => {
    setHoveredCell(null);
  };

  // Generate the grid with column and row headers
  const renderGrid = () => {
    const cells = [];
    
    // Empty corner cell
    cells.push(
      <div key="corner" className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-gray-500 font-semibold"></div>
    );
    
    // Column headers (A-J)
    for (let x = 0; x < boardSize; x++) {
      cells.push(
        <div key={`col-${x}`} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-gray-500 font-semibold">
          {String.fromCharCode(65 + x)}
        </div>
      );
    }
    
    // Rows with headers and cells
    for (let y = 0; y < boardSize; y++) {
      // Row header (1-10)
      cells.push(
        <div key={`row-${y}`} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-gray-500 font-semibold">
          {y + 1}
        </div>
      );
      
      // Cells for this row
      for (let x = 0; x < boardSize; x++) {
        const cellState = getCellState(x, y);
        const isCellClickable = !isMyBoard && isMyTurn && !shots.some(s => s.x === x && s.y === y) && !gameOver;
        
        cells.push(
          <div
            key={`${x}-${y}`}
            className={`w-8 h-8 md:w-10 md:h-10 border border-gray-300 ${cellState.className} 
              flex items-center justify-center ${isCellClickable ? 'cursor-crosshair' : ''} 
              transition-colors duration-150`}
            onClick={() => handleCellClick(x, y)}
            onMouseEnter={() => handleMouseEnter(x, y)}
            onMouseLeave={handleMouseLeave}
            title={cellState.ship ? `${cellState.ship.type.charAt(0).toUpperCase() + cellState.ship.type.slice(1)}` : ''}
          >
            <span className={`text-xs md:text-sm ${cellState.className.includes('bg-red') ? 'text-white' : ''}`}>
              {cellState.label}
            </span>
          </div>
        );
      }
    }
    
    return cells;
  };

  return (
    <div className={`grid grid-cols-[auto_repeat(10,1fr)] grid-rows-[auto_repeat(10,1fr)] bg-white rounded-lg shadow overflow-hidden`}>
      {renderGrid()}
    </div>
  );
}
