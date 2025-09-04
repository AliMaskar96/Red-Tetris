// Game model
class Game {
  constructor({ id, players = [], status = 'waiting', pieceSequence = [], currentPieceIndex = 0 }) {
    if (!id) {
      throw new Error('Game requires an id');
    }
    this.id = id;
    this.players = players; // Array of Player instances
    this.status = status; // 'waiting' | 'playing' | 'ended'
    this.pieceSequence = pieceSequence; // Array of piece types/objects (for initial batch)
    this.currentPieceIndex = currentPieceIndex;
    this.winner = null;
    
    // New: Room-based piece generation
    this.roomId = null; // Will be set when starting game
    this.initialBatchSize = 50; // Initial pieces to pre-generate
    
    // 🕰️ RESTORED: No server-controlled timing - clients handle their own game loops
  }

  addPlayer(player) {
    if (!player || typeof player !== 'object' || typeof player.id === 'undefined') {
      throw new Error('addPlayer requires a valid Player instance');
    }
    this.players.push(player);
  }

  removePlayer(playerId) {
    this.players = this.players.filter(p => p.id !== playerId);
  }

  startGame(roomId, sharedSeed = null) {
    this.status = 'playing';
    this.roomId = roomId;
    this.winner = null;
    
    // Store shared seed for client-side piece generation
    this.sharedSeed = sharedSeed || Math.floor(Math.random() * 1000000);
    
    // No longer need to initialize pieces on server - clients handle this
  }

  // 🕰️ REMOVED: Server-side piece distribution - clients now handle piece generation locally

  // Legacy methods kept for compatibility
  distributeNextPiece() {
    // This method is now deprecated in favor of distributeNextPieceForPlayer
    console.warn('distributeNextPiece is deprecated, use distributeNextPieceForPlayer instead');
    if (this.currentPieceIndex < this.pieceSequence.length) {
      const piece = this.pieceSequence[this.currentPieceIndex];
      this.currentPieceIndex += 1;
      return piece;
    }
    return null;
  }

  getCurrentPiece() {
    if (this.currentPieceIndex > 0 && this.currentPieceIndex <= this.pieceSequence.length) {
      return this.pieceSequence[this.currentPieceIndex - 1];
    }
    // Return first piece if we haven't started yet
    if (this.currentPieceIndex === 0 && this.pieceSequence.length > 0) {
      return this.pieceSequence[0];
    }
    return null;
  }

  getNextPiece() {
    if (this.currentPieceIndex < this.pieceSequence.length) {
      return this.pieceSequence[this.currentPieceIndex];
    }
    return null;
  }

  getPieceAt(index) {
    if (index >= 0 && index < this.pieceSequence.length) {
      return this.pieceSequence[index];
    }
    return null;
  }

  setWinner(playerId) {
    if (!this.players.some(p => p.id === playerId)) {
      throw new Error('Winner must be a valid player in the game');
    }
    this.status = 'ended';
    this.winner = playerId;
  }

  // 🕰️ REMOVED: Server-controlled game loop - clients now handle their own timing

  getAlivePlayers() {
    return this.players.filter(p => p.isAlive);
  }
}

export default Game; 