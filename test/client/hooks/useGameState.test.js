const { renderHook, act } = require('@testing-library/react');
const { useGameState } = require('../../../src/client/hooks/useGameState');

// Mock dependencies
jest.mock('../../../src/client/utils/tetrominos', () => ({
  getTetromino: jest.fn((type) => ({
    shape: [[1, 1, 1, 1]] // Mock I-piece shape
  }))
}));

jest.mock('../../../src/client/utils/gameLogic', () => ({
  createPieceSequence: jest.fn(() => ['I', 'O', 'T', 'S', 'Z', 'J', 'L']),
  getNextPiece: jest.fn((sequence, index) => sequence[index % sequence.length]),
  createEmptyBoard: jest.fn(() => Array(20).fill().map(() => Array(10).fill(0)))
}));

jest.mock('../../../src/client/utils/gameConstants', () => ({
  SEQUENCE_LENGTH: 1000,
  SEED: 12345,
  COLS: 10,
  STORAGE_KEYS: {
    SELECTED_MODE: 'selectedMode',
    HIGH_SCORES: 'highScores',
    GAME_STATS: 'gameStats'
  },
  DEFAULT_VALUES: {
    SELECTED_MODE: 'classic',
    HIGH_SCORES: [],
    GAME_STATS: {
      gamesPlayed: 0,
      totalScore: 0,
      totalLines: 0,
      multiplayerGames: 0,
      multiplayerWins: 0
    }
  }
}));

jest.mock('../../../src/client/services/localStorageService', () => ({
  getFromLocalStorage: jest.fn((key, defaultValue) => defaultValue),
  saveToLocalStorage: jest.fn()
}));

