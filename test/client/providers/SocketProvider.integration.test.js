/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, act, fireEvent, waitFor, screen } from '@testing-library/react';

// Create mock socket before any imports - same pattern as working tests
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

// Mock components that use socket functionality
const MockGameComponent = () => {
  const socketAPI = useSocket();
  const [gameState, setGameState] = React.useState({
    roomId: null,
    players: [],
    gameStarted: false,
    error: null
  });

  React.useEffect(() => {
    // Setup event listeners
    const handleRoomJoined = ({ game, players }) => {
      setGameState(prev => ({
        ...prev,
        roomId: game.id,
        players,
        error: null
      }));
    };

    const handleJoinError = ({ message }) => {
      setGameState(prev => ({
        ...prev,
        error: message
      }));
    };

    const handleGameStarted = ({ gameId }) => {
      setGameState(prev => ({
        ...prev,
        gameStarted: true
      }));
    };

    socketAPI.onRoomJoined(handleRoomJoined);
    socketAPI.onJoinError(handleJoinError);
    socketAPI.onGameStarted(handleGameStarted);
  }, [socketAPI]);

  const handleJoinRoom = () => {
    socketAPI.joinRoom('TEST123', 'TestPlayer', false);
  };

  const handleStartGame = () => {
    socketAPI.startGame('game-123');
  };

  const handleSendMove = () => {
    socketAPI.sendPlayerMove('player-123', 'left');
  };

  return (
    <div>
      <div data-testid="connection-status">
        {socketAPI.isConnected ? 'connected' : 'disconnected'}
      </div>
      <div data-testid="room-id">{gameState.roomId || 'no-room'}</div>
      <div data-testid="players-count">{gameState.players.length}</div>
      <div data-testid="game-started">{gameState.gameStarted ? 'started' : 'not-started'}</div>
      <div data-testid="error">{gameState.error || 'no-error'}</div>
      
      <button data-testid="join-room-btn" onClick={handleJoinRoom}>
        Join Room
      </button>
      <button data-testid="start-game-btn" onClick={handleStartGame}>
        Start Game
      </button>
      <button data-testid="send-move-btn" onClick={handleSendMove}>
        Send Move
      </button>
    </div>
  );
};

const MockMultiplayerComponent = () => {
  const socketAPI = useSocket();
  const [multiplayerState, setMultiplayerState] = React.useState({
    eliminatedPlayers: [],
    gameEnded: false,
    winner: null,
    penaltyLines: 0
  });

  React.useEffect(() => {
    const handlePlayerEliminated = ({ playerId, playerName }) => {
      setMultiplayerState(prev => ({
        ...prev,
        eliminatedPlayers: [...prev.eliminatedPlayers, { id: playerId, name: playerName }]
      }));
    };

    const handleGameEnd = ({ winnerId, winnerName }) => {
      setMultiplayerState(prev => ({
        ...prev,
        gameEnded: true,
        winner: { id: winnerId, name: winnerName }
      }));
    };

    const handlePenaltyLines = ({ playerId, count }) => {
      setMultiplayerState(prev => ({
        ...prev,
        penaltyLines: prev.penaltyLines + count
      }));
    };

    socketAPI.onPlayerEliminated(handlePlayerEliminated);
    socketAPI.onGameEnd(handleGameEnd);
    socketAPI.onPenaltyLines(handlePenaltyLines);
  }, [socketAPI]);

  const handleSendLinesCleared = () => {
    const board = Array(20).fill().map(() => Array(10).fill(0));
    socketAPI.sendLinesCleared('player-123', 2, board, 200);
  };

  const handleSendGameOver = () => {
    socketAPI.sendGameOver('player-123');
  };

  return (
    <div>
      <div data-testid="eliminated-count">{multiplayerState.eliminatedPlayers.length}</div>
      <div data-testid="game-ended">{multiplayerState.gameEnded ? 'ended' : 'playing'}</div>
      <div data-testid="winner">{multiplayerState.winner?.name || 'no-winner'}</div>
      <div data-testid="penalty-lines">{multiplayerState.penaltyLines}</div>
      
      <button data-testid="send-lines-cleared-btn" onClick={handleSendLinesCleared}>
        Send Lines Cleared
      </button>
      <button data-testid="send-game-over-btn" onClick={handleSendGameOver}>
        Send Game Over
      </button>
    </div>
  );
};

