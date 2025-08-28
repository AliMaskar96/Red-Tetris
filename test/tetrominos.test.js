import chai from 'chai';
import {
  TETROMINOS,
  TETROMINO_COLORS,
  TETROMINO_SPAWN_POSITIONS,
  rotate,
  randomTetromino,
  getTetromino
} from '../src/client/utils/tetrominos.js';

const expect = chai.expect;

describe('Tetrominos Module', () => {
  
  describe('TETROMINOS constant', () => {
    it('should contain all 7 tetromino shapes', () => {
      expect(TETROMINOS).to.be.an('object');
      const types = Object.keys(TETROMINOS);
      expect(types).to.have.lengthOf(7);
      expect(types).to.include.members(['I', 'O', 'T', 'S', 'Z', 'J', 'L']);
    });

    it('should have correct I piece shape', () => {
      expect(TETROMINOS.I).to.deep.equal([
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]);
    });

    it('should have correct O piece shape', () => {
      expect(TETROMINOS.O).to.deep.equal([
        [2, 2],
        [2, 2],
      ]);
    });

    it('should have correct T piece shape', () => {
      expect(TETROMINOS.T).to.deep.equal([
        [0, 3, 0],
        [3, 3, 3],
        [0, 0, 0],
      ]);
    });

    it('should have correct S piece shape', () => {
      expect(TETROMINOS.S).to.deep.equal([
        [0, 4, 4],
        [4, 4, 0],
        [0, 0, 0],
      ]);
    });

    it('should have correct Z piece shape', () => {
      expect(TETROMINOS.Z).to.deep.equal([
        [5, 5, 0],
        [0, 5, 5],
        [0, 0, 0],
      ]);
    });

    it('should have correct J piece shape', () => {
      expect(TETROMINOS.J).to.deep.equal([
        [6, 0, 0],
        [6, 6, 6],
        [0, 0, 0],
      ]);
    });

    it('should have correct L piece shape', () => {
      expect(TETROMINOS.L).to.deep.equal([
        [0, 0, 7],
        [7, 7, 7],
        [0, 0, 0],
      ]);
    });

    it('should use unique numbers for each piece type', () => {
      const pieceNumbers = new Set();
      Object.entries(TETROMINOS).forEach(([type, shape]) => {
        const numbers = new Set();
        shape.flat().forEach(cell => {
          if (cell !== 0) {
            numbers.add(cell);
          }
        });
        // Each piece should use exactly one unique number
        expect(numbers.size).to.equal(1);
        const pieceNumber = [...numbers][0];
        expect(pieceNumbers.has(pieceNumber)).to.be.false;
        pieceNumbers.add(pieceNumber);
      });
      expect(pieceNumbers.size).to.equal(7);
    });
  });

  describe('TETROMINO_COLORS constant', () => {
    it('should contain colors for all 7 tetromino types', () => {
      expect(TETROMINO_COLORS).to.be.an('object');
      const types = Object.keys(TETROMINO_COLORS);
      expect(types).to.have.lengthOf(7);
      expect(types).to.include.members(['I', 'O', 'T', 'S', 'Z', 'J', 'L']);
    });

    it('should have valid hex color codes', () => {
      const hexColorRegex = /^#[0-9a-fA-F]{6}$/;
      Object.values(TETROMINO_COLORS).forEach(color => {
        expect(color).to.match(hexColorRegex);
      });
    });

    it('should have correct standard colors', () => {
      expect(TETROMINO_COLORS.I).to.equal('#00f0f0'); // Cyan
      expect(TETROMINO_COLORS.O).to.equal('#f0f000'); // Yellow
      expect(TETROMINO_COLORS.T).to.equal('#a000f0'); // Purple
      expect(TETROMINO_COLORS.S).to.equal('#00f000'); // Green
      expect(TETROMINO_COLORS.Z).to.equal('#f00000'); // Red
      expect(TETROMINO_COLORS.J).to.equal('#0000f0'); // Blue
      expect(TETROMINO_COLORS.L).to.equal('#f0a000'); // Orange
    });

    it('should have unique colors for each piece', () => {
      const colors = Object.values(TETROMINO_COLORS);
      const uniqueColors = [...new Set(colors)];
      expect(uniqueColors).to.have.lengthOf(7);
    });
  });

  describe('TETROMINO_SPAWN_POSITIONS constant', () => {
    it('should contain spawn positions for all 7 tetromino types', () => {
      expect(TETROMINO_SPAWN_POSITIONS).to.be.an('object');
      const types = Object.keys(TETROMINO_SPAWN_POSITIONS);
      expect(types).to.have.lengthOf(7);
      expect(types).to.include.members(['I', 'O', 'T', 'S', 'Z', 'J', 'L']);
    });

    it('should have row and col properties for each position', () => {
      Object.values(TETROMINO_SPAWN_POSITIONS).forEach(position => {
        expect(position).to.have.property('row');
        expect(position).to.have.property('col');
        expect(position.row).to.be.a('number');
        expect(position.col).to.be.a('number');
      });
    });

    it('should have correct spawn positions', () => {
      expect(TETROMINO_SPAWN_POSITIONS.I).to.deep.equal({ row: 0, col: 3 });
      expect(TETROMINO_SPAWN_POSITIONS.O).to.deep.equal({ row: 0, col: 4 });
      expect(TETROMINO_SPAWN_POSITIONS.T).to.deep.equal({ row: 0, col: 3 });
      expect(TETROMINO_SPAWN_POSITIONS.S).to.deep.equal({ row: 0, col: 3 });
      expect(TETROMINO_SPAWN_POSITIONS.Z).to.deep.equal({ row: 0, col: 3 });
      expect(TETROMINO_SPAWN_POSITIONS.J).to.deep.equal({ row: 0, col: 3 });
      expect(TETROMINO_SPAWN_POSITIONS.L).to.deep.equal({ row: 0, col: 3 });
    });

    it('should have reasonable spawn positions for 10-column board', () => {
      Object.values(TETROMINO_SPAWN_POSITIONS).forEach(position => {
        expect(position.row).to.equal(0); // All spawn at top
        expect(position.col).to.be.at.least(0);
        expect(position.col).to.be.at.most(7); // Leave room for largest pieces
      });
    });
  });

  describe('rotate function', () => {
    it('should rotate a 2x2 matrix correctly', () => {
      const matrix = [
        [1, 2],
        [3, 4]
      ];
      const rotated = rotate(matrix);
      expect(rotated).to.deep.equal([
        [3, 1],
        [4, 2]
      ]);
    });

    it('should rotate a 3x3 matrix correctly', () => {
      const matrix = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
      ];
      const rotated = rotate(matrix);
      expect(rotated).to.deep.equal([
        [7, 4, 1],
        [8, 5, 2],
        [9, 6, 3]
      ]);
    });

    it('should rotate a 4x4 matrix correctly', () => {
      const matrix = [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 10, 11, 12],
        [13, 14, 15, 16]
      ];
      const rotated = rotate(matrix);
      expect(rotated).to.deep.equal([
        [13, 9, 5, 1],
        [14, 10, 6, 2],
        [15, 11, 7, 3],
        [16, 12, 8, 4]
      ]);
    });

    it('should rotate T tetromino correctly', () => {
      const tPiece = TETROMINOS.T;
      const rotated = rotate(tPiece);
      expect(rotated).to.deep.equal([
        [0, 3, 0],
        [0, 3, 3],
        [0, 3, 0]
      ]);
    });

    it('should rotate I tetromino correctly', () => {
      const iPiece = TETROMINOS.I;
      const rotated = rotate(iPiece);
      expect(rotated).to.deep.equal([
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0]
      ]);
    });

    it('should make O tetromino unchanged when rotated', () => {
      const oPiece = TETROMINOS.O;
      const rotated = rotate(oPiece);
      expect(rotated).to.deep.equal(oPiece);
    });

    it('should be reversible after 4 rotations', () => {
      const original = TETROMINOS.T;
      let rotated = rotate(original);
      rotated = rotate(rotated);
      rotated = rotate(rotated);
      rotated = rotate(rotated);
      expect(rotated).to.deep.equal(original);
    });

    it('should handle empty matrix', () => {
      const empty = [];
      expect(() => rotate(empty)).to.not.throw();
    });

    it('should handle single cell matrix', () => {
      const single = [[1]];
      const rotated = rotate(single);
      expect(rotated).to.deep.equal([[1]]);
    });

    it('should not mutate original matrix', () => {
      const original = [
        [1, 2],
        [3, 4]
      ];
      const originalCopy = JSON.parse(JSON.stringify(original));
      rotate(original);
      expect(original).to.deep.equal(originalCopy);
    });
  });

  describe('randomTetromino function', () => {
    it('should return an object with shape and type properties', () => {
      const tetromino = randomTetromino();
      expect(tetromino).to.be.an('object');
      expect(tetromino).to.have.property('shape');
      expect(tetromino).to.have.property('type');
    });

    it('should return valid tetromino type', () => {
      const tetromino = randomTetromino();
      expect(['I', 'O', 'T', 'S', 'Z', 'J', 'L']).to.include(tetromino.type);
    });

    it('should return correct shape for type', () => {
      // Run multiple times to test different pieces
      for (let i = 0; i < 20; i++) {
        const tetromino = randomTetromino();
        expect(tetromino.shape).to.deep.equal(TETROMINOS[tetromino.type]);
      }
    });

    it('should eventually return all piece types', () => {
      const foundTypes = new Set();
      // Run many times to get all types
      for (let i = 0; i < 100; i++) {
        const tetromino = randomTetromino();
        foundTypes.add(tetromino.type);
      }
      expect(foundTypes.size).to.equal(7);
    });

    it('should return different pieces on subsequent calls', () => {
      const pieces = [];
      for (let i = 0; i < 10; i++) {
        pieces.push(randomTetromino().type);
      }
      // Not all pieces should be the same (very unlikely)
      const uniquePieces = [...new Set(pieces)];
      expect(uniquePieces.length).to.be.greaterThan(1);
    });
  });

  describe('getTetromino function', () => {
    it('should return complete tetromino object for valid type', () => {
      const tetromino = getTetromino('I');
      expect(tetromino).to.be.an('object');
      expect(tetromino).to.have.property('type');
      expect(tetromino).to.have.property('shape');
      expect(tetromino).to.have.property('color');
      expect(tetromino).to.have.property('spawn');
    });

    it('should return correct data for I piece', () => {
      const iPiece = getTetromino('I');
      expect(iPiece.type).to.equal('I');
      expect(iPiece.shape).to.deep.equal(TETROMINOS.I);
      expect(iPiece.color).to.equal(TETROMINO_COLORS.I);
      expect(iPiece.spawn).to.deep.equal(TETROMINO_SPAWN_POSITIONS.I);
    });

    it('should return correct data for O piece', () => {
      const oPiece = getTetromino('O');
      expect(oPiece.type).to.equal('O');
      expect(oPiece.shape).to.deep.equal(TETROMINOS.O);
      expect(oPiece.color).to.equal(TETROMINO_COLORS.O);
      expect(oPiece.spawn).to.deep.equal(TETROMINO_SPAWN_POSITIONS.O);
    });

    it('should return correct data for T piece', () => {
      const tPiece = getTetromino('T');
      expect(tPiece.type).to.equal('T');
      expect(tPiece.shape).to.deep.equal(TETROMINOS.T);
      expect(tPiece.color).to.equal(TETROMINO_COLORS.T);
      expect(tPiece.spawn).to.deep.equal(TETROMINO_SPAWN_POSITIONS.T);
    });

    it('should work for all tetromino types', () => {
      const types = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
      types.forEach(type => {
        const tetromino = getTetromino(type);
        expect(tetromino.type).to.equal(type);
        expect(tetromino.shape).to.deep.equal(TETROMINOS[type]);
        expect(tetromino.color).to.equal(TETROMINO_COLORS[type]);
        expect(tetromino.spawn).to.deep.equal(TETROMINO_SPAWN_POSITIONS[type]);
      });
    });

    it('should return undefined properties for invalid type', () => {
      const invalid = getTetromino('X');
      expect(invalid.type).to.equal('X');
      expect(invalid.shape).to.be.undefined;
      expect(invalid.color).to.be.undefined;
      expect(invalid.spawn).to.be.undefined;
    });

    it('should handle null and undefined input', () => {
      const nullResult = getTetromino(null);
      expect(nullResult.type).to.be.null;
      
      const undefinedResult = getTetromino(undefined);
      expect(undefinedResult.type).to.be.undefined;
    });

    it('should not mutate original data structures', () => {
      const originalI = JSON.parse(JSON.stringify(TETROMINOS.I));
      const originalColor = TETROMINO_COLORS.I;
      const originalSpawn = JSON.parse(JSON.stringify(TETROMINO_SPAWN_POSITIONS.I));
      
      const tetromino = getTetromino('I');
      tetromino.shape[0][0] = 999; // Try to mutate
      tetromino.spawn.row = 999; // Try to mutate
      
      expect(TETROMINOS.I).to.deep.equal(originalI);
      expect(TETROMINO_COLORS.I).to.equal(originalColor);
      expect(TETROMINO_SPAWN_POSITIONS.I).to.deep.equal(originalSpawn);
    });
  });

  describe('Integration tests', () => {
    it('should have consistent data across all constants', () => {
      const tetrominoTypes = Object.keys(TETROMINOS);
      const colorTypes = Object.keys(TETROMINO_COLORS);
      const spawnTypes = Object.keys(TETROMINO_SPAWN_POSITIONS);
      
      expect(tetrominoTypes).to.deep.equal(colorTypes);
      expect(tetrominoTypes).to.deep.equal(spawnTypes);
    });

    it('should work together with getTetromino for all types', () => {
      Object.keys(TETROMINOS).forEach(type => {
        const tetromino = getTetromino(type);
        expect(tetromino.type).to.equal(type);
        expect(tetromino.shape).to.not.be.undefined;
        expect(tetromino.color).to.not.be.undefined;
        expect(tetromino.spawn).to.not.be.undefined;
      });
    });

    it('should allow rotation of all tetromino shapes', () => {
      Object.keys(TETROMINOS).forEach(type => {
        const shape = TETROMINOS[type];
        expect(() => rotate(shape)).to.not.throw();
        const rotated = rotate(shape);
        expect(rotated).to.be.an('array');
        expect(rotated.length).to.equal(shape.length);
      });
    });
  });
});
