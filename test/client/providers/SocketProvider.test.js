/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, act, waitFor } from '@testing-library/react';

// Create mock socket before any imports
const createMockSocket = () => ({
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
  id: 'mock-socket-id'
});

const mockSocket = createMockSocket();
const mockIo = jest.fn(() => mockSocket);

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: mockIo
}));

// Import after mocking
const { SocketProvider, useSocket } = require('../../../src/client/providers/SocketProvider');

// Test component to access socket context
const TestComponent = ({ onSocketAPI }) => {
  const socketAPI = useSocket();
  
  React.useEffect(() => {
    if (onSocketAPI) {
      onSocketAPI(socketAPI);
    }
  }, [socketAPI, onSocketAPI]);
  
  return (
    <div>
      <span data-testid="connection-status">
        {socketAPI.isConnected ? 'connected' : 'disconnected'}
      </span>
      <span data-testid="connection-error">
        {socketAPI.connectionError || 'no-error'}
      </span>
    </div>
  );
};

describe('SocketProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSocket.on.mockClear();
    mockSocket.off.mockClear();
    mockSocket.emit.mockClear();
    mockSocket.disconnect.mockClear();
    mockIo.mockClear();
  });

  describe('Provider Setup', () => {
    it('should create socket connection on mount', () => {
      render(
        <SocketProvider>
          <TestComponent />
        </SocketProvider>
      );

      expect(mockIo).toHaveBeenCalledWith('http://localhost:3004', {
        autoConnect: true,
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
      });
    });

    it('should setup connection event listeners', () => {
      render(
        <SocketProvider>
          <TestComponent />
        </SocketProvider>
      );

      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('reconnect_attempt', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('reconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('reconnect_failed', expect.any(Function));
    });

    it('should provide socket API through context', () => {
      let capturedSocketAPI = null;
      
      render(
        <SocketProvider>
          <TestComponent onSocketAPI={(api) => { capturedSocketAPI = api; }} />
        </SocketProvider>
      );

      expect(capturedSocketAPI).toBeDefined();
      expect(capturedSocketAPI).toHaveProperty('isConnected');
      expect(capturedSocketAPI).toHaveProperty('connectionError');
      expect(capturedSocketAPI).toHaveProperty('connect');
      expect(capturedSocketAPI).toHaveProperty('disconnect');
    });

    it('should throw error when useSocket is used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useSocket must be used within a SocketProvider');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Connection State Management', () => {
    it('should update connection status when connected', async () => {
      const { getByTestId } = render(
        <SocketProvider>
          <TestComponent />
        </SocketProvider>
      );

      // Initially disconnected
      expect(getByTestId('connection-status')).toHaveTextContent('disconnected');

      // Simulate connection
      act(() => {
        const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
        connectHandler();
      });

      await waitFor(() => {
        expect(getByTestId('connection-status')).toHaveTextContent('connected');
      });
    });

    it('should update connection status when disconnected', async () => {
      const { getByTestId } = render(
        <SocketProvider>
          <TestComponent />
        </SocketProvider>
      );

      // First connect
      act(() => {
        const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
        connectHandler();
      });

      await waitFor(() => {
        expect(getByTestId('connection-status')).toHaveTextContent('connected');
      });

      // Then disconnect
      act(() => {
        const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1];
        disconnectHandler();
      });

      await waitFor(() => {
        expect(getByTestId('connection-status')).toHaveTextContent('disconnected');
      });
    });

    it('should handle connection errors', async () => {
      const { getByTestId } = render(
        <SocketProvider>
          <TestComponent />
        </SocketProvider>
      );

      const errorMessage = 'Connection failed';
      
      act(() => {
        const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1];
        errorHandler({ message: errorMessage });
      });

      await waitFor(() => {
        expect(getByTestId('connection-error')).toHaveTextContent(errorMessage);
      });
    });

    it('should clear error on successful reconnection', async () => {
      const { getByTestId } = render(
        <SocketProvider>
          <TestComponent />
        </SocketProvider>
      );

      // First, set an error
      act(() => {
        const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1];
        errorHandler({ message: 'Connection failed' });
      });

      await waitFor(() => {
        expect(getByTestId('connection-error')).toHaveTextContent('Connection failed');
      });

      // Then reconnect successfully
      act(() => {
        const reconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'reconnect')[1];
        reconnectHandler(1);
      });

      await waitFor(() => {
        expect(getByTestId('connection-error')).toHaveTextContent('no-error');
        expect(getByTestId('connection-status')).toHaveTextContent('connected');
      });
    });
  });

  describe('Socket API Methods', () => {
    let socketAPI;

    beforeEach(() => {
      render(
        <SocketProvider>
          <TestComponent onSocketAPI={(api) => { socketAPI = api; }} />
        </SocketProvider>
      );
    });

    describe('Room Management', () => {
      it('should call joinRoom correctly', () => {
        const roomId = 'TEST123';
        const playerName = 'TestPlayer';
        const isCreator = true;

        socketAPI.joinRoom(roomId, playerName, isCreator);

        expect(mockSocket.emit).toHaveBeenCalledWith('join-room', {
          roomId,
          playerName,
          isCreator
        });
      });

      it('should call startGame correctly', () => {
        const gameId = 'game-123';

        socketAPI.startGame(gameId);

        expect(mockSocket.emit).toHaveBeenCalledWith('start-game', { gameId });
      });

      it('should call leaveRoom correctly', () => {
        const playerId = 'player-123';

        socketAPI.leaveRoom(playerId);

        expect(mockSocket.emit).toHaveBeenCalledWith('leave-room', { playerId });
      });
    });

    describe('Game Events', () => {
      it('should send player move correctly', () => {
        const playerId = 'player-123';
        const move = 'left';

        socketAPI.sendPlayerMove(playerId, move);

        expect(mockSocket.emit).toHaveBeenCalledWith('player-move', { playerId, move });
      });

      it('should send piece placed correctly', () => {
        const playerId = 'player-123';
        const piece = { type: 'I', position: [0, 4] };
        const newBoard = Array(20).fill().map(() => Array(10).fill(0));

        socketAPI.sendPiecePlaced(playerId, piece, newBoard);

        expect(mockSocket.emit).toHaveBeenCalledWith('piece-placed', {
          playerId,
          piece,
          newBoard
        });
      });

      it('should send lines cleared correctly', () => {
        const playerId = 'player-123';
        const linesCleared = 2;
        const newBoard = Array(20).fill().map(() => Array(10).fill(0));
        const newScore = 200;

        socketAPI.sendLinesCleared(playerId, linesCleared, newBoard, newScore);

        expect(mockSocket.emit).toHaveBeenCalledWith('lines-cleared', {
          playerId,
          linesCleared,
          newBoard,
          newScore
        });
      });

      it('should send game over correctly', () => {
        const playerId = 'player-123';

        socketAPI.sendGameOver(playerId);

        expect(mockSocket.emit).toHaveBeenCalledWith('game-over', { playerId });
      });

      it('should send board update correctly', () => {
        const playerId = 'player-123';
        const board = Array(20).fill().map(() => Array(10).fill(0));

        socketAPI.sendBoardUpdate(playerId, board);

        expect(mockSocket.emit).toHaveBeenCalledWith('board-update', { playerId, board });
      });

      it('should send score update correctly', () => {
        const playerId = 'player-123';
        const score = 1000;

        socketAPI.sendScoreUpdate(playerId, score);

        expect(mockSocket.emit).toHaveBeenCalledWith('score-update', { playerId, score });
      });

      it('should send pause state correctly', () => {
        const playerId = 'player-123';
        const isPaused = true;

        socketAPI.sendPauseState(playerId, isPaused);

        expect(mockSocket.emit).toHaveBeenCalledWith('pause-state', { playerId, isPaused });
      });

      it('should send player ready correctly', () => {
        const playerId = 'player-123';

        socketAPI.sendPlayerReady(playerId);

        expect(mockSocket.emit).toHaveBeenCalledWith('player-ready-rematch', { playerId });
      });
    });

    describe('Event Listeners', () => {
      it('should setup room joined listener', () => {
        const callback = jest.fn();

        socketAPI.onRoomJoined(callback);

        expect(mockSocket.on).toHaveBeenCalledWith('room-joined', expect.any(Function));
      });

      it('should setup join error listener', () => {
        const callback = jest.fn();

        socketAPI.onJoinError(callback);

        expect(mockSocket.on).toHaveBeenCalledWith('join-error', expect.any(Function));
      });

      it('should setup game started listener', () => {
        const callback = jest.fn();

        socketAPI.onGameStarted(callback);

        expect(mockSocket.on).toHaveBeenCalledWith('game-started', expect.any(Function));
      });

      it('should setup player move listener', () => {
        const callback = jest.fn();

        socketAPI.onPlayerMove(callback);

        expect(mockSocket.on).toHaveBeenCalledWith('player-move', callback);
      });

      it('should setup penalty lines listener', () => {
        const callback = jest.fn();

        socketAPI.onPenaltyLines(callback);

        expect(mockSocket.on).toHaveBeenCalledWith('penalty-lines', expect.any(Function));
      });

      it('should setup player board updated listener', () => {
        const callback = jest.fn();

        socketAPI.onPlayerBoardUpdated(callback);

        expect(mockSocket.on).toHaveBeenCalledWith('player-board-updated', expect.any(Function));
      });

      it('should setup player eliminated listener', () => {
        const callback = jest.fn();

        socketAPI.onPlayerEliminated(callback);

        expect(mockSocket.on).toHaveBeenCalledWith('player-eliminated', expect.any(Function));
      });

      it('should setup game end listener', () => {
        const callback = jest.fn();

        socketAPI.onGameEnd(callback);

        expect(mockSocket.on).toHaveBeenCalledWith('game-end', expect.any(Function));
      });
    });

    describe('Utility Methods', () => {
      it('should remove specific event listener', () => {
        const callback = jest.fn();

        socketAPI.off('test-event', callback);

        expect(mockSocket.off).toHaveBeenCalledWith('test-event', callback);
      });

      it('should remove all listeners', () => {
        socketAPI.removeAllListeners();

        const expectedEvents = [
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

        expectedEvents.forEach(event => {
          expect(mockSocket.off).toHaveBeenCalledWith(event);
        });
      });
    });
  });

  describe('Cleanup', () => {
      it('should setup socket connection properly', () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    // Verify socket was created and configured
    expect(mockIo).toHaveBeenCalledWith('http://localhost:3004', {
      autoConnect: true,
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });
    
    // Verify all connection event listeners were set up
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('reconnect_attempt', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('reconnect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('reconnect_failed', expect.any(Function));
  });

    it('should handle null socket gracefully', () => {
      let socketAPI;
      
      render(
        <SocketProvider>
          <TestComponent onSocketAPI={(api) => { socketAPI = api; }} />
        </SocketProvider>
      );

      // Should not throw when socket is null
      expect(() => {
        socketAPI.disconnect();
        socketAPI.joinRoom('test', 'player');
        socketAPI.onRoomJoined(() => {});
        socketAPI.off('test-event', () => {});
        socketAPI.removeAllListeners();
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
      it('should handle socket emit errors gracefully', () => {
    let socketAPI;
    
    render(
      <SocketProvider>
        <TestComponent onSocketAPI={(api) => { socketAPI = api; }} />
      </SocketProvider>
    );

    // Mock console.error to capture error logs
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    mockSocket.emit.mockImplementation(() => {
      throw new Error('Socket error');
    });

    // Should not crash the app - the error is caught and logged
    socketAPI.joinRoom('test', 'player');
    
    // Verify error was logged (the socket service logs errors internally)
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

    it('should log connection errors to console', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <SocketProvider>
          <TestComponent />
        </SocketProvider>
      );

      const error = new Error('Connection failed');
      
      act(() => {
        const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1];
        errorHandler(error);
      });

      expect(consoleSpy).toHaveBeenCalledWith('🚨 Connection error:', error);
      
      consoleSpy.mockRestore();
    });
  });
});