describe('SocketProvider Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSocket.on.mockClear();
    mockSocket.off.mockClear();
    mockSocket.emit.mockClear();
    mockSocket.disconnect.mockClear();
    mockIo.mockClear();
  });

  describe('Room Management Integration', () => {
    it('should handle complete room join flow', async () => {
      render(
        <SocketProvider>
          <MockGameComponent />
        </SocketProvider>
      );

      // Initially no room
      expect(screen.getByTestId('room-id')).toHaveTextContent('no-room');
      expect(screen.getByTestId('players-count')).toHaveTextContent('0');

      // Click join room button
      fireEvent.click(screen.getByTestId('join-room-btn'));

      // Verify socket emit was called
      expect(mockSocket.emit).toHaveBeenCalledWith('join-room', {
        roomId: 'TEST123',
        playerName: 'TestPlayer',
        isCreator: false
      });

      // Simulate server response
      const mockGameData = {
        game: { id: 'game-123' },
        players: [
          { id: 'player-1', name: 'TestPlayer' },
          { id: 'player-2', name: 'OtherPlayer' }
        ]
      };

      // Find and call the room-joined handler
      const roomJoinedCall = mockSocket.on.mock.calls.find(call => call[0] === 'room-joined');
      if (roomJoinedCall) {
        act(() => {
          roomJoinedCall[1](mockGameData);
        });
      }

      // Verify UI updated
      await waitFor(() => {
        expect(screen.getByTestId('room-id')).toHaveTextContent('game-123');
        expect(screen.getByTestId('players-count')).toHaveTextContent('2');
        expect(screen.getByTestId('error')).toHaveTextContent('no-error');
      });
    });

    it('should handle join room error', async () => {
      render(
        <SocketProvider>
          <MockGameComponent />
        </SocketProvider>
      );

      // Click join room button
      fireEvent.click(screen.getByTestId('join-room-btn'));

      // Find and call the join-error handler
      const joinErrorCall = mockSocket.on.mock.calls.find(call => call[0] === 'join-error');
      if (joinErrorCall) {
        act(() => {
          joinErrorCall[1]({ message: 'Room is full' });
        });
      }

      // Verify error is displayed
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Room is full');
        expect(screen.getByTestId('room-id')).toHaveTextContent('no-room');
      });
    });

    it('should handle game start flow', async () => {
      render(
        <SocketProvider>
          <MockGameComponent />
        </SocketProvider>
      );

      // Initially game not started
      expect(screen.getByTestId('game-started')).toHaveTextContent('not-started');

      // Click start game button
      fireEvent.click(screen.getByTestId('start-game-btn'));

      // Verify socket emit was called
      expect(mockSocket.emit).toHaveBeenCalledWith('start-game', { gameId: 'game-123' });

      // Find and call the game-started handler
      const gameStartedCall = mockSocket.on.mock.calls.find(call => call[0] === 'game-started');
      if (gameStartedCall) {
        act(() => {
          gameStartedCall[1]({ gameId: 'game-123', sharedSeed: 12345 });
        });
      }

      // Verify UI updated
      await waitFor(() => {
        expect(screen.getByTestId('game-started')).toHaveTextContent('started');
      });
    });
  });

  describe('Game Events Integration', () => {
    it('should send player moves correctly', () => {
      render(
        <SocketProvider>
          <MockGameComponent />
        </SocketProvider>
      );

      fireEvent.click(screen.getByTestId('send-move-btn'));

      expect(mockSocket.emit).toHaveBeenCalledWith('player-move', {
        playerId: 'player-123',
        move: 'left'
      });
    });

    it('should send lines cleared correctly', () => {
      render(
        <SocketProvider>
          <MockMultiplayerComponent />
        </SocketProvider>
      );

      fireEvent.click(screen.getByTestId('send-lines-cleared-btn'));

      expect(mockSocket.emit).toHaveBeenCalledWith('lines-cleared', {
        playerId: 'player-123',
        linesCleared: 2,
        newBoard: expect.any(Array),
        newScore: 200
      });
    });

    it('should send game over correctly', () => {
      render(
        <SocketProvider>
          <MockMultiplayerComponent />
        </SocketProvider>
      );

      fireEvent.click(screen.getByTestId('send-game-over-btn'));

      expect(mockSocket.emit).toHaveBeenCalledWith('game-over', {
        playerId: 'player-123'
      });
    });
  });

  describe('Multiplayer Events Integration', () => {
    it('should handle player elimination', async () => {
      render(
        <SocketProvider>
          <MockMultiplayerComponent />
        </SocketProvider>
      );

      // Initially no eliminated players
      expect(screen.getByTestId('eliminated-count')).toHaveTextContent('0');

      // Find and call the player-eliminated handler
      const eliminatedCall = mockSocket.on.mock.calls.find(call => call[0] === 'player-eliminated');
      if (eliminatedCall) {
        act(() => {
          eliminatedCall[1]({
            playerId: 'player-2',
            playerName: 'EliminatedPlayer',
            remainingPlayers: 1
          });
        });
      }

      // Verify UI updated
      await waitFor(() => {
        expect(screen.getByTestId('eliminated-count')).toHaveTextContent('1');
      });
    });

    it('should handle game end', async () => {
      render(
        <SocketProvider>
          <MockMultiplayerComponent />
        </SocketProvider>
      );

      // Initially game not ended
      expect(screen.getByTestId('game-ended')).toHaveTextContent('playing');
      expect(screen.getByTestId('winner')).toHaveTextContent('no-winner');

      // Find and call the game-end handler
      const gameEndCall = mockSocket.on.mock.calls.find(call => call[0] === 'game-end');
      if (gameEndCall) {
        act(() => {
          gameEndCall[1]({
            winnerId: 'player-1',
            winnerName: 'WinnerPlayer',
            gameResult: 'victory'
          });
        });
      }

      // Verify UI updated
      await waitFor(() => {
        expect(screen.getByTestId('game-ended')).toHaveTextContent('ended');
        expect(screen.getByTestId('winner')).toHaveTextContent('WinnerPlayer');
      });
    });

    it('should handle penalty lines', async () => {
      render(
        <SocketProvider>
          <MockMultiplayerComponent />
        </SocketProvider>
      );

      // Initially no penalty lines
      expect(screen.getByTestId('penalty-lines')).toHaveTextContent('0');

      // Find and call the penalty-lines handler
      const penaltyCall = mockSocket.on.mock.calls.find(call => call[0] === 'penalty-lines');
      if (penaltyCall) {
        act(() => {
          penaltyCall[1]({
            playerId: 'player-123',
            count: 3
          });
        });
      }

      // Verify UI updated
      await waitFor(() => {
        expect(screen.getByTestId('penalty-lines')).toHaveTextContent('3');
      });
    });
  });

  describe('Connection State Integration', () => {
    it('should update UI based on connection state', async () => {
      render(
        <SocketProvider>
          <MockGameComponent />
        </SocketProvider>
      );

      // Initially disconnected
      expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected');

      // Find and call the connect handler
      const connectCall = mockSocket.on.mock.calls.find(call => call[0] === 'connect');
      if (connectCall) {
        act(() => {
          connectCall[1]();
        });
      }

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });

      // Find and call the disconnect handler
      const disconnectCall = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect');
      if (disconnectCall) {
        act(() => {
          disconnectCall[1]();
        });
      }

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected');
      });
    });
  });
});
