import React from 'react';
import './Board.css';
import { getTetromino, TETROMINO_COLORS } from '../utils/tetrominos';

const ROWS = 20;
const COLS = 10;

// Génère une matrice vide
const emptyBoard = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

export default function Board({ board = emptyBoard }) {
  return (
    <div className="tetris-board">
      {board.map((row, y) =>
        row.map((cell, x) => (
          <div
            key={`${y}-${x}`}
            className={`cell cell-${cell}`}
          />
        ))
      )}
    </div>
  );
}

// Next piece preview component
export function NextPiecePreview({ type }) {
  if (!type) return null;
  const { shape, color } = (() => {
    const tetro = getTetromino(type);
    return {
      shape: tetro.shape,
      color: TETROMINO_COLORS[type]
    };
  })();
  // Find bounding box of the shape
  let minY = 4, maxY = -1, minX = 4, maxX = -1;
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x]) {
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
  }
  // Calculate offset to center the piece
  const pieceHeight = maxY - minY + 1;
  const pieceWidth = maxX - minX + 1;
  const offsetY = Math.floor((4 - pieceHeight) / 2) - minY;
  const offsetX = Math.floor((4 - pieceWidth) / 2) - minX;
  // Build the 4x4 grid with the piece centered
  const grid = Array.from({ length: 4 }, (_, y) =>
    Array.from({ length: 4 }, (_, x) => {
      const sy = y - offsetY;
      const sx = x - offsetX;
      return (shape[sy] && shape[sy][sx]) ? color : null;
    })
  );
  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: 'repeat(4, 18px)',
      gridTemplateColumns: 'repeat(4, 18px)',
      gap: 2,
      alignItems: 'center',
      justifyItems: 'center',
      margin: '0 auto',
      width: 4 * 18 + 3 * 2,
      height: 4 * 18 + 3 * 2,
    }}>
      {grid.flat().map((cell, i) => (
        <div key={i} style={{
          width: 18,
          height: 18,
          background: cell || 'transparent',
          borderRadius: 3,
          border: cell ? '1px solid #fff8' : 'none',
          boxSizing: 'border-box',
          transition: 'background 0.2s',
        }} />
      ))}
    </div>
  );
}
