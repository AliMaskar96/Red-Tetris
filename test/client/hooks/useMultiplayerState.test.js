const { renderHook, act } = require('@testing-library/react');
const { useMultiplayerState } = require('../../../src/client/hooks/useMultiplayerState');

// Mock dependencies
jest.mock('../../../src/client/utils/gameHelpers', () => ({
  generateRoomId: jest.fn(() => 'TEST123'),
  initializeOpponentsScores: jest.fn((players) => players.map(p => ({ ...p, score: 0 }))),
  resetOpponentsData: jest.fn((data, resetValue) => {
    if (Array.isArray(data)) {
      return data.map(p => ({ ...p, ...resetValue }));
    } else {
      // Handle object case
      const result = {};
      for (const key in data) {
        result[key] = resetValue;
      }
      return result;
    }
  })
}));

jest.mock('../../../src/client/services/localStorageService', () => ({
  getFromLocalStorage: jest.fn((key, defaultValue) => defaultValue),
  saveToLocalStorage: jest.fn()
}));

jest.mock('../../../src/client/utils/gameConstants', () => ({
  STORAGE_KEYS: {
    LAST_USERNAME: 'lastUsername'
  }
}));

describe('useMultiplayerState Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initializes with default state', () => {
    const { result } = renderHook(() => useMultiplayerState());

    expect(result.current.showCreateRoomModal).toBe(false);
    expect(result.current.showJoinRoomModal).toBe(false);
    expect(result.current.createRoomId).toBe('TEST123');
    expect(result.current.username).toBe('');
    expect(result.current.userList).toEqual([]);
    expect(result.current.joinRoomId).toBe('');
    expect(result.current.joinUsername).toBe('');
    expect(result.current.isJoiningRoom).toBe(false);
    expect(result.current.joinError).toBe('');
    expect(result.current.currentPlayerName).toBe('');
    expect(result.current.currentRoomId).toBe(null);
    expect(result.current.currentGameId).toBe(null);
    expect(result.current.isRoomLeader).toBe(false);
    expect(result.current.isMultiplayer).toBe(false);
    expect(result.current.multiplayerGameEnded).toBe(false);
  });

  test('provides modal control functions', () => {
    const { result } = renderHook(() => useMultiplayerState());

    expect(typeof result.current.setShowCreateRoomModal).toBe('function');
    expect(typeof result.current.setShowJoinRoomModal).toBe('function');
  });

  test('provides room creation functions', () => {
    const { result } = renderHook(() => useMultiplayerState());

    expect(typeof result.current.setUsername).toBe('function');
    expect(typeof result.current.setUserList).toBe('function');
  });

  test('provides room joining functions', () => {
    const { result } = renderHook(() => useMultiplayerState());

    expect(typeof result.current.setJoinRoomId).toBe('function');
    expect(typeof result.current.setJoinUsername).toBe('function');
    expect(typeof result.current.setIsJoiningRoom).toBe('function');
    expect(typeof result.current.setJoinError).toBe('function');
  });

  test('provides player management functions', () => {
    const { result } = renderHook(() => useMultiplayerState());

    expect(typeof result.current.setCurrentPlayerName).toBe('function');
    expect(typeof result.current.setCurrentRoomId).toBe('function');
    expect(typeof result.current.setCurrentGameId).toBe('function');
    expect(typeof result.current.setIsRoomLeader).toBe('function');
    expect(typeof result.current.setIsMultiplayer).toBe('function');
    expect(typeof result.current.setMultiplayerGameEnded).toBe('function');
  });

  test('provides utility functions', () => {
    const { result } = renderHook(() => useMultiplayerState());

    expect(typeof result.current.initializeOpponents).toBe('function');
    expect(typeof result.current.resetOpponents).toBe('function');
    expect(typeof result.current.savePlayerName).toBe('function');
    expect(typeof result.current.resetMultiplayerState).toBe('function');
    expect(typeof result.current.getOpponents).toBe('function');
  });

  test('can update modal states', () => {
    const { result } = renderHook(() => useMultiplayerState());

    act(() => {
      result.current.setShowCreateRoomModal(true);
      result.current.setShowJoinRoomModal(true);
    });

    expect(result.current.showCreateRoomModal).toBe(true);
    expect(result.current.showJoinRoomModal).toBe(true);
  });

  test('can update room creation state', () => {
    const { result } = renderHook(() => useMultiplayerState());

    act(() => {
      result.current.setUsername('testuser');
      result.current.setUserList([{ id: '1', name: 'player1' }]);
    });

    expect(result.current.username).toBe('testuser');
    expect(result.current.userList).toEqual([{ id: '1', name: 'player1' }]);
  });

  test('can update room joining state', () => {
    const { result } = renderHook(() => useMultiplayerState());

    act(() => {
      result.current.setJoinRoomId('ROOM123');
      result.current.setJoinUsername('joinuser');
      result.current.setIsJoiningRoom(true);
      result.current.setJoinError('Room full');
    });

    expect(result.current.joinRoomId).toBe('ROOM123');
    expect(result.current.joinUsername).toBe('joinuser');
    expect(result.current.isJoiningRoom).toBe(true);
    expect(result.current.joinError).toBe('Room full');
  });

  test('can update player state', () => {
    const { result } = renderHook(() => useMultiplayerState());

    act(() => {
      result.current.setCurrentPlayerName('currentplayer');
      result.current.setCurrentGameId('game123');
      result.current.setIsRoomLeader(true);
      result.current.setIsMultiplayer(true);
      result.current.setMultiplayerGameEnded(true);
    });

    expect(result.current.currentPlayerName).toBe('currentplayer');
    expect(result.current.currentGameId).toBe('game123');
    expect(result.current.isRoomLeader).toBe(true);
    expect(result.current.isMultiplayer).toBe(true);
    expect(result.current.multiplayerGameEnded).toBe(true);
  });

  test('initializeOpponents calls helper function', () => {
    const { result } = renderHook(() => useMultiplayerState());
    const { initializeOpponentsScores } = require('../../../src/client/utils/gameHelpers');
    
    const players = [{ id: '1', name: 'player1' }, { id: '2', name: 'player2' }];
    const currentPlayerId = '1';

    act(() => {
      result.current.initializeOpponents(players, currentPlayerId);
    });

    expect(initializeOpponentsScores).toHaveBeenCalledWith(players, currentPlayerId);
  });

  test('resetOpponents calls helper function', () => {
    const { result } = renderHook(() => useMultiplayerState());
    const { resetOpponentsData } = require('../../../src/client/utils/gameHelpers');
    
    // Set up some initial state first
    act(() => {
      result.current.setOpponentsScores({ '1': 100, '2': 200 });
      result.current.setOpponentsSpectrums({ '1': [1,2,3], '2': [4,5,6] });
    });

    act(() => {
      result.current.resetOpponents();
    });

    expect(resetOpponentsData).toHaveBeenCalled();
  });

  test('savePlayerName saves to localStorage', () => {
    const { result } = renderHook(() => useMultiplayerState());
    const { saveToLocalStorage } = require('../../../src/client/services/localStorageService');

    act(() => {
      result.current.savePlayerName('testuser');
    });

    expect(saveToLocalStorage).toHaveBeenCalledWith('lastUsername', 'testuser');
  });

  test('resetMultiplayerState resets multiplayer game state', () => {
    const { result } = renderHook(() => useMultiplayerState());

    // Set some state first
    act(() => {
      result.current.setCurrentPlayerName('testuser');
      result.current.setCurrentRoomId('ROOM123');
      result.current.setIsMultiplayer(true);
      result.current.setCurrentGameId('game123');
      result.current.setIsRoomLeader(true);
    });

    // Reset state
    act(() => {
      result.current.resetMultiplayerState();
    });

    // Check that the function resets the states it's supposed to reset
    expect(result.current.currentPlayerName).toBe('');
    expect(result.current.currentRoomId).toBe(null);
    expect(result.current.isMultiplayer).toBe(false);
    expect(result.current.currentGameId).toBe(null);
    expect(result.current.isRoomLeader).toBe(false);
  });
});
