import {
  createEmptyBoard,
  checkCollision,
  rotatePiece,
  movePiece,
  placePiece,
  clearLines,
  addPenaltyLines,
  generateSpectrum
} from '../src/client/utils/gameLogic';

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
}); 