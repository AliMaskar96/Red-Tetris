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
    
    // 🕰️ REMOVED: Server-side piece tracking - clients now handle piece generation
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

  // 🕰️ REMOVED: Server-side piece management - clients now handle piece generation locally
}

export default Player; 