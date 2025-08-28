import chai from 'chai';
import {
  createEmptyBoard,
  placePiece,
  clearLines,
  checkCollision,
  movePiece,
  rotatePiece,
  createPieceSequence,
  getNextPiece,
  addPenaltyLines,
  generateSpectrum,
  getBoardWithPieceAndShadow
} from '../src/client/utils/gameLogic.js';

const expect = chai.expect;

describe('Game Logic - Core Functions', () => {
  
  describe('createEmptyBoard', () => {
    it('should create an empty board', () => {
      const board = createEmptyBoard();
      expect(board).to.be.an('array');
      expect(board).to.have.lengthOf(20);
      expect(board[0]).to.have.lengthOf(10);
      expect(board[0].every(cell => cell === 0)).to.be.true;
    });
  });

  describe('checkCollision', () => {
    it('should detect no collision on empty board', () => {
      const piece = {
        shape: [[1, 1], [1, 1]]
      };
      const board = createEmptyBoard();
      
      const collision = checkCollision(piece, board, 0, 0);
      expect(collision).to.be.false;
    });

    it('should detect collision at bottom boundary', () => {
      const piece = {
        shape: [[1, 1], [1, 1]]
      };
      const board = createEmptyBoard();
      
      const collision = checkCollision(piece, board, 0, 19);
      expect(collision).to.be.true;
    });

    it('should detect collision at right boundary', () => {
      const piece = {
        shape: [[1, 1], [1, 1]]
      };
      const board = createEmptyBoard();
      
      const collision = checkCollision(piece, board, 9, 0);
      expect(collision).to.be.true;
    });
  });

  describe('placePiece', () => {
    it('should place a piece on the board', () => {
      const piece = {
        shape: [[1, 1], [1, 1]]
      };
      const board = createEmptyBoard();
      
      const newBoard = placePiece(piece, board, 0, 0);
      expect(newBoard[0][0]).to.equal(1);
      expect(newBoard[0][1]).to.equal(1);
      expect(newBoard[1][0]).to.equal(1);
      expect(newBoard[1][1]).to.equal(1);
    });

    it('should not mutate original board', () => {
      const piece = {
        shape: [[1, 1], [1, 1]]
      };
      const board = createEmptyBoard();
      const originalBoard = JSON.parse(JSON.stringify(board));
      
      placePiece(piece, board, 0, 0);
      expect(board).to.deep.equal(originalBoard);
    });
  });

  describe('clearLines', () => {
    it('should clear no lines on empty board', () => {
      const board = createEmptyBoard();
      
      const { newBoard, linesCleared } = clearLines(board);
      expect(linesCleared).to.equal(0);
      expect(newBoard).to.deep.equal(board);
    });

    it('should clear a full line', () => {
      const board = createEmptyBoard();
      // Fill bottom line
      for (let col = 0; col < 10; col++) {
        board[19][col] = 1;
      }
      
      const { newBoard, linesCleared } = clearLines(board);
      expect(linesCleared).to.equal(1);
      expect(newBoard[19].every(cell => cell === 0)).to.be.true;
    });
  });

  describe('movePiece', () => {
    it('should move piece left', () => {
      const piece = {
        shape: [[1, 1], [1, 1]]
      };
      const board = createEmptyBoard();
      
      const newPiece = movePiece(piece, 'left', board, 5, 5);
      expect(newPiece.x).to.equal(4);
      expect(newPiece.y).to.equal(5);
    });

    it('should move piece right', () => {
      const piece = {
        shape: [[1, 1], [1, 1]]
      };
      const board = createEmptyBoard();
      
      const newPiece = movePiece(piece, 'right', board, 5, 5);
      expect(newPiece.x).to.equal(6);
      expect(newPiece.y).to.equal(5);
    });

    it('should move piece down', () => {
      const piece = {
        shape: [[1, 1], [1, 1]]
      };
      const board = createEmptyBoard();
      
      const newPiece = movePiece(piece, 'down', board, 5, 5);
      expect(newPiece.x).to.equal(5);
      expect(newPiece.y).to.equal(6);
    });
  });

  describe('rotatePiece', () => {
    it('should rotate a piece', () => {
      const piece = {
        shape: [[1, 0], [1, 0]]
      };
      const board = createEmptyBoard();
      
      const rotated = rotatePiece(piece, board, 5, 5);
      expect(rotated.shape).to.not.deep.equal(piece.shape);
    });
  });

  describe('createPieceSequence', () => {
    it('should create a sequence of pieces', () => {
      const sequence = createPieceSequence(10);
      expect(sequence).to.be.an('array');
      expect(sequence).to.have.lengthOf(10);
      sequence.forEach(piece => {
        expect(piece).to.have.property('type');
        expect(['I', 'O', 'T', 'S', 'Z', 'J', 'L']).to.include(piece.type);
      });
    });
  });

  describe('getNextPiece', () => {
    it('should get next piece from sequence', () => {
      const sequence = createPieceSequence(5);
      const piece = getNextPiece(sequence, 0);
      expect(piece).to.equal(sequence[0]);
    });

    it('should return null for out of bounds index', () => {
      const sequence = createPieceSequence(5);
      const piece = getNextPiece(sequence, 10);
      expect(piece).to.be.null;
    });
  });

  describe('addPenaltyLines', () => {
    it('should add penalty lines to board', () => {
      const board = createEmptyBoard();
      
      const newBoard = addPenaltyLines(board, 2);
      expect(newBoard[18].some(cell => cell !== 0)).to.be.true;
      expect(newBoard[19].some(cell => cell !== 0)).to.be.true;
    });

    it('should not mutate original board', () => {
      const board = createEmptyBoard();
      const originalBoard = JSON.parse(JSON.stringify(board));
      
      addPenaltyLines(board, 1);
      expect(board).to.deep.equal(originalBoard);
    });
  });

  describe('generateSpectrum', () => {
    it('should generate spectrum for empty board', () => {
      const board = createEmptyBoard();
      
      const spectrum = generateSpectrum(board);
      expect(spectrum).to.be.an('array');
      expect(spectrum).to.have.lengthOf(10);
      expect(spectrum.every(height => height === 0)).to.be.true;
    });

    it('should generate spectrum for board with pieces', () => {
      const board = createEmptyBoard();
      board[19][0] = 1; // One block in first column
      board[18][0] = 1; // Another block in first column
      
      const spectrum = generateSpectrum(board);
      expect(spectrum[0]).to.equal(2);
      expect(spectrum.slice(1).every(height => height === 0)).to.be.true;
    });
  });

  describe('getBoardWithPieceAndShadow', () => {
    it('should create board with piece and shadow', () => {
      const board = createEmptyBoard();
      const piece = {
        shape: [[1, 1], [1, 1]]
      };
      
      const boardWithPiece = getBoardWithPieceAndShadow(board, piece, 0, 0);
      expect(boardWithPiece).to.be.an('array');
      expect(boardWithPiece).to.have.lengthOf(20);
      expect(boardWithPiece[0]).to.have.lengthOf(10);
    });

    it('should not mutate original board', () => {
      const board = createEmptyBoard();
      const originalBoard = JSON.parse(JSON.stringify(board));
      const piece = {
        shape: [[1, 1], [1, 1]]
      };
      
      getBoardWithPieceAndShadow(board, piece, 0, 0);
      expect(board).to.deep.equal(originalBoard);
    });
  });
});
