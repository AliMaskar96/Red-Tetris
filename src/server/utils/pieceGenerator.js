// Server-side piece generation utilities
const TETROMINO_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

// Simple seeded PRNG (mulberry32) for deterministic generation
function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Fisher-Yates shuffle with seeded PRNG
function shuffle(array, rng = Math.random) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 7-bag system: generates a bag with all 7 pieces shuffled
function generateBag(seed) {
  const rng = seed !== undefined ? mulberry32(seed) : Math.random;
  return shuffle(TETROMINO_TYPES, rng);
}

/**
 * Generates a deterministic piece sequence using 7-bag system
 * @param {number} length - Number of pieces to generate
 * @param {number} seed - Seed for deterministic generation
 * @returns {string[]} Array of piece types
 */
function generatePieceSequence(length, seed) {
  const sequence = [];
  let bagCount = Math.ceil(length / 7);
  
  for (let i = 0; i < bagCount; i++) {
    // Use different seed for each bag to maintain randomness while keeping determinism
    const bagSeed = seed !== undefined ? seed + i * 1000 : undefined;
    const bag = generateBag(bagSeed);
    sequence.push(...bag);
  }
  
  return sequence.slice(0, length);
}

/**
 * Creates a game-specific piece sequence with room ID as seed
 * @param {string} roomId - Room identifier to use as seed base
 * @param {number} length - Number of pieces to generate (default: 200)
 * @returns {string[]} Deterministic piece sequence for the room
 */
function createGameSequence(roomId, length = 200) {
  // Convert roomId to a numeric seed
  let seed = 0;
  for (let i = 0; i < roomId.length; i++) {
    seed = seed * 31 + roomId.charCodeAt(i);
  }
  
  // Add timestamp component to make sequences unique per game session
  // But round to hour to allow some reproducibility for testing
  const hourTimestamp = Math.floor(Date.now() / (1000 * 60 * 60));
  seed = seed * 1000 + (hourTimestamp % 1000);
  
  return generatePieceSequence(length, seed);
}

/**
 * Generate a specific piece at a given index for a room
 * This is more memory efficient than pre-generating 1000 pieces
 * @param {string} roomId - Room identifier
 * @param {number} pieceIndex - Index of the piece to generate
 * @returns {string} The piece type at that index
 */
function getPieceAtIndex(roomId, pieceIndex) {
  // Calculate which bag and position within bag
  const bagIndex = Math.floor(pieceIndex / 7);
  const positionInBag = pieceIndex % 7;
  
  // Generate seed for this specific bag
  let seed = 0;
  for (let i = 0; i < roomId.length; i++) {
    seed = seed * 31 + roomId.charCodeAt(i);
  }
  
  const hourTimestamp = Math.floor(Date.now() / (1000 * 60 * 60));
  seed = seed * 1000 + (hourTimestamp % 1000) + bagIndex * 1000;
  
  // Generate only the bag we need
  const bag = generateBag(seed);
  return bag[positionInBag];
}

/**
 * Generate pieces in batches to balance memory vs network efficiency
 * @param {string} roomId - Room identifier
 * @param {number} startIndex - Starting piece index
 * @param {number} batchSize - Number of pieces to generate (default: 50)
 * @returns {string[]} Array of piece types
 */
function generatePieceBatch(roomId, startIndex, batchSize = 50) {
  const pieces = [];
  for (let i = 0; i < batchSize; i++) {
    pieces.push(getPieceAtIndex(roomId, startIndex + i));
  }
  return pieces;
}

module.exports = {
  generatePieceSequence,
  createGameSequence,
  generateBag,
  getPieceAtIndex,
  generatePieceBatch,
  TETROMINO_TYPES
};