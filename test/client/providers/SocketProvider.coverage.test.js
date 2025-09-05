/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';

// Create comprehensive mock socket before any imports
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

// Comprehensive test component that uses all socket methods
const ComprehensiveTestComponent = () => {
  const socketAPI = useSocket();
  const [logs, setLogs] = React.useState([]);
  
  const log = (message) => {
    setLogs(prev => [...prev, message]);
  };

  // Test all room management methods
  const testRoomMethods = () => {
    socketAPI.joinRoom('TEST123', 'TestPlayer', true);
    socketAPI.startGame('game-456');
    socketAPI.leaveRoom('player-789');
    log('Room methods tested');
  };

  // Test all game event methods
  const testGameMethods = () => {
    socketAPI.sendPlayerMove('player-123', 'left');
    socketAPI.sendPiecePlaced('player-123', { type: 'I' }, []);
    socketAPI.sendLinesCleared('player-123', 2, [], 200);
    socketAPI.sendGameOver('player-123');
    socketAPI.sendBoardUpdate('player-123', []);
    socketAPI.sendScoreUpdate('player-123', 1000);
    socketAPI.sendPauseState('player-123', true);
    socketAPI.sendPlayerReady('player-123');
    log('Game methods tested');
  };

  // Test all event listener methods
  const testListenerMethods = () => {
    const callback = () => {};
    socketAPI.onRoomJoined(callback);
    socketAPI.onJoinError(callback);
    socketAPI.onGameStarted(callback);
    socketAPI.onPlayerMove(callback);
    socketAPI.onPlayerSpectrum(callback);
    socketAPI.onPenaltyLines(callback);
    socketAPI.onPlayerBoardUpdated(callback);
    socketAPI.onPlayerScoreUpdated(callback);
    socketAPI.onPlayerEliminated(callback);
    socketAPI.onGameEnd(callback);
    log('Listener methods tested');
  };

  // Test utility methods
  const testUtilityMethods = () => {
    const callback = () => {};
    socketAPI.off('test-event', callback);
    socketAPI.removeAllListeners();
    log('Utility methods tested');
  };

  // Test connection methods
  const testConnectionMethods = () => {
    socketAPI.connect();
    socketAPI.disconnect();
    log('Connection methods tested');
  };

  return (
    <div>
      <div data-testid="connected">{socketAPI.isConnected ? 'true' : 'false'}</div>
      <div data-testid="error">{socketAPI.connectionError || 'none'}</div>
      
      <button data-testid="test-room" onClick={testRoomMethods}>
        Test Room Methods
      </button>
      <button data-testid="test-game" onClick={testGameMethods}>
        Test Game Methods
      </button>
      <button data-testid="test-listeners" onClick={testListenerMethods}>
        Test Listeners
      </button>
      <button data-testid="test-utilities" onClick={testUtilityMethods}>
        Test Utilities
      </button>
      <button data-testid="test-connection" onClick={testConnectionMethods}>
        Test Connection
      </button>
      
      <div data-testid="logs">
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>
    </div>
  );
};

describe('SocketProvider Coverage Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSocket.on.mockClear();
    mockSocket.off.mockClear();
    mockSocket.emit.mockClear();
    mockSocket.disconnect.mockClear();
    mockIo.mockClear();
  });

  it('should cover all room management methods', () => {
    render(
      <SocketProvider>
        <ComprehensiveTestComponent />
      </SocketProvider>
    );

    fireEvent.click(screen.getByTestId('test-room'));

    // Verify all room methods were called
    expect(mockSocket.emit).toHaveBeenCalledWith('join-room', {
      roomId: 'TEST123',
      playerName: 'TestPlayer',
      isCreator: true
    });
    expect(mockSocket.emit).toHaveBeenCalledWith('start-game', { gameId: 'game-456' });
    expect(mockSocket.emit).toHaveBeenCalledWith('leave-room', { playerId: 'player-789' });
    
    expect(screen.getByTestId('logs')).toHaveTextContent('Room methods tested');
  });

  it('should cover all game event methods', () => {
    render(
      <SocketProvider>
        <ComprehensiveTestComponent />
      </SocketProvider>
    );

    fireEvent.click(screen.getByTestId('test-game'));

    // Verify all game methods were called
    expect(mockSocket.emit).toHaveBeenCalledWith('player-move', {
      playerId: 'player-123',
      move: 'left'
    });
    expect(mockSocket.emit).toHaveBeenCalledWith('piece-placed', {
      playerId: 'player-123',
      piece: { type: 'I' },
      newBoard: []
    });
    expect(mockSocket.emit).toHaveBeenCalledWith('lines-cleared', {
      playerId: 'player-123',
      linesCleared: 2,
      newBoard: [],
      newScore: 200
    });
    expect(mockSocket.emit).toHaveBeenCalledWith('game-over', { playerId: 'player-123' });
    expect(mockSocket.emit).toHaveBeenCalledWith('board-update', {
      playerId: 'player-123',
      board: []
    });
    expect(mockSocket.emit).toHaveBeenCalledWith('score-update', {
      playerId: 'player-123',
      score: 1000
    });
    expect(mockSocket.emit).toHaveBeenCalledWith('pause-state', {
      playerId: 'player-123',
      isPaused: true
    });
    expect(mockSocket.emit).toHaveBeenCalledWith('player-ready-rematch', {
      playerId: 'player-123'
    });

    expect(screen.getByTestId('logs')).toHaveTextContent('Game methods tested');
  });

  it('should cover all event listener methods', () => {
    render(
      <SocketProvider>
        <ComprehensiveTestComponent />
      </SocketProvider>
    );

    fireEvent.click(screen.getByTestId('test-listeners'));

    // Verify all listener methods were called
    expect(mockSocket.on).toHaveBeenCalledWith('room-joined', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('join-error', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('game-started', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('player-move', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('player-spectrum', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('penalty-lines', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('player-board-updated', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('player-score-updated', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('player-eliminated', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('game-end', expect.any(Function));

    expect(screen.getByTestId('logs')).toHaveTextContent('Listener methods tested');
  });

  it('should cover utility methods', () => {
    render(
      <SocketProvider>
        <ComprehensiveTestComponent />
      </SocketProvider>
    );

    fireEvent.click(screen.getByTestId('test-utilities'));

    // Verify utility methods were called
    expect(mockSocket.off).toHaveBeenCalledWith('test-event', expect.any(Function));
    
    // Verify removeAllListeners calls off for each event
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

    expect(screen.getByTestId('logs')).toHaveTextContent('Utility methods tested');
  });

  it('should cover connection methods', () => {
    render(
      <SocketProvider>
        <ComprehensiveTestComponent />
      </SocketProvider>
    );

    fireEvent.click(screen.getByTestId('test-connection'));

    // connect() should not create a new socket if one already exists
    expect(mockIo).toHaveBeenCalledTimes(1); // Only the initial call

    // disconnect should call socket.disconnect
    expect(mockSocket.disconnect).toHaveBeenCalled();

    expect(screen.getByTestId('logs')).toHaveTextContent('Connection methods tested');
  });

  it('should handle reconnection events', () => {
    render(
      <SocketProvider>
        <ComprehensiveTestComponent />
      </SocketProvider>
    );

    // Test reconnection attempt
    act(() => {
      const reconnectAttemptHandler = mockSocket.on.mock.calls
        .find(call => call[0] === 'reconnect_attempt')[1];
      reconnectAttemptHandler(3);
    });

    // Test successful reconnection
    act(() => {
      const reconnectHandler = mockSocket.on.mock.calls
        .find(call => call[0] === 'reconnect')[1];
      reconnectHandler(3);
    });

    expect(screen.getByTestId('connected')).toHaveTextContent('true');
    expect(screen.getByTestId('error')).toHaveTextContent('none');

    // Test reconnection failure
    act(() => {
      const reconnectFailedHandler = mockSocket.on.mock.calls
        .find(call => call[0] === 'reconnect_failed')[1];
      reconnectFailedHandler();
    });

    expect(screen.getByTestId('error')).toHaveTextContent('Failed to reconnect to server');
  });

  it('should handle socket operations when socket is null', () => {
    // Create a component that tries to use socket API before connection
    const TestNullSocket = () => {
      const socketAPI = useSocket();
      
      React.useEffect(() => {
        // Try to use socket methods when socket might be null
        socketAPI.joinRoom('TEST', 'Player');
        socketAPI.onRoomJoined(() => {});
        socketAPI.off('test', () => {});
        socketAPI.removeAllListeners();
      }, [socketAPI]);
      
      return <div data-testid="null-test">Testing null socket</div>;
    };

    // This should not throw errors
    expect(() => {
      render(
        <SocketProvider>
          <TestNullSocket />
        </SocketProvider>
      );
    }).not.toThrow();

    expect(screen.getByTestId('null-test')).toBeInTheDocument();
  });

  it('should handle all socket events with callbacks', () => {
    render(
      <SocketProvider>
        <ComprehensiveTestComponent />
      </SocketProvider>
    );

    // First trigger the event listeners by calling them
    fireEvent.click(screen.getByTestId('test-listeners'));

    // Test room-joined event with callback
    const mockRoomData = { game: { id: 'test' }, players: [] };
    const roomJoinedCall = mockSocket.on.mock.calls.find(call => call[0] === 'room-joined');
    if (roomJoinedCall) {
      act(() => {
        roomJoinedCall[1](mockRoomData);
      });
    }

    // Test other events similarly
    const events = [
      { name: 'join-error', data: { message: 'Room full' } },
      { name: 'game-started', data: { gameId: 'test', sharedSeed: 123 } },
      { name: 'penalty-lines', data: { playerId: 'test', count: 2 } },
      { name: 'player-board-updated', data: { playerId: 'test', board: [], spectrum: [] } },
      { name: 'player-score-updated', data: { playerId: 'test', score: 100 } },
      { name: 'player-eliminated', data: { playerId: 'test', playerName: 'TestPlayer' } },
      { name: 'game-end', data: { winnerId: 'test', winnerName: 'Winner' } }
    ];

    events.forEach(({ name, data }) => {
      const eventCall = mockSocket.on.mock.calls.find(call => call[0] === name);
      if (eventCall) {
        act(() => {
          eventCall[1](data);
        });
      }
    });

    // All events should have been handled without errors
    expect(screen.getByTestId('connected')).toBeInTheDocument();
  });

  it('should handle disconnect event', () => {
    render(
      <SocketProvider>
        <ComprehensiveTestComponent />
      </SocketProvider>
    );

    // First connect
    act(() => {
      const connectHandler = mockSocket.on.mock.calls
        .find(call => call[0] === 'connect')[1];
      connectHandler();
    });

    expect(screen.getByTestId('connected')).toHaveTextContent('true');

    // Then disconnect
    act(() => {
      const disconnectHandler = mockSocket.on.mock.calls
        .find(call => call[0] === 'disconnect')[1];
      disconnectHandler();
    });

    expect(screen.getByTestId('connected')).toHaveTextContent('false');
  });
});
