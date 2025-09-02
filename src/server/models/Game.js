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
    
    // 🕰️ SYNCHRONIZATION: Server-controlled timing
    this.gameLoop = null; // Game loop interval
    this.gameSpeed = 500; // ms between gravity drops
    this.tickCount = 0; // Game ticks counter
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

  startGame(roomId, initialPieces = null) {
    this.status = 'playing';
    this.roomId = roomId;
    this.winner = null;
    
    // Store initial batch of pieces or generate them
    if (initialPieces && Array.isArray(initialPieces)) {
      this.pieceSequence = initialPieces;
    } else {
      // Import here to avoid circular dependencies
      const { generatePieceBatch } = require('../utils/pieceGenerator.js');
      this.pieceSequence = generatePieceBatch(roomId, 0, this.initialBatchSize);
    }
    
    // Initialize pieces for all players
    this.players.forEach(player => {
      player.initializePieces(this.pieceSequence);
    });
  }

  // Get next piece for a specific player using on-demand generation
  distributeNextPieceForPlayer(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found in game`);
    }
    
    // Check if we need to generate more pieces
    const currentIndex = player.pieceIndex;
    if (currentIndex >= this.pieceSequence.length - 10) {
      // Generate more pieces when we're close to running out
      const { generatePieceBatch } = require('../utils/pieceGenerator.js');
      const newBatch = generatePieceBatch(this.roomId, this.pieceSequence.length, this.initialBatchSize);
      this.pieceSequence.push(...newBatch);
    }
    
    return player.advancePiece(this.pieceSequence);
  }

  // Get current piece for a specific player
  getCurrentPieceForPlayer(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return null;
    return player.currentPiece;
  }

  // Get next piece for a specific player (without advancing)
  getNextPieceForPlayer(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return null;
    return player.nextPiece;
  }

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
    this.stopGameLoop(); // Stop the game loop when game ends
  }

  // 🕰️ SYNCHRONIZATION: Start server-controlled game loop
  startGameLoop(io, roomId) {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
    }
    
    this.tickCount = 0;
    this.gameLoop = setInterval(() => {
      if (this.status !== 'playing') {
        this.stopGameLoop();
        return;
      }
      
      this.tickCount++;
      
      // Broadcast gravity tick to all players
      io.to(roomId).emit('gravity-tick', { 
        tickCount: this.tickCount,
        gameSpeed: this.gameSpeed 
      });
      
      console.log(`🕰️ Game ${this.id} tick ${this.tickCount} sent to room ${roomId}`);
    }, this.gameSpeed);
    
    console.log(`🕰️ Started game loop for game ${this.id} in room ${roomId} with ${this.gameSpeed}ms intervals`);
  }

  // 🕰️ SYNCHRONIZATION: Stop server-controlled game loop
  stopGameLoop() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
      console.log(`🕰️ Stopped game loop for game ${this.id}`);
    }
  }

  // 🕰️ SYNCHRONIZATION: Update game speed (for increasing difficulty)
  setGameSpeed(newSpeed) {
    this.gameSpeed = newSpeed;
    // The game loop will need to be restarted externally with new speed
    // This avoids circular dependency issues
  }

  getAlivePlayers() {
    return this.players.filter(p => p.isAlive);
  }
}

export default Game; 