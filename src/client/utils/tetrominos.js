// Définition des 7 formes classiques de Tetris (matrices 4x4)
export const TETROMINOS = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [2, 2],
    [2, 2],
  ],
  T: [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0],
  ],
  S: [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ],
  Z: [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ],
  J: [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ],
};

// Standard Tetris color mapping for each piece type
export const TETROMINO_COLORS = {
  I: '#00f0f0', // Cyan
  O: '#f0f000', // Yellow
  T: '#a000f0', // Purple
  S: '#00f000', // Green
  Z: '#f00000', // Red
  J: '#0000f0', // Blue
  L: '#f0a000', // Orange
};

// Standard Tetris spawn positions for each piece type (row, col)
// For a 20x10 board, pieces spawn near the top center
export const TETROMINO_SPAWN_POSITIONS = {
  I: { row: 0, col: 3 }, // 4x4, so col 3 centers it
  O: { row: 0, col: 4 }, // 2x2, so col 4 centers it
  T: { row: 0, col: 3 }, // 3x3, so col 3 centers it
  S: { row: 0, col: 3 },
  Z: { row: 0, col: 3 },
  J: { row: 0, col: 3 },
  L: { row: 0, col: 3 },
};

// Fonction pure pour faire tourner une matrice (sens horaire)
export function rotate(matrix) {
  if (!matrix || !matrix.length || !matrix[0]) {
    return [];
  }
  return matrix[0].map((_, i) => matrix.map(row => row[i]).reverse());
}

// Génère un type de pièce aléatoire
export function randomTetromino() {
  const keys = Object.keys(TETROMINOS);
  const rand = keys[Math.floor(Math.random() * keys.length)];
  return { shape: TETROMINOS[rand], type: rand };
}

// Utility to get a tetromino object by type, including shape, color, and spawn position
// Returns deep copies to prevent mutations
export function getTetromino(type) {
  // Check if type is valid
  if (!type || !TETROMINOS[type]) {
    return {
      type,
      shape: undefined,
      color: undefined,
      spawn: undefined,
    };
  }
  
  return {
    type,
    shape: JSON.parse(JSON.stringify(TETROMINOS[type])), // Deep copy to prevent mutation
    color: TETROMINO_COLORS[type],
    spawn: { ...TETROMINO_SPAWN_POSITIONS[type] }, // Shallow copy for spawn position
  };
}
