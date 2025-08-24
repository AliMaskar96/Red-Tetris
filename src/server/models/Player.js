// Player model
class Player {
  constructor({ id, name, socketId, gameId = null, isLeader = false, board = null, spectrum = null, isAlive = true, isPaused = false }) {
    if (!id || !name || !socketId) {
      throw new Error('Player requires id, name, and socketId');
    }
    this.id = id;
    this.name = name;
    this.socketId = socketId;
    this.gameId = gameId;
    this.isLeader = isLeader;
    this.isAlive = isAlive;
    this.isPaused = isPaused;
    // 20 rows x 10 columns, 0 = empty
    this.board = board || Array.from({ length: 20 }, () => Array(10).fill(0));
    // Spectrum: array of 10 numbers (heights per column)
    this.spectrum = spectrum || Array(10).fill(0);
    // Player's current score
    this.score = 0;
    
    // Individual piece tracking for synchronized multiplayer
    this.pieceIndex = 0; // Current piece index for this player
    this.currentPiece = null; // Current piece type
    this.nextPiece = null; // Next piece type
  }

  updateSpectrum(newSpectrum) {
    if (!Array.isArray(newSpectrum) || newSpectrum.length !== 10) {
      throw new Error('Spectrum must be an array of 10 numbers');
    }
    this.spectrum = newSpectrum;
  }

  setLeader(isLeader) {
    this.isLeader = !!isLeader;
  }

  setAlive(isAlive) {
    this.isAlive = !!isAlive;
  }

  setPaused(isPaused) {
    this.isPaused = !!isPaused;
  }

  // Score management
  setScore(score) {
    this.score = score || 0;
  }

  // Piece management methods
  setPieceIndex(index) {
    this.pieceIndex = index;
  }

  setCurrentPiece(piece) {
    this.currentPiece = piece;
  }

  setNextPiece(piece) {
    this.nextPiece = piece;
  }

  // Get next piece and advance index
  advancePiece(pieceSequence) {
    if (this.pieceIndex < pieceSequence.length) {
      this.currentPiece = pieceSequence[this.pieceIndex];
      this.nextPiece = this.pieceIndex + 1 < pieceSequence.length ? pieceSequence[this.pieceIndex + 1] : null;
      this.pieceIndex += 1;
      return this.currentPiece;
    }
    return null;
  }

  // Initialize pieces for game start
  initializePieces(pieceSequence) {
    this.pieceIndex = 0;
    this.currentPiece = pieceSequence[0];
    this.nextPiece = pieceSequence[1] || null;
    this.pieceIndex = 1; // Next call to advancePiece will give piece at index 1
  }
}

export default Player; 