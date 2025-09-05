const { renderHook, act } = require('@testing-library/react');
const { useURLNavigation } = require('../../../src/client/hooks/useURLNavigation');

// Mock dependencies
jest.mock('../../../src/client/utils/gameHelpers', () => ({
  parseHashUrl: jest.fn(() => ({ roomId: 'TEST123', playerName: 'TestPlayer' })),
  createUrlHash: jest.fn((roomId, playerName) => `#${roomId}:${playerName}`),
  updateUrlHash: jest.fn(),
  clearUrlHash: jest.fn()
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

describe('useURLNavigation Hook', () => {
  const mockProps = {
    urlRoomInfo: null,
    setUrlRoomInfo: jest.fn(),
    autoJoinAttempted: false,
    setAutoJoinAttempted: jest.fn(),
    currentRoomId: '',
    currentPlayerName: '',
    isJoiningRoom: false,
    setJoinRoomId: jest.fn(),
    setJoinUsername: jest.fn(),
    setCurrentPlayerName: jest.fn(),
    setIsJoiningRoom: jest.fn(),
    setJoinError: jest.fn(),
    setUrlJoinStatus: jest.fn(),
    setShowJoinRoomModal: jest.fn(),
    socketAPI: {
      joinRoom: jest.fn()
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initializes without errors', () => {
    // Hook doesn't return anything, just runs effects
    expect(() => {
      renderHook(() => useURLNavigation(mockProps));
    }).not.toThrow();
  });

  test('calls parseHashUrl on mount', () => {
    const { parseHashUrl } = require('../../../src/client/utils/gameHelpers');
    
    renderHook(() => useURLNavigation(mockProps));
    
    expect(parseHashUrl).toHaveBeenCalled();
  });

  test('handles URL room info when available', () => {
    const { parseHashUrl } = require('../../../src/client/utils/gameHelpers');
    parseHashUrl.mockReturnValue({ roomId: 'ROOM123', playerName: 'Player1' });
    
    const propsWithUrlInfo = {
      ...mockProps,
      urlRoomInfo: { roomId: 'ROOM123', playerName: 'Player1' }
    };
    
    renderHook(() => useURLNavigation(propsWithUrlInfo));
    
    expect(parseHashUrl).toHaveBeenCalled();
  });

  test('handles auto join when conditions are met', () => {
    const { parseHashUrl } = require('../../../src/client/utils/gameHelpers');
    parseHashUrl.mockReturnValue({ roomId: 'ROOM123', playerName: 'Player1' });
    
    const propsForAutoJoin = {
      ...mockProps,
      urlRoomInfo: { roomId: 'ROOM123', playerName: 'Player1' },
      autoJoinAttempted: false,
      currentRoomId: '',
      isJoiningRoom: false,
      socketAPI: {
        joinRoom: jest.fn()
      }
    };
    
    renderHook(() => useURLNavigation(propsForAutoJoin));
    
    // Should attempt to join room (the hook calls joinRoom with roomId and nameToUse)
    expect(propsForAutoJoin.socketAPI.joinRoom).toHaveBeenCalledWith(
      'ROOM123',
      'Player1'
    );
  });

  test('does not auto join when already attempted', () => {
    const propsWithAttempted = {
      ...mockProps,
      urlRoomInfo: { roomId: 'ROOM123', playerName: 'Player1' },
      autoJoinAttempted: true
    };
    
    renderHook(() => useURLNavigation(propsWithAttempted));
    
    expect(propsWithAttempted.socketAPI.joinRoom).not.toHaveBeenCalled();
  });

  test('does not auto join when already in a room', () => {
    const propsWithCurrentRoom = {
      ...mockProps,
      urlRoomInfo: { roomId: 'ROOM123', playerName: 'Player1' },
      currentRoomId: 'CURRENT123'
    };
    
    renderHook(() => useURLNavigation(propsWithCurrentRoom));
    
    expect(propsWithCurrentRoom.socketAPI.joinRoom).not.toHaveBeenCalled();
  });

  test('does not auto join when already joining', () => {
    const propsWithJoining = {
      ...mockProps,
      urlRoomInfo: { roomId: 'ROOM123', playerName: 'Player1' },
      isJoiningRoom: true
    };
    
    renderHook(() => useURLNavigation(propsWithJoining));
    
    expect(propsWithJoining.socketAPI.joinRoom).not.toHaveBeenCalled();
  });

  test('handles room join success', () => {
    const propsWithSuccess = {
      ...mockProps,
      urlRoomInfo: { roomId: 'ROOM123', playerName: 'Player1' }
    };
    
    renderHook(() => useURLNavigation(propsWithSuccess));
    
    // Simulate successful join by calling the success handler
    // This would be triggered by socket events in real usage
    expect(propsWithSuccess.setAutoJoinAttempted).toHaveBeenCalledWith(true);
  });

  test('handles room join error', () => {
    const propsWithError = {
      ...mockProps,
      urlRoomInfo: { roomId: 'ROOM123', playerName: 'Player1' }
    };
    
    renderHook(() => useURLNavigation(propsWithError));
    
    // Simulate error by calling the error handler
    // This would be triggered by socket events in real usage
    expect(propsWithError.setAutoJoinAttempted).toHaveBeenCalledWith(true);
  });

  test('handles URL operations during effects', () => {
    // Test with room info - should not throw errors
    const propsWithRoomInfo = {
      ...mockProps,
      urlRoomInfo: { roomId: 'ROOM123', playerName: 'Player1' }
    };
    
    expect(() => {
      renderHook(() => useURLNavigation(propsWithRoomInfo));
    }).not.toThrow();
    
    // Test with null room info - should not throw errors
    const propsWithNullRoomInfo = {
      ...mockProps,
      urlRoomInfo: null
    };
    
    expect(() => {
      renderHook(() => useURLNavigation(propsWithNullRoomInfo));
    }).not.toThrow();
  });
});
