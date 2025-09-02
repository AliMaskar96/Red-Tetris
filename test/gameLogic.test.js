import {
  createEmptyBoard,
  checkCollision,
  rotatePiece,
  movePiece,
  placePiece,
  clearLines,
  addPenaltyLines,
  generateSpectrum,
  clearLinesWithGravity,
  calculateShadowPosition,
  getBoardWithPieceAndShadow,
  shuffleBag,
  createPieceSequence,
  getNextPiece
} from '../src/client/utils/gameLogic.js';

describe('gameLogic pure functions', () => {
  test('createEmptyBoard returns a 20x10 grid of zeros', () => {
    const board = createEmptyBoard();
    expect(board.length).toBe(20);
    expect(board[0].length).toBe(10);
    expect(board.flat().every(cell => cell === 0)).toBe(true);
  });

  test('placePiece merges a piece into the board', () => {
    const board = createEmptyBoard();
    const piece = [
      [1, 1],
      [0, 1]
    ];
    const newBoard = placePiece(piece, board, 0, 0);
    expect(newBoard[0][0]).toBe(1);
    expect(newBoard[0][1]).toBe(1);
    expect(newBoard[1][1]).toBe(1);
  });

  test('checkCollision detects collision with filled cells and boundaries', () => {
    const board = createEmptyBoard();
    const piece = [
      [1, 1],
      [0, 1]
    ];
    expect(checkCollision(piece, board, 0, 0)).toBe(false);
    expect(checkCollision(piece, board, -1, 0)).toBe(true);
    expect(checkCollision(piece, board, 9, 0)).toBe(true);
    // Place a block and check collision
    const board2 = placePiece(piece, board, 0, 0);
    expect(checkCollision(piece, board2, 0, 0)).toBe(true);
  });

  test('rotatePiece rotates a piece if no collision, else returns original', () => {
    const board = createEmptyBoard();
    const piece = [
      [1, 0],
      [1, 1]
    ];
    const rotated = rotatePiece(piece, board, 0, 0);
    expect(rotated).not.toEqual(piece);
    // If collision, returns original
    const filledBoard = placePiece(piece, board, 0, 0);
    const rotated2 = rotatePiece(piece, filledBoard, 0, 0);
    expect(rotated2).toEqual(piece);
  });

  test('movePiece returns new position if valid, else original', () => {
    const board = createEmptyBoard();
    const piece = [
      [1, 1]
    ];
    const pos = { x: 0, y: 0 };
    expect(movePiece(piece, 'right', board, pos.x, pos.y)).toEqual({ x: 1, y: 0 });
    expect(movePiece(piece, 'left', board, pos.x, pos.y)).toEqual({ x: 0, y: 0 });
    expect(movePiece(piece, 'down', board, pos.x, pos.y)).toEqual({ x: 0, y: 1 });
  });

  test('clearLines removes full lines and returns correct count', () => {
    let board = createEmptyBoard();
    board[19] = Array(10).fill(1);
    const { newBoard, linesCleared } = clearLines(board);
    expect(linesCleared).toBe(1);
    expect(newBoard[19].every(cell => cell === 0)).toBe(true);
  });

  test('addPenaltyLines adds indestructible lines to the bottom', () => {
    let board = createEmptyBoard();
    board[0][0] = 1;
    const newBoard = addPenaltyLines(board, 2);
    expect(newBoard.length).toBe(20);
    expect(newBoard[18].every(cell => cell === 9)).toBe(true);
    expect(newBoard[19].every(cell => cell === 9)).toBe(true);
    // Top rows are removed
    expect(newBoard[0][0]).toBe(0);
  });

  test('generateSpectrum returns correct heights for each column', () => {
    let board = createEmptyBoard();
    board[5][2] = 1;
    board[10][3] = 1;
    const spectrum = generateSpectrum(board);
    expect(spectrum[2]).toBe(5);
    expect(spectrum[3]).toBe(10);
    expect(spectrum[0]).toBe(20);
  });

  // Additional tests for uncovered functions
  test('clearLinesWithGravity should work like clearLines for now', () => {
    let board = createEmptyBoard();
    board[19] = Array(10).fill(1);
    const result = clearLinesWithGravity(board);
    expect(result.linesCleared).toBe(1);
    expect(result.newBoard[19].every(cell => cell === 0)).toBe(true);
  });

  test('calculateShadowPosition should find correct landing position', () => {
    const board = createEmptyBoard();
    board[18][0] = 1; // Block at bottom
    
    const piece = [
      [1, 1],
      [0, 1]
    ];
    
    const shadowPos = calculateShadowPosition(piece, board, 0, 0);
    expect(shadowPos.x).toBe(0);
    expect(shadowPos.y).toBe(17); // Should land above the block (piece[0][0] at [17][0], piece[1][1] at [18][1])
  });

  test('calculateShadowPosition should handle piece at very bottom', () => {
    const board = createEmptyBoard();
    
    const piece = [[1]];
    const shadowPos = calculateShadowPosition(piece, board, 0, 19);
    expect(shadowPos.x).toBe(0);
    expect(shadowPos.y).toBe(19);
  });

  test('getBoardWithPieceAndShadow should render piece and shadow', () => {
    const board = createEmptyBoard();
    
    const piece = [[1]];
    const boardWithPieceShadow = getBoardWithPieceAndShadow(piece, board, 0, 0);
    
    expect(boardWithPieceShadow[0][0]).toBe(1); // Actual piece
    expect(boardWithPieceShadow[19][0]).toBe(-1); // Shadow
  });

  test('getBoardWithPieceAndShadow should not show shadow when piece is at bottom', () => {
    const board = createEmptyBoard();
    
    const piece = [[1]];
    const boardWithPieceShadow = getBoardWithPieceAndShadow(piece, board, 0, 19);
    
    expect(boardWithPieceShadow[19][0]).toBe(1); // Only the piece
    // No shadow should be visible since piece is at landing position
    const shadowCount = boardWithPieceShadow.flat().filter(cell => cell === -1).length;
    expect(shadowCount).toBe(0);
  });

  test('shuffleBag should return all 7 tetromino types', () => {
    const bag = shuffleBag(12345);
    expect(bag).toHaveLength(7);
    expect(bag).toEqual(expect.arrayContaining(['I', 'O', 'T', 'S', 'Z', 'J', 'L']));
  });

  test('shuffleBag should be deterministic with same seed', () => {
    const bag1 = shuffleBag(12345);
    const bag2 = shuffleBag(12345);
    expect(bag1).toEqual(bag2);
  });

  test('shuffleBag should be random without seed', () => {
    const bag1 = shuffleBag();
    const bag2 = shuffleBag();
    expect(bag1).toHaveLength(7);
    expect(bag2).toHaveLength(7);
    // They might be different (but not guaranteed due to randomness)
  });

  test('createPieceSequence should generate sequence of specified length', () => {
    const sequence = createPieceSequence(20, 12345);
    expect(sequence).toHaveLength(20);
    sequence.forEach(piece => {
      expect(['I', 'O', 'T', 'S', 'Z', 'J', 'L']).toContain(piece);
    });
  });

  test('createPieceSequence should be deterministic with seed', () => {
    const sequence1 = createPieceSequence(14, 12345);
    const sequence2 = createPieceSequence(14, 12345);
    expect(sequence1).toEqual(sequence2);
  });

  test('createPieceSequence should handle partial bags correctly', () => {
    const sequence = createPieceSequence(10, 12345);
    expect(sequence).toHaveLength(10);
    
    // First 7 should be a complete bag
    const firstBag = sequence.slice(0, 7);
    expect(firstBag).toEqual(expect.arrayContaining(['I', 'O', 'T', 'S', 'Z', 'J', 'L']));
  });

  test('createPieceSequence should work without seed', () => {
    const sequence = createPieceSequence(14);
    expect(sequence).toHaveLength(14);
    sequence.forEach(piece => {
      expect(['I', 'O', 'T', 'S', 'Z', 'J', 'L']).toContain(piece);
    });
  });

  test('getNextPiece should return correct piece from sequence', () => {
    const sequence = ['I', 'O', 'T', 'S'];
    
    expect(getNextPiece(sequence, 0)).toBe('I');
    expect(getNextPiece(sequence, 1)).toBe('O');
    expect(getNextPiece(sequence, 3)).toBe('S');
  });

  test('getNextPiece should wrap around when index exceeds sequence length', () => {
    const sequence = ['I', 'O'];
    
    expect(getNextPiece(sequence, 2)).toBe('I'); // Wraps to index 0
    expect(getNextPiece(sequence, 3)).toBe('O'); // Wraps to index 1
    expect(getNextPiece(sequence, 4)).toBe('I'); // Wraps to index 0
  });

  // Test edge cases for existing functions
  test('addPenaltyLines should handle zero count', () => {
    const board = createEmptyBoard();
    board[0][0] = 1;
    const newBoard = addPenaltyLines(board, 0);
    expect(newBoard[0][0]).toBe(1); // Should be unchanged
    expect(newBoard.flat().filter(cell => cell === 9)).toHaveLength(0);
  });

  test('addPenaltyLines should handle negative count', () => {
    const board = createEmptyBoard();
    const newBoard = addPenaltyLines(board, -1);
    expect(newBoard.flat().filter(cell => cell === 9)).toHaveLength(0);
  });

  test('checkCollision should handle piece outside board boundaries', () => {
    const board = createEmptyBoard();
    const piece = [[1]];
    
    // Test all boundaries
    expect(checkCollision(piece, board, -1, 0)).toBe(true); // Left boundary
    expect(checkCollision(piece, board, 10, 0)).toBe(true); // Right boundary
    expect(checkCollision(piece, board, 0, 20)).toBe(true); // Bottom boundary
    expect(checkCollision(piece, board, 0, -1)).toBe(false); // Top boundary (allowed)
  });

  test('checkCollision should handle complex piece shapes', () => {
    const board = createEmptyBoard();
    board[2][1] = 1; // Place obstacle where L-piece bottom-right would be
    
    const lPiece = [
      [1, 0],
      [1, 0],
      [1, 1]
    ];
    
    expect(checkCollision(lPiece, board, 0, 0)).toBe(true); // Should collide with obstacle at [2][1]
    expect(checkCollision(lPiece, board, 2, 0)).toBe(false); // Should fit when moved right
  });

  test('movePiece should handle edge positions', () => {
    const board = createEmptyBoard();
    const piece = [[1]];
    
    // Test boundary movements
    expect(movePiece(piece, 'left', board, 0, 0)).toEqual({ x: 0, y: 0 }); // Can't go further left
    expect(movePiece(piece, 'right', board, 9, 0)).toEqual({ x: 9, y: 0 }); // Can't go further right
    expect(movePiece(piece, 'down', board, 0, 19)).toEqual({ x: 0, y: 19 }); // Can't go further down
  });

  test('rotatePiece should handle collision during rotation', () => {
    const board = createEmptyBoard();
    // Fill positions where rotated I-piece would be placed
    for (let y = 0; y < 4; y++) {
      board[y][8] = 1; // Block the column where rotated piece would go
    }
    
    const iPiece = [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ];
    
    // Piece at position (6,0) should not rotate due to collision with obstacles at column 8
    const result = rotatePiece(iPiece, board, 6, 0);
    expect(result).toEqual(iPiece); // Should return original piece
  });

  test('placePiece should handle piece placement at boundaries', () => {
    const board = createEmptyBoard();
    const piece = [[1]];
    
    const newBoard = placePiece(piece, board, 9, 19);
    expect(newBoard[19][9]).toBe(1);
  });

  test('clearLines should handle multiple full lines', () => {
    let board = createEmptyBoard();
    board[17] = Array(10).fill(1); // Full line
    board[18] = Array(10).fill(1); // Full line
    board[19] = Array(10).fill(1); // Full line
    
    const { newBoard, linesCleared } = clearLines(board);
    expect(linesCleared).toBe(3);
    expect(newBoard[17].every(cell => cell === 0)).toBe(true);
    expect(newBoard[18].every(cell => cell === 0)).toBe(true);
    expect(newBoard[19].every(cell => cell === 0)).toBe(true);
  });

  test('clearLines should handle non-consecutive full lines', () => {
    let board = createEmptyBoard();
    board[17] = Array(10).fill(1); // Full line
    board[18][0] = 1; // Partial line
    board[19] = Array(10).fill(1); // Full line
    
    const { newBoard, linesCleared } = clearLines(board);
    expect(linesCleared).toBe(2);
    expect(newBoard[19][0]).toBe(1); // Partial line should move to bottom
    expect(newBoard[18][0]).toBe(0); // Should be empty (new row added at top)
  });

  test('generateSpectrum should handle empty board correctly', () => {
    const board = createEmptyBoard();
    const spectrum = generateSpectrum(board);
    expect(spectrum).toEqual(Array(10).fill(20)); // All columns should be 20 (empty)
  });

  test('generateSpectrum should handle full board', () => {
    const board = Array(20).fill().map(() => Array(10).fill(1));
    const spectrum = generateSpectrum(board);
    expect(spectrum).toEqual(Array(10).fill(0)); // All columns should be 0 (full)
  });
}); 