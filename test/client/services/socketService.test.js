// Mock socket.io-client
const mockSocket = {
  id: 'test-socket-id',
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  disconnect: jest.fn(),
  connected: true
};

const mockIo = jest.fn(() => mockSocket);

jest.mock('socket.io-client', () => ({
  io: mockIo
}));

const socketService = require('../../../src/client/services/socketService').default;

describe('socketService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSocket.emit.mockClear();
    mockSocket.on.mockClear();
    mockSocket.off.mockClear();
    mockSocket.disconnect.mockClear();
    mockIo.mockClear();
  });

  afterEach(() => {
    socketService.disconnect();
  });

  describe('Connection Management', () => {
    test('connect should create socket with correct configuration', () => {
      socketService.connect();

      expect(mockIo).toHaveBeenCalledWith('http://localhost:3004', {
        autoConnect: true,
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
      });
    });

    test('connect should not create multiple sockets', () => {
      socketService.connect();
      socketService.connect();

      expect(mockIo).toHaveBeenCalledTimes(1);
    });

    test('connect should set up event listeners', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      socketService.connect();

      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('reconnect_attempt', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('reconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('reconnect_failed', expect.any(Function));
      
      consoleSpy.mockRestore();
    });

    test('disconnect should disconnect socket and reset state', () => {
      socketService.connect();
      socketService.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(socketService.getSocket()).toBeNull();
      expect(socketService.getConnectionStatus()).toBe(false);
    });

    test('getSocket should return current socket', () => {
      socketService.connect();
      expect(socketService.getSocket()).toBe(mockSocket);
    });

    test('getConnectionStatus should return connection status', () => {
      expect(socketService.getConnectionStatus()).toBe(false);
      
      socketService.connect();
      // Simulate connect event
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
      connectHandler();
      
      expect(socketService.getConnectionStatus()).toBe(true);
    });
  });

  describe('Room Management', () => {
    beforeEach(() => {
      socketService.connect();
    });

    test('joinRoom should emit join-room event with correct data', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      socketService.joinRoom('room123', 'testPlayer', true);

      expect(mockSocket.emit).toHaveBeenCalledWith('join-room', {
        roomId: 'room123',
        playerName: 'testPlayer',
        isCreator: true
      });
      
      consoleSpy.mockRestore();
    });

    test('joinRoom should handle missing socket gracefully', () => {
      socketService.disconnect();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      socketService.joinRoom('room123', 'testPlayer');

      expect(consoleSpy).toHaveBeenCalledWith('Socket not connected when trying to join room');
      consoleSpy.mockRestore();
    });

    test('startGame should emit start-game event', () => {
      socketService.startGame('game123');

      expect(mockSocket.emit).toHaveBeenCalledWith('start-game', { gameId: 'game123' });
    });

    test('leaveRoom should emit leave-room event', () => {
      socketService.leaveRoom('player123');

      expect(mockSocket.emit).toHaveBeenCalledWith('leave-room', { playerId: 'player123' });
    });
  });

  describe('Game Events (Outgoing)', () => {
    beforeEach(() => {
      socketService.connect();
    });

    test('sendPlayerMove should emit player-move event', () => {
      socketService.sendPlayerMove('player123', 'left');

      expect(mockSocket.emit).toHaveBeenCalledWith('player-move', {
        playerId: 'player123',
        move: 'left'
      });
    });

    test('sendPiecePlaced should emit piece-placed event', () => {
      const piece = { type: 'I', x: 4, y: 0 };
      const board = Array(20).fill().map(() => Array(10).fill(0));
      
      socketService.sendPiecePlaced('player123', piece, board);

      expect(mockSocket.emit).toHaveBeenCalledWith('piece-placed', {
        playerId: 'player123',
        piece,
        newBoard: board
      });
    });

    test('sendLinesCleared should emit lines-cleared event', () => {
      const board = Array(20).fill().map(() => Array(10).fill(0));
      
      socketService.sendLinesCleared('player123', 2, board, 1000);

      expect(mockSocket.emit).toHaveBeenCalledWith('lines-cleared', {
        playerId: 'player123',
        linesCleared: 2,
        newBoard: board,
        newScore: 1000
      });
    });

    test('sendGameOver should emit game-over event', () => {
      socketService.sendGameOver('player123');

      expect(mockSocket.emit).toHaveBeenCalledWith('game-over', { playerId: 'player123' });
    });

    test('sendBoardUpdate should emit board-update event', () => {
      const board = Array(20).fill().map(() => Array(10).fill(0));
      
      socketService.sendBoardUpdate('player123', board);

      expect(mockSocket.emit).toHaveBeenCalledWith('board-update', {
        playerId: 'player123',
        board
      });
    });

    test('sendScoreUpdate should emit score-update event', () => {
      socketService.sendScoreUpdate('player123', 1500);

      expect(mockSocket.emit).toHaveBeenCalledWith('score-update', {
        playerId: 'player123',
        score: 1500
      });
    });

    test('sendPauseState should emit pause-state event', () => {
      socketService.sendPauseState('player123', true);

      expect(mockSocket.emit).toHaveBeenCalledWith('pause-state', {
        playerId: 'player123',
        isPaused: true
      });
    });

    test('sendPlayerReady should emit player-ready-rematch event', () => {
      socketService.sendPlayerReady('player123');

      expect(mockSocket.emit).toHaveBeenCalledWith('player-ready-rematch', { playerId: 'player123' });
    });
  });

  describe('Event Listeners (Incoming)', () => {
    beforeEach(() => {
      socketService.connect();
    });

    test('onRoomJoined should set up room-joined listener', () => {
      const callback = jest.fn();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      socketService.onRoomJoined(callback);

      expect(mockSocket.on).toHaveBeenCalledWith('room-joined', expect.any(Function));
      
      // Simulate event
      const handler = mockSocket.on.mock.calls.find(call => call[0] === 'room-joined')[1];
      const testData = { gameId: 'game123' };
      handler(testData);
      
      expect(callback).toHaveBeenCalledWith(testData);
      consoleSpy.mockRestore();
    });

    test('onJoinError should set up join-error listener', () => {
      const callback = jest.fn();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      socketService.onJoinError(callback);

      expect(mockSocket.on).toHaveBeenCalledWith('join-error', expect.any(Function));
      
      // Simulate event
      const handler = mockSocket.on.mock.calls.find(call => call[0] === 'join-error')[1];
      const testData = { error: 'Room full' };
      handler(testData);
      
      expect(callback).toHaveBeenCalledWith(testData);
      consoleSpy.mockRestore();
    });

    test('onGameStarted should set up game-started listener', () => {
      const callback = jest.fn();
      
      socketService.onGameStarted(callback);

      expect(mockSocket.on).toHaveBeenCalledWith('game-started', callback);
    });

    test('onPlayerMove should set up player-move listener', () => {
      const callback = jest.fn();
      
      socketService.onPlayerMove(callback);

      expect(mockSocket.on).toHaveBeenCalledWith('player-move', callback);
    });

    test('onPlayerSpectrum should set up player-spectrum listener', () => {
      const callback = jest.fn();
      
      socketService.onPlayerSpectrum(callback);

      expect(mockSocket.on).toHaveBeenCalledWith('player-spectrum', callback);
    });

    test('onPenaltyLines should set up penalty-lines listener', () => {
      const callback = jest.fn();
      
      socketService.onPenaltyLines(callback);

      expect(mockSocket.on).toHaveBeenCalledWith('penalty-lines', callback);
    });

    test('onPlayerBoardUpdated should set up player-board-updated listener', () => {
      const callback = jest.fn();
      
      socketService.onPlayerBoardUpdated(callback);

      expect(mockSocket.on).toHaveBeenCalledWith('player-board-updated', callback);
    });

    test('onPlayerScoreUpdated should set up player-score-updated listener', () => {
      const callback = jest.fn();
      
      socketService.onPlayerScoreUpdated(callback);

      expect(mockSocket.on).toHaveBeenCalledWith('player-score-updated', callback);
    });

    test('onPlayerEliminated should set up player-eliminated listener', () => {
      const callback = jest.fn();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      socketService.onPlayerEliminated(callback);

      expect(mockSocket.on).toHaveBeenCalledWith('player-eliminated', expect.any(Function));
      
      // Simulate event
      const handler = mockSocket.on.mock.calls.find(call => call[0] === 'player-eliminated')[1];
      const testData = { playerId: 'player123' };
      handler(testData);
      
      expect(callback).toHaveBeenCalledWith(testData);
      consoleSpy.mockRestore();
    });

    test('onGameEnd should set up game-end listener', () => {
      const callback = jest.fn();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      socketService.onGameEnd(callback);

      expect(mockSocket.on).toHaveBeenCalledWith('game-end', expect.any(Function));
      
      // Simulate event
      const handler = mockSocket.on.mock.calls.find(call => call[0] === 'game-end')[1];
      const testData = { winner: 'player123' };
      handler(testData);
      
      expect(callback).toHaveBeenCalledWith(testData);
      consoleSpy.mockRestore();
    });
  });

  describe('Utilities', () => {
    beforeEach(() => {
      socketService.connect();
    });

    test('off should remove event listener', () => {
      const callback = jest.fn();
      
      socketService.off('test-event', callback);

      expect(mockSocket.off).toHaveBeenCalledWith('test-event', callback);
    });

    test('removeAllListeners should remove specific game events', () => {
      socketService.removeAllListeners();

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

    test('should handle operations when socket is null', () => {
      socketService.disconnect();
      
      // These should not throw errors
      socketService.startGame('game123');
      socketService.sendPlayerMove('player123', 'left');
      socketService.onGameStarted(() => {});
      socketService.off('test-event', () => {});
      socketService.removeAllListeners();
      
      // No assertions needed - just ensuring no errors are thrown
    });
  });
});
