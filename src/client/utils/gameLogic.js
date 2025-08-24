import { rotate as rotateMatrix } from './tetrominos';

const ROWS = 20;
const COLS = 10;

export function createEmptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

export function checkCollision(piece, board, posX, posY) {
  for (let y = 0; y < piece.length; y++) {
    for (let x = 0; x < piece[y].length; x++) {
      if (piece[y][x]) {
        const boardY = posY + y;
        const boardX = posX + x;
        if (
          boardY >= ROWS ||
          boardX < 0 ||
          boardX >= COLS ||
          (boardY >= 0 && board[boardY] && board[boardY][boardX])
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

export function rotatePiece(piece, board, posX, posY) {
  const rotated = rotateMatrix(piece);
  if (!checkCollision(rotated, board, posX, posY)) {
    return rotated;
  }
  return piece;
}

export function movePiece(piece, direction, board, posX, posY) {
  let newX = posX;
  let newY = posY;
  if (direction === 'left') newX -= 1;
  if (direction === 'right') newX += 1;
  if (direction === 'down') newY += 1;
  if (!checkCollision(piece, board, newX, newY)) {
    return { x: newX, y: newY };
  }
  return { x: posX, y: posY };
}

export function placePiece(piece, board, posX, posY) {
  const newBoard = board.map(row => [...row]);
  for (let y = 0; y < piece.length; y++) {
    for (let x = 0; x < piece[y].length; x++) {
      if (piece[y][x]) {
        const boardY = posY + y;
        const boardX = posX + x;
        if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
          newBoard[boardY][boardX] = piece[y][x];
        }
      }
    }
  }
  return newBoard;
}

export function clearLines(board) {
  // A line can be cleared only if it's completely filled with regular pieces (values 1-7)
  // Penalty lines (value 9) and empty cells (value 0) cannot be cleared
  const newBoard = board.filter(row => {
    // Keep the row if:
    // 1. It has at least one empty cell (0), OR
    // 2. It has at least one penalty cell (9), OR  
    // 3. It's not completely filled with regular pieces
    const hasEmpty = row.some(cell => cell === 0);
    const hasPenalty = row.some(cell => cell === 9);
    const isCompletelyFilled = row.every(cell => cell >= 1 && cell <= 7);
    
    return hasEmpty || hasPenalty || !isCompletelyFilled;
  });
  
  const linesCleared = ROWS - newBoard.length;
  while (newBoard.length < ROWS) {
    newBoard.unshift(Array(COLS).fill(0));
  }
  return { newBoard, linesCleared };
}

// Gravity+ mode: clear lines and apply gravity (move blocks down)
export function clearLinesWithGravity(board) {
  // Default: just use clearLines for now (no gravity effect)
  return clearLines(board);
}

// Adds 'count' indestructible penalty lines (value 9) to the bottom of the board
// Removes the same number of rows from the top to keep the board at 20 rows
export function addPenaltyLines(board, count) {
  if (count <= 0) return board.map(row => [...row]);
  const COLS = board[0].length;
  const penaltyLine = Array(COLS).fill(9);
  const newBoard = board.slice(count).map(row => [...row]);
  for (let i = 0; i < count; i++) {
    newBoard.push([...penaltyLine]);
  }
  return newBoard;
}

// Generates the spectrum (first occupied cell per column, or 20 if empty)
export function generateSpectrum(board) {
  const ROWS = board.length;
  const COLS = board[0].length;
  const spectrum = [];
  for (let col = 0; col < COLS; col++) {
    let found = false;
    for (let row = 0; row < ROWS; row++) {
      if (board[row][col] !== 0) {
        spectrum.push(row);
        found = true;
        break;
      }
    }
    if (!found) spectrum.push(ROWS);
  }
  return spectrum;
}

// Calcule la position du spectre (ombre de la pièce qui montre où elle va atterrir)
export function calculateShadowPosition(piece, board, posX, posY) {
  let shadowY = posY;
  
  // Descendre jusqu'à la première collision
  while (!checkCollision(piece, board, posX, shadowY + 1)) {
    shadowY++;
  }
  
  return { x: posX, y: shadowY };
}

// Génère le plateau avec la pièce actuelle et son spectre
export function getBoardWithPieceAndShadow(piece, board, posX, posY) {
  const boardCopy = board.map(row => [...row]);
  const shadowPos = calculateShadowPosition(piece, board, posX, posY);
  
  // Dessiner le spectre d'abord (avec une valeur spéciale -1) seulement si différent de la position actuelle
  if (shadowPos.y !== posY) {
    for (let y = 0; y < piece.length; y++) {
      for (let x = 0; x < piece[y].length; x++) {
        if (piece[y][x]) {
          const boardY = shadowPos.y + y;
          const boardX = shadowPos.x + x;
          if (boardY >= 0 && boardY < board.length && boardX >= 0 && boardX < board[0].length) {
            if (boardCopy[boardY][boardX] === 0) { // Ne dessiner que sur les cases vides
              boardCopy[boardY][boardX] = -1; // Valeur spéciale pour le spectre
            }
          }
        }
      }
    }
  }
  
  // Dessiner la pièce actuelle par-dessus
  for (let y = 0; y < piece.length; y++) {
    for (let x = 0; x < piece[y].length; x++) {
      if (piece[y][x]) {
        const boardY = posY + y;
        const boardX = posX + x;
        if (boardY >= 0 && boardY < board.length && boardX >= 0 && boardX < board[0].length) {
          boardCopy[boardY][boardX] = piece[y][x];
        }
      }
    }
  }
  
  return boardCopy;
}

// --- 7-bag piece sequence generator ---
const TETROMINO_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

// Simple seeded PRNG (mulberry32)
function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Fisher-Yates shuffle with optional PRNG
function shuffle(array, rng = Math.random) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Returns a shuffled bag of 7 tetromino types
export function shuffleBag(seed) {
  const rng = seed !== undefined ? mulberry32(seed) : Math.random;
  return shuffle(TETROMINO_TYPES, rng);
}

/**
 * Generates a deterministic piece sequence for multiplayer games.
 * @param {number} length - The number of pieces to generate.
 * @param {number} seed - The seed for deterministic shuffling.
 * @returns {string[]} The piece sequence.
 */
export function createPieceSequence(length, seed) {
  let sequence = [];
  let bagCount = Math.ceil(length / 7);
  for (let i = 0; i < bagCount; i++) {
    // For determinism, use a different seed for each bag if seed is provided
    const bagSeed = seed !== undefined ? seed + i : undefined;
    sequence = sequence.concat(shuffleBag(bagSeed));
  }
  return sequence.slice(0, length);
}

/**
 * Returns the next piece type from the sequence at the given index.
 * @param {string[]} sequence - The piece sequence.
 * @param {number} index - The current index.
 * @returns {string} The next piece type.
 */
export function getNextPiece(sequence, index) {
  return sequence[index % sequence.length];
}