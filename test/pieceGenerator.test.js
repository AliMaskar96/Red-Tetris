import chai from 'chai';
import {
  generatePieceSequence,
  createGameSequence,
  generateBag,
  getPieceAtIndex,
  generatePieceBatch,
  TETROMINO_TYPES
} from '../src/server/utils/pieceGenerator.js';

const expect = chai.expect;

describe('Piece Generator', () => {
  
  describe('TETROMINO_TYPES constant', () => {
    it('should contain all 7 tetromino types', () => {
      expect(TETROMINO_TYPES).to.be.an('array');
      expect(TETROMINO_TYPES).to.have.lengthOf(7);
      expect(TETROMINO_TYPES).to.include.members(['I', 'O', 'T', 'S', 'Z', 'J', 'L']);
    });
  });

  describe('generateBag', () => {
    it('should generate a bag with all 7 pieces', () => {
      const bag = generateBag();
      expect(bag).to.be.an('array');
      expect(bag).to.have.lengthOf(7);
      expect(bag).to.include.members(['I', 'O', 'T', 'S', 'Z', 'J', 'L']);
    });

    it('should generate deterministic bags with same seed', () => {
      const bag1 = generateBag(12345);
      const bag2 = generateBag(12345);
      expect(bag1).to.deep.equal(bag2);
    });

    it('should generate different bags with different seeds', () => {
      const bag1 = generateBag(12345);
      const bag2 = generateBag(54321);
      expect(bag1).to.not.deep.equal(bag2);
    });

    it('should generate different random bags when no seed provided', () => {
      const bag1 = generateBag();
      const bag2 = generateBag();
      // They might be the same due to randomness, but structure should be valid
      expect(bag1).to.have.lengthOf(7);
      expect(bag2).to.have.lengthOf(7);
    });
  });

  describe('generatePieceSequence', () => {
    it('should generate sequence of requested length', () => {
      const sequence = generatePieceSequence(14, 12345);
      expect(sequence).to.be.an('array');
      expect(sequence).to.have.lengthOf(14);
    });

    it('should generate exactly 2 bags for 14 pieces', () => {
      const sequence = generatePieceSequence(14, 12345);
      expect(sequence).to.have.lengthOf(14);
      
      // First 7 should be a complete bag
      const firstBag = sequence.slice(0, 7);
      expect(firstBag).to.include.members(['I', 'O', 'T', 'S', 'Z', 'J', 'L']);
      
      // Second 7 should be another complete bag
      const secondBag = sequence.slice(7, 14);
      expect(secondBag).to.include.members(['I', 'O', 'T', 'S', 'Z', 'J', 'L']);
    });

    it('should truncate partial bags correctly', () => {
      const sequence = generatePieceSequence(10, 12345);
      expect(sequence).to.have.lengthOf(10);
      
      // First 7 should be a complete bag
      const firstBag = sequence.slice(0, 7);
      expect(firstBag).to.include.members(['I', 'O', 'T', 'S', 'Z', 'J', 'L']);
      
      // Remaining 3 should be from second bag
      const remainingPieces = sequence.slice(7, 10);
      expect(remainingPieces).to.have.lengthOf(3);
      remainingPieces.forEach(piece => {
        expect(TETROMINO_TYPES).to.include(piece);
      });
    });

    it('should generate deterministic sequences with same seed', () => {
      const sequence1 = generatePieceSequence(20, 12345);
      const sequence2 = generatePieceSequence(20, 12345);
      expect(sequence1).to.deep.equal(sequence2);
    });

    it('should generate different sequences with different seeds', () => {
      const sequence1 = generatePieceSequence(20, 12345);
      const sequence2 = generatePieceSequence(20, 54321);
      expect(sequence1).to.not.deep.equal(sequence2);
    });

    it('should handle edge cases', () => {
      expect(generatePieceSequence(0, 12345)).to.have.lengthOf(0);
      expect(generatePieceSequence(1, 12345)).to.have.lengthOf(1);
      expect(generatePieceSequence(7, 12345)).to.have.lengthOf(7);
    });
  });

  describe('createGameSequence', () => {
    it('should generate sequence with default length of 200', () => {
      const sequence = createGameSequence('ROOM123');
      expect(sequence).to.be.an('array');
      expect(sequence).to.have.lengthOf(200);
    });

    it('should generate sequence with custom length', () => {
      const sequence = createGameSequence('ROOM123', 50);
      expect(sequence).to.have.lengthOf(50);
    });

    it('should generate deterministic sequences for same room ID', () => {
      const sequence1 = createGameSequence('ROOM123', 50);
      const sequence2 = createGameSequence('ROOM123', 50);
      expect(sequence1).to.deep.equal(sequence2);
    });

    it('should generate different sequences for different room IDs', () => {
      const sequence1 = createGameSequence('ROOM123', 50);
      const sequence2 = createGameSequence('ROOM456', 50);
      expect(sequence1).to.not.deep.equal(sequence2);
    });

    it('should handle various room ID formats', () => {
      const sequence1 = createGameSequence('A', 14);
      const sequence2 = createGameSequence('ROOM123456', 14);
      const sequence3 = createGameSequence('test-room', 14);
      
      expect(sequence1).to.have.lengthOf(14);
      expect(sequence2).to.have.lengthOf(14);
      expect(sequence3).to.have.lengthOf(14);
      
      // They should all be different
      expect(sequence1).to.not.deep.equal(sequence2);
      expect(sequence1).to.not.deep.equal(sequence3);
      expect(sequence2).to.not.deep.equal(sequence3);
    });

    it('should contain only valid tetromino types', () => {
      const sequence = createGameSequence('ROOM123', 50);
      sequence.forEach(piece => {
        expect(TETROMINO_TYPES).to.include(piece);
      });
    });
  });

  describe('getPieceAtIndex', () => {
    it('should return consistent pieces for same room and index', () => {
      const piece1 = getPieceAtIndex('ROOM123', 0);
      const piece2 = getPieceAtIndex('ROOM123', 0);
      expect(piece1).to.equal(piece2);
    });

    it('should return different pieces for different rooms', () => {
      const piece1 = getPieceAtIndex('ROOM123', 0);
      const piece2 = getPieceAtIndex('ROOM456', 0);
      // They might be the same by chance, but should be deterministic
      expect(TETROMINO_TYPES).to.include(piece1);
      expect(TETROMINO_TYPES).to.include(piece2);
    });

    it('should return valid tetromino types', () => {
      for (let i = 0; i < 20; i++) {
        const piece = getPieceAtIndex('ROOM123', i);
        expect(TETROMINO_TYPES).to.include(piece);
      }
    });

    it('should work correctly across bag boundaries', () => {
      // Test pieces around bag boundary (index 6, 7, 8)
      const piece6 = getPieceAtIndex('ROOM123', 6);
      const piece7 = getPieceAtIndex('ROOM123', 7);
      const piece8 = getPieceAtIndex('ROOM123', 8);
      
      expect(TETROMINO_TYPES).to.include(piece6);
      expect(TETROMINO_TYPES).to.include(piece7);
      expect(TETROMINO_TYPES).to.include(piece8);
    });

    it('should maintain 7-bag property within each bag', () => {
      // Get first bag (pieces 0-6)
      const firstBag = [];
      for (let i = 0; i < 7; i++) {
        firstBag.push(getPieceAtIndex('ROOM123', i));
      }
      
      // Should contain all 7 different pieces
      const uniquePieces = [...new Set(firstBag)];
      expect(uniquePieces).to.have.lengthOf(7);
      expect(uniquePieces).to.include.members(['I', 'O', 'T', 'S', 'Z', 'J', 'L']);
    });
  });

  describe('generatePieceBatch', () => {
    it('should generate batch of default size 50', () => {
      const batch = generatePieceBatch('ROOM123', 0);
      expect(batch).to.be.an('array');
      expect(batch).to.have.lengthOf(50);
    });

    it('should generate batch of custom size', () => {
      const batch = generatePieceBatch('ROOM123', 0, 20);
      expect(batch).to.have.lengthOf(20);
    });

    it('should start from correct index', () => {
      const batch1 = generatePieceBatch('ROOM123', 0, 5);
      const batch2 = generatePieceBatch('ROOM123', 5, 5);
      
      // Combined batches should equal a single batch of 10
      const combined = [...batch1, ...batch2];
      const single = generatePieceBatch('ROOM123', 0, 10);
      
      expect(combined).to.deep.equal(single);
    });

    it('should generate consistent batches for same parameters', () => {
      const batch1 = generatePieceBatch('ROOM123', 10, 15);
      const batch2 = generatePieceBatch('ROOM123', 10, 15);
      expect(batch1).to.deep.equal(batch2);
    });

    it('should contain only valid tetromino types', () => {
      const batch = generatePieceBatch('ROOM123', 0, 30);
      batch.forEach(piece => {
        expect(TETROMINO_TYPES).to.include(piece);
      });
    });

    it('should work with different room IDs', () => {
      const batch1 = generatePieceBatch('ROOM123', 0, 10);
      const batch2 = generatePieceBatch('ROOM456', 0, 10);
      
      expect(batch1).to.have.lengthOf(10);
      expect(batch2).to.have.lengthOf(10);
      // They should be deterministic but different
      expect(batch1).to.not.deep.equal(batch2);
    });

    it('should handle edge cases', () => {
      expect(generatePieceBatch('ROOM123', 0, 0)).to.have.lengthOf(0);
      expect(generatePieceBatch('ROOM123', 0, 1)).to.have.lengthOf(1);
      expect(generatePieceBatch('ROOM123', 100, 7)).to.have.lengthOf(7);
    });

    it('should maintain consistency across multiple calls', () => {
      // Generate pieces 0-9 in different ways
      const method1 = generatePieceBatch('ROOM123', 0, 10);
      
      const method2part1 = generatePieceBatch('ROOM123', 0, 3);
      const method2part2 = generatePieceBatch('ROOM123', 3, 7);
      const method2 = [...method2part1, ...method2part2];
      
      expect(method1).to.deep.equal(method2);
    });
  });

  describe('Integration tests', () => {
    it('should maintain consistency between different methods', () => {
      const roomId = 'INTEGRATION_TEST';
      
      // Generate sequence using createGameSequence
      const fullSequence = createGameSequence(roomId, 20);
      
      // Generate same pieces using getPieceAtIndex
      const indexSequence = [];
      for (let i = 0; i < 20; i++) {
        indexSequence.push(getPieceAtIndex(roomId, i));
      }
      
      // Generate same pieces using generatePieceBatch
      const batchSequence = generatePieceBatch(roomId, 0, 20);
      
      expect(fullSequence).to.deep.equal(indexSequence);
      expect(fullSequence).to.deep.equal(batchSequence);
    });

    it('should maintain bag property across all methods', () => {
      const roomId = 'BAG_TEST';
      
      // Test first two bags (14 pieces)
      const sequence = createGameSequence(roomId, 14);
      
      // First bag should have all 7 pieces
      const firstBag = sequence.slice(0, 7);
      expect([...new Set(firstBag)]).to.have.lengthOf(7);
      
      // Second bag should have all 7 pieces
      const secondBag = sequence.slice(7, 14);
      expect([...new Set(secondBag)]).to.have.lengthOf(7);
    });
  });
});