describe('useGameState Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initializes with default state', () => {
    const { result } = renderHook(() => useGameState());

    expect(result.current.pieceIndex).toBe(0);
    expect(result.current.currentType).toBe('I');
    expect(result.current.nextType).toBe('O');
    expect(result.current.score).toBe(0);
    expect(result.current.lines).toBe(0);
    expect(result.current.gameOver).toBe(false);
    expect(result.current.playing).toBe(false);
    expect(result.current.paused).toBe(false);
    expect(result.current.inLobby).toBe(true);
    expect(result.current.lockInput).toBe(false);
    expect(result.current.pendingNewPiece).toBe(false);
  });

  test('provides empty board', () => {
    const { result } = renderHook(() => useGameState());

    expect(result.current.emptyBoard).toBeDefined();
    expect(Array.isArray(result.current.emptyBoard)).toBe(true);
    expect(result.current.pile).toBeDefined();
    expect(Array.isArray(result.current.pile)).toBe(true);
  });

  test('provides piece sequence and current pieces', () => {
    const { result } = renderHook(() => useGameState());

    expect(result.current.pieceSequence).toEqual(['I', 'O', 'T', 'S', 'Z', 'J', 'L']);
    expect(result.current.currentType).toBe('I');
    expect(result.current.nextType).toBe('O');
    expect(result.current.shape).toBeDefined();
  });

  test('provides initial position', () => {
    const { result } = renderHook(() => useGameState());

    expect(result.current.pos).toEqual({ x: 3, y: 0 }); // (10 - 4) / 2 = 3 for I-piece
  });

  test('updateHighScores adds score and keeps top 5', () => {
    const { result } = renderHook(() => useGameState());

    // Add scores one by one to ensure state updates properly
    act(() => {
      result.current.updateHighScores(1000);
    });
    act(() => {
      result.current.updateHighScores(1500);
    });
    act(() => {
      result.current.updateHighScores(800);
    });
    act(() => {
      result.current.updateHighScores(2000);
    });
    act(() => {
      result.current.updateHighScores(1200);
    });
    act(() => {
      result.current.updateHighScores(900); // This should not be included (6th score)
    });

    expect(result.current.highScores).toHaveLength(5);
    expect(result.current.highScores[0]).toBe(2000); // Highest first
    expect(result.current.highScores[4]).toBe(900); // Lowest of top 5 (800 should be excluded)
  });

  test('updateHighScores ignores zero scores', () => {
    const { result } = renderHook(() => useGameState());

    act(() => {
      result.current.updateHighScores(0);
      result.current.updateHighScores(-100);
    });

    expect(result.current.highScores).toHaveLength(0);
  });

  test('updateGameStats updates statistics correctly', () => {
    const { result } = renderHook(() => useGameState());

    act(() => {
      result.current.updateGameStats(1000, 10, false, false);
    });

    expect(result.current.gameStats.gamesPlayed).toBe(1);
    expect(result.current.gameStats.totalScore).toBe(1000);
    expect(result.current.gameStats.totalLines).toBe(10);
    expect(result.current.gameStats.multiplayerGames).toBe(0);
    expect(result.current.gameStats.multiplayerWins).toBe(0);
  });

  test('updateGameStats handles multiplayer stats', () => {
    const { result } = renderHook(() => useGameState());

    act(() => {
      result.current.updateGameStats(1500, 15, true, true);
    });

    expect(result.current.gameStats.gamesPlayed).toBe(1);
    expect(result.current.gameStats.multiplayerGames).toBe(1);
    expect(result.current.gameStats.multiplayerWins).toBe(1);
  });

  test('handleModeChange updates selected mode', () => {
    const { result } = renderHook(() => useGameState());

    act(() => {
      result.current.handleModeChange('gravity');
    });

    expect(result.current.selectedMode).toBe('gravity');
  });

  test('resetGameState resets all game-related state', () => {
    const { result } = renderHook(() => useGameState());

    // Set some non-default values first
    act(() => {
      result.current.setScore(1000);
      result.current.setLines(10);
      result.current.setGameOver(true);
      result.current.setPlaying(false);
      result.current.setPaused(true);
      result.current.setLockInput(true);
      result.current.setPendingNewPiece(true);
    });

    // Reset the game state
    act(() => {
      result.current.resetGameState();
    });

    expect(result.current.score).toBe(0);
    expect(result.current.lines).toBe(0);
    expect(result.current.gameOver).toBe(false);
    expect(result.current.playing).toBe(true);
    expect(result.current.paused).toBe(false);
    expect(result.current.lockInput).toBe(false);
    expect(result.current.pendingNewPiece).toBe(false);
    expect(result.current.pieceIndex).toBe(0);
    expect(result.current.currentType).toBe('I');
    expect(result.current.nextType).toBe('O');
  });

  test('provides all necessary setters', () => {
    const { result } = renderHook(() => useGameState());

    // Test that all setters exist and are functions
    const setters = [
      'setPieceIndex', 'setCurrentType', 'setNextType', 'setShape', 'setPile',
      'setPos', 'setLockInput', 'setPendingNewPiece', 'setGameOver', 'setPlaying',
      'setPaused', 'setInLobby', 'setScore', 'setLines', 'setSelectedMode',
      'setHighScores', 'setGameStats', 'setGravityDrop', 'setInvisibleFlash', 'setLastY'
    ];

    setters.forEach(setter => {
      expect(typeof result.current[setter]).toBe('function');
    });
  });

  test('setters update state correctly', () => {
    const { result } = renderHook(() => useGameState());

    act(() => {
      result.current.setScore(500);
      result.current.setLines(5);
      result.current.setPlaying(true);
      result.current.setPaused(true);
      result.current.setGameOver(true);
    });

    expect(result.current.score).toBe(500);
    expect(result.current.lines).toBe(5);
    expect(result.current.playing).toBe(true);
    expect(result.current.paused).toBe(true);
    expect(result.current.gameOver).toBe(true);
  });

  test('gravity-specific state is managed correctly', () => {
    const { result } = renderHook(() => useGameState());

    act(() => {
      result.current.setGravityDrop(true);
    });

    expect(result.current.gravityDrop).toBe(true);
    expect(result.current.gravityTimeoutRef).toBeDefined();
    expect(result.current.gravityTimeoutRef.current).toBeUndefined();
  });

  test('invisible mode state is managed correctly', () => {
    const { result } = renderHook(() => useGameState());

    act(() => {
      result.current.setInvisibleFlash(true);
      result.current.setLastY(5);
    });

    expect(result.current.invisibleFlash).toBe(true);
    expect(result.current.lastY).toBe(5);
  });

  test('piece sequence can be updated', () => {
    const { result } = renderHook(() => useGameState());

    const newSequence = ['T', 'S', 'Z', 'L', 'J', 'O', 'I'];

    act(() => {
      result.current.setPieceSequence(newSequence);
    });

    expect(result.current.pieceSequence).toEqual(newSequence);
  });
});
