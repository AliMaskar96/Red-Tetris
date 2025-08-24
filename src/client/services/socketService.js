import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect() {
    if (this.socket) return;
    
    this.socket = io('http://localhost:3004', {
      autoConnect: true,
      transports: ['websocket'],
      reconnection: true, // Enable reconnection
      reconnectionAttempts: 10, // Try up to 10 times
      reconnectionDelay: 1000, // Start with 1s delay
      reconnectionDelayMax: 5000 // Max 5s delay
    });

    this.socket.on('connect', () => {
      console.log('Connected to server:', this.socket.id);
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    // --- Reconnection event listeners ---
    this.socket.on('reconnect_attempt', (attempt) => {
      console.warn(`Reconnection attempt #${attempt}`);
    });
    this.socket.on('reconnect', (attempt) => {
      console.info(`Successfully reconnected on attempt #${attempt}`);
    });
    this.socket.on('reconnect_failed', () => {
      console.error('Reconnection failed after maximum attempts');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Room management
  joinRoom(roomId, playerName, isCreator = false) {
    if (this.socket) {
      console.log('Sending join-room:', { roomId, playerName, isCreator });
      this.socket.emit('join-room', { roomId, playerName, isCreator });
    } else {
      console.error('Socket not connected when trying to join room');
    }
  }

  startGame(gameId) {
    if (this.socket) {
      this.socket.emit('start-game', { gameId });
    }
  }

  // Game events
  sendPlayerMove(playerId, move) {
    if (this.socket) {
      this.socket.emit('player-move', { playerId, move });
    }
  }

  sendPiecePlaced(playerId, piece, newBoard) {
    if (this.socket) {
      this.socket.emit('piece-placed', { playerId, piece, newBoard });
    }
  }

  sendLinesCleared(playerId, linesCleared, newBoard, newScore) {
    if (this.socket) {
      this.socket.emit('lines-cleared', { playerId, linesCleared, newBoard, newScore });
    }
  }

  sendGameOver(playerId) {
    if (this.socket) {
      this.socket.emit('game-over', { playerId });
    }
  }

  // Send board update to server (for spectrum calculation)
  sendBoardUpdate(playerId, board) {
    if (this.socket) {
      this.socket.emit('board-update', { playerId, board });
    }
  }

  // Send score update to server
  sendScoreUpdate(playerId, score) {
    if (this.socket) {
      this.socket.emit('score-update', { playerId, score });
    }
  }

  // Send pause state to server
  sendPauseState(playerId, isPaused) {
    if (this.socket) {
      this.socket.emit('pause-state', { playerId, isPaused });
    }
  }

  // Send player ready for rematch
  sendPlayerReady(playerId) {
    if (this.socket) {
      this.socket.emit('player-ready-rematch', { playerId });
    }
  }

  // Leave room (when going to lobby)
  leaveRoom(playerId) {
    if (this.socket) {
      this.socket.emit('leave-room', { playerId });
    }
  }

  // Request next piece from server (for synchronized multiplayer)
  requestNextPiece(playerId) {
    if (this.socket) {
      this.socket.emit('request-next-piece', { playerId });
    }
  }

  // Event listeners setup
  onRoomJoined(callback) {
    if (this.socket) {
      this.socket.on('room-joined', (data) => {
        console.log('Received room-joined event:', data);
        callback(data);
      });
    }
  }

  onJoinError(callback) {
    if (this.socket) {
      this.socket.on('join-error', (data) => {
        console.log('Received join-error event:', data);
        callback(data);
      });
    }
  }

  onGameStarted(callback) {
    if (this.socket) {
      this.socket.on('game-started', callback);
    }
  }

  onNextPiece(callback) {
    if (this.socket) {
      this.socket.on('next-piece', callback);
    }
  }

  onPlayerMove(callback) {
    if (this.socket) {
      this.socket.on('player-move', callback);
    }
  }

  onPlayerSpectrum(callback) {
    if (this.socket) {
      this.socket.on('player-spectrum', callback);
    }
  }

  onPenaltyLines(callback) {
    if (this.socket) {
      this.socket.on('penalty-lines', callback);
    }
  }

  onPlayerBoardUpdated(callback) {
    if (this.socket) {
      this.socket.on('player-board-updated', callback);
    }
  }

  onPlayerScoreUpdated(callback) {
    if (this.socket) {
      this.socket.on('player-score-updated', callback);
    }
  }

  onPlayerEliminated(callback) {
    if (this.socket) {
      this.socket.on('player-eliminated', (data) => {
        console.log('🔥 Received player-eliminated event:', data);
        callback(data);
      });
    }
  }

  onGameEnd(callback) {
    if (this.socket) {
      this.socket.on('game-end', (data) => {
        console.log('🏆 Received game-end event:', data);
        callback(data);
      });
    }
  }

  // Remove listeners
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  removeAllListeners() {
    if (this.socket) {
      // Only remove game-specific events, keep connection events
      const eventsToRemove = [
        'room-joined',
        'join-error', 
        'game-started',
        'next-piece',
        'player-move',
        'player-spectrum',
        'penalty-lines',
        'player-board-updated',
        'player-score-updated',
        'player-eliminated',
        'game-end',
        'player-ready-rematch',
        'leave-room'
      ];
      
      eventsToRemove.forEach(event => {
        this.socket.off(event);
      });
    }
  }
}

export default new SocketService();
