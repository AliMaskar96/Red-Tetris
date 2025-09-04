import { io } from 'socket.io-client';

// ================================
// FUNCTIONAL SOCKET SERVICE
// ================================
// Pure functional implementation - NO "this" keyword allowed on client-side

// Module-level state (private to this module)
let socket = null;
let isConnected = false;

// ================================
// CONNECTION MANAGEMENT
// ================================

const connect = () => {
  if (socket) return;
  
  socket = io('http://localhost:3004', {
    autoConnect: true,
    transports: ['websocket'],
    reconnection: true, // Enable reconnection
    reconnectionAttempts: 10, // Try up to 10 times
    reconnectionDelay: 1000, // Start with 1s delay
    reconnectionDelayMax: 5000 // Max 5s delay
  });

  socket.on('connect', () => {
    console.log('Connected to server:', socket.id);
    isConnected = true;
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
    isConnected = false;
  });

  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
  });

  // --- Reconnection event listeners ---
  socket.on('reconnect_attempt', (attempt) => {
    console.warn(`Reconnection attempt #${attempt}`);
  });
  socket.on('reconnect', (attempt) => {
    console.info(`Successfully reconnected on attempt #${attempt}`);
  });
  socket.on('reconnect_failed', () => {
    console.error('Reconnection failed after maximum attempts');
  });
};

const disconnect = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    isConnected = false;
  }
};

const getSocket = () => socket;
const getConnectionStatus = () => isConnected;

// ================================
// ROOM MANAGEMENT
// ================================

const joinRoom = (roomId, playerName, isCreator = false) => {
  if (socket) {
    console.log('Sending join-room:', { roomId, playerName, isCreator });
    socket.emit('join-room', { roomId, playerName, isCreator });
  } else {
    console.error('Socket not connected when trying to join room');
  }
};

const startGame = (gameId) => {
  if (socket) {
    socket.emit('start-game', { gameId });
  }
};

const leaveRoom = (playerId) => {
  if (socket) {
    socket.emit('leave-room', { playerId });
  }
};

// ================================
// GAME EVENTS (OUTGOING)
// ================================

const sendPlayerMove = (playerId, move) => {
  if (socket) {
    socket.emit('player-move', { playerId, move });
  }
};

const sendPiecePlaced = (playerId, piece, newBoard) => {
  if (socket) {
    socket.emit('piece-placed', { playerId, piece, newBoard });
  }
};

const sendLinesCleared = (playerId, linesCleared, newBoard, newScore) => {
  if (socket) {
    socket.emit('lines-cleared', { playerId, linesCleared, newBoard, newScore });
  }
};

const sendGameOver = (playerId) => {
  if (socket) {
    socket.emit('game-over', { playerId });
  }
};

const sendBoardUpdate = (playerId, board) => {
  if (socket) {
    socket.emit('board-update', { playerId, board });
  }
};

const sendScoreUpdate = (playerId, score) => {
  if (socket) {
    socket.emit('score-update', { playerId, score });
  }
};

const sendPauseState = (playerId, isPaused) => {
  if (socket) {
    socket.emit('pause-state', { playerId, isPaused });
  }
};

const sendPlayerReady = (playerId) => {
  if (socket) {
    socket.emit('player-ready-rematch', { playerId });
  }
};

// 🕰️ REMOVED: requestNextPiece - clients now handle piece generation locally

// ================================
// EVENT LISTENERS (INCOMING)
// ================================

const onRoomJoined = (callback) => {
  if (socket) {
    socket.on('room-joined', (data) => {
      console.log('Received room-joined event:', data);
      callback(data);
    });
  }
};

const onJoinError = (callback) => {
  if (socket) {
    socket.on('join-error', (data) => {
      console.log('Received join-error event:', data);
      callback(data);
    });
  }
};

const onGameStarted = (callback) => {
  if (socket) {
    socket.on('game-started', callback);
  }
};

// 🕰️ REMOVED: onNextPiece - clients now handle piece generation locally

const onPlayerMove = (callback) => {
  if (socket) {
    socket.on('player-move', callback);
  }
};

const onPlayerSpectrum = (callback) => {
  if (socket) {
    socket.on('player-spectrum', callback);
  }
};

const onPenaltyLines = (callback) => {
  if (socket) {
    socket.on('penalty-lines', callback);
  }
};

const onPlayerBoardUpdated = (callback) => {
  if (socket) {
    socket.on('player-board-updated', callback);
  }
};

const onPlayerScoreUpdated = (callback) => {
  if (socket) {
    socket.on('player-score-updated', callback);
  }
};

const onPlayerEliminated = (callback) => {
  if (socket) {
    socket.on('player-eliminated', (data) => {
      console.log('🔥 Received player-eliminated event:', data);
      callback(data);
    });
  }
};

const onGameEnd = (callback) => {
  if (socket) {
    socket.on('game-end', (data) => {
      console.log('🏆 Received game-end event:', data);
      callback(data);
    });
  }
};

// ================================
// UTILITY FUNCTIONS
// ================================

const off = (event, callback) => {
  if (socket) {
    socket.off(event, callback);
  }
};

const removeAllListeners = () => {
  if (socket) {
    // Only remove game-specific events, keep connection events
    const eventsToRemove = [
      'room-joined',
      'join-error', 
      'game-started',
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
      socket.off(event);
    });
  }
};

// ================================
// EXPORTS (FUNCTIONAL API)
// ================================

const socketService = {
  // Connection management
  connect,
  disconnect,
  getSocket,
  getConnectionStatus,
  
  // Room management
  joinRoom,
  startGame,
  leaveRoom,
  
  // Game events (outgoing)
  sendPlayerMove,
  sendPiecePlaced,
  sendLinesCleared,
  sendGameOver,
  sendBoardUpdate,
  sendScoreUpdate,
  sendPauseState,
  sendPlayerReady,
  
  // Event listeners (incoming)
  onRoomJoined,
  onJoinError,
  onGameStarted,
  onPlayerMove,
  onPlayerSpectrum,
  onPenaltyLines,
  onPlayerBoardUpdated,
  onPlayerScoreUpdated,
  onPlayerEliminated,
  onGameEnd,
  
  // Utilities
  off,
  removeAllListeners
};

export default socketService;