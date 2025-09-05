import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { io } from 'socket.io-client';

// ================================
// SOCKET CONTEXT - REACT MIDDLEWARE
// ================================
// Complete Socket.IO encapsulation using React Context + Hooks
// Follows functional programming paradigm - NO "this" keyword

const SocketContext = createContext();

// ================================
// SOCKET PROVIDER COMPONENT
// ================================
export const SocketProvider = ({ children }) => {
  // Internal socket state (private to provider)
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  // ================================
  // CONNECTION MANAGEMENT
  // ================================
  const connect = useCallback(() => {
    if (socket) return socket;
    
    console.log('🔌 Establishing socket connection...');
    const newSocket = io('http://localhost:3004', {
      autoConnect: true,
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('✅ Connected to server:', newSocket.id);
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('🚨 Connection error:', error);
      setConnectionError(error.message);
    });

    // Reconnection event handlers
    newSocket.on('reconnect_attempt', (attempt) => {
      console.warn(`🔄 Reconnection attempt #${attempt}`);
    });

    newSocket.on('reconnect', (attempt) => {
      console.info(`✅ Successfully reconnected on attempt #${attempt}`);
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('💥 Reconnection failed after maximum attempts');
      setConnectionError('Failed to reconnect to server');
    });

    setSocket(newSocket);
    return newSocket;
  }, [socket]);

  const disconnect = useCallback(() => {
    if (socket) {
      console.log('🔌 Disconnecting socket...');
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  // ================================
  // SOCKET API - OUTGOING EVENTS
  // ================================
  const socketAPI = useMemo(() => ({
    // Connection status
    isConnected,
    connectionError,
    
    // Connection management
    connect,
    disconnect,
    
    // Room management
    joinRoom: (roomId, playerName, isCreator = false) => {
      if (socket) {
        try {
          console.log('📡 Sending join-room:', { roomId, playerName, isCreator });
          socket.emit('join-room', { roomId, playerName, isCreator });
        } catch (error) {
          console.error('❌ Error sending join-room:', error);
        }
      } else {
        console.error('❌ Socket not connected when trying to join room');
      }
    },

    startGame: (gameId) => {
      if (socket) {
        console.log('📡 Sending start-game:', { gameId });
        socket.emit('start-game', { gameId });
      }
    },

    leaveRoom: (playerId) => {
      if (socket) {
        console.log('📡 Sending leave-room:', { playerId });
        socket.emit('leave-room', { playerId });
      }
    },

    // Game events
    sendPlayerMove: (playerId, move) => {
      if (socket) {
        socket.emit('player-move', { playerId, move });
      }
    },

    sendPiecePlaced: (playerId, piece, newBoard) => {
      if (socket) {
        socket.emit('piece-placed', { playerId, piece, newBoard });
      }
    },

    sendLinesCleared: (playerId, linesCleared, newBoard, newScore) => {
      if (socket) {
        socket.emit('lines-cleared', { playerId, linesCleared, newBoard, newScore });
      }
    },

    sendGameOver: (playerId) => {
      if (socket) {
        socket.emit('game-over', { playerId });
      }
    },

    sendBoardUpdate: (playerId, board) => {
      if (socket) {
        socket.emit('board-update', { playerId, board });
      }
    },

    sendScoreUpdate: (playerId, score) => {
      if (socket) {
        socket.emit('score-update', { playerId, score });
      }
    },

    sendPauseState: (playerId, isPaused) => {
      if (socket) {
        socket.emit('pause-state', { playerId, isPaused });
      }
    },

    sendPlayerReady: (playerId) => {
      if (socket) {
        socket.emit('player-ready-rematch', { playerId });
      }
    },

    // ================================
    // EVENT LISTENERS - INCOMING EVENTS
    // ================================
    onRoomJoined: (callback) => {
      if (socket) {
        socket.on('room-joined', (data) => {
          console.log('📨 Received room-joined event:', data);
          callback(data);
        });
      }
    },

    onJoinError: (callback) => {
      if (socket) {
        socket.on('join-error', (data) => {
          console.log('📨 Received join-error event:', data);
          callback(data);
        });
      }
    },

    onGameStarted: (callback) => {
      if (socket) {
        socket.on('game-started', (data) => {
          console.log('📨 Received game-started event:', data);
          callback(data);
        });
      }
    },

    onPlayerMove: (callback) => {
      if (socket) {
        socket.on('player-move', callback);
      }
    },

    onPlayerSpectrum: (callback) => {
      if (socket) {
        socket.on('player-spectrum', callback);
      }
    },

    onPenaltyLines: (callback) => {
      if (socket) {
        socket.on('penalty-lines', (data) => {
          console.log('📨 Received penalty-lines event:', data);
          callback(data);
        });
      }
    },

    onPlayerBoardUpdated: (callback) => {
      if (socket) {
        socket.on('player-board-updated', (data) => {
          console.log('📨 Received player-board-updated event:', data);
          callback(data);
        });
      }
    },

    onPlayerScoreUpdated: (callback) => {
      if (socket) {
        socket.on('player-score-updated', (data) => {
          console.log('📨 Received player-score-updated event:', data);
          callback(data);
        });
      }
    },

    onPlayerEliminated: (callback) => {
      if (socket) {
        socket.on('player-eliminated', (data) => {
          console.log('📨 Received player-eliminated event:', data);
          callback(data);
        });
      }
    },

    onGameEnd: (callback) => {
      if (socket) {
        socket.on('game-end', (data) => {
          console.log('📨 Received game-end event:', data);
          callback(data);
        });
      }
    },

    // ================================
    // UTILITY FUNCTIONS
    // ================================
    off: (event, callback) => {
      if (socket) {
        socket.off(event, callback);
      }
    },

    removeAllListeners: () => {
      if (socket) {
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
    }
  }), [socket, isConnected, connectionError, connect, disconnect]);

  // Auto-connect on provider mount
  useEffect(() => {
    connect();
    
    return () => {
      if (socket) {
        socketAPI.removeAllListeners();
        disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={socketAPI}>
      {children}
    </SocketContext.Provider>
  );
};

// ================================
// CUSTOM HOOK FOR SOCKET ACCESS
// ================================
export const useSocket = () => {
  const context = useContext(SocketContext);
  
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  
  return context;
};

// ================================
// EXPORTS
// ================================
export default SocketProvider;
