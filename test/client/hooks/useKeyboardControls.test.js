const { renderHook, act } = require('@testing-library/react');
const { useKeyboardControls } = require('../../../src/client/hooks/useKeyboardControls');

// Mock game logic functions
jest.mock('../../../src/client/utils/gameLogic', () => ({
  movePiece: jest.fn((shape, direction, pile, x, y) => {
    switch (direction) {
      case 'left': return { x: Math.max(0, x - 1), y };
      case 'right': return { x: Math.min(9, x + 1), y };
      case 'down': return { x, y: y + 1 };
      default: return { x, y };
    }
  }),
  rotatePiece: jest.fn((shape, pile, x, y) => shape) // Mock rotation
}));

describe('useKeyboardControls Hook', () => {
  const mockProps = {
    playing: true,
    gameOver: false,
    multiplayerGameEnded: false,
    paused: false,
    lockInput: false,
    pendingNewPiece: false,
    shape: [[1, 1, 1, 1]],
    pile: Array(20).fill().map(() => Array(10).fill(0)),
    pos: { x: 4, y: 0 },
    setPos: jest.fn(),
    setShape: jest.fn(),
    setPaused: jest.fn(),
    isMultiplayer: false,
    currentPlayerId: null,
    socketAPI: {
      sendPlayerMove: jest.fn(),
      sendPauseState: jest.fn()
    },
    dropPieceToBottom: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('sets up keyboard event listeners when playing', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useKeyboardControls(mockProps));

    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  test('does not set up listeners when not playing', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

    renderHook(() => useKeyboardControls({ ...mockProps, playing: false }));

    expect(addEventListenerSpy).not.toHaveBeenCalled();

    addEventListenerSpy.mockRestore();
  });

  test('handles left arrow key movement', () => {
    const setPos = jest.fn();
    const { result } = renderHook(() => useKeyboardControls({ ...mockProps, setPos }));

    act(() => {
      result.current.handleKeyDown({ key: 'ArrowLeft' });
    });

    expect(setPos).toHaveBeenCalledWith(expect.any(Function));
  });

  test('handles right arrow key movement', () => {
    const setPos = jest.fn();
    const { result } = renderHook(() => useKeyboardControls({ ...mockProps, setPos }));

    act(() => {
      result.current.handleKeyDown({ key: 'ArrowRight' });
    });

    expect(setPos).toHaveBeenCalledWith(expect.any(Function));
  });

  test('handles down arrow key movement', () => {
    const setPos = jest.fn();
    const { result } = renderHook(() => useKeyboardControls({ ...mockProps, setPos }));

    act(() => {
      result.current.handleKeyDown({ key: 'ArrowDown' });
    });

    expect(setPos).toHaveBeenCalledWith(expect.any(Function));
  });

  test('handles up arrow key rotation', () => {
    const setShape = jest.fn();
    const { result } = renderHook(() => useKeyboardControls({ ...mockProps, setShape }));

    act(() => {
      result.current.handleKeyDown({ key: 'ArrowUp' });
    });

    expect(setShape).toHaveBeenCalledWith(expect.any(Function));
  });

  test('handles spacebar hard drop', () => {
    const dropPieceToBottom = jest.fn();
    const { result } = renderHook(() => useKeyboardControls({ ...mockProps, dropPieceToBottom }));

    act(() => {
      result.current.handleKeyDown({ key: ' ' });
    });

    expect(dropPieceToBottom).toHaveBeenCalled();
  });

  test('handles pause key (p)', () => {
    const setPaused = jest.fn();
    const { result } = renderHook(() => useKeyboardControls({ ...mockProps, setPaused }));

    act(() => {
      result.current.handleKeyDown({ key: 'p' });
    });

    expect(setPaused).toHaveBeenCalledWith(expect.any(Function));
  });

  test('handles pause key (P)', () => {
    const setPaused = jest.fn();
    const { result } = renderHook(() => useKeyboardControls({ ...mockProps, setPaused }));

    act(() => {
      result.current.handleKeyDown({ key: 'P' });
    });

    expect(setPaused).toHaveBeenCalledWith(expect.any(Function));
  });

  test('handles escape key for pause', () => {
    const setPaused = jest.fn();
    const { result } = renderHook(() => useKeyboardControls({ ...mockProps, setPaused }));

    act(() => {
      result.current.handleKeyDown({ key: 'Escape' });
    });

    expect(setPaused).toHaveBeenCalledWith(expect.any(Function));
  });

  test('ignores input when game is over', () => {
    const setPos = jest.fn();
    const setShape = jest.fn();
    renderHook(() => useKeyboardControls({ 
      ...mockProps, 
      gameOver: true, 
      setPos, 
      setShape 
    }));

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      window.dispatchEvent(event);
    });

    expect(setPos).not.toHaveBeenCalled();
  });

  test('ignores input when input is locked', () => {
    const setPos = jest.fn();
    renderHook(() => useKeyboardControls({ 
      ...mockProps, 
      lockInput: true, 
      setPos 
    }));

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      window.dispatchEvent(event);
    });

    expect(setPos).not.toHaveBeenCalled();
  });

  test('ignores input when paused', () => {
    const setPos = jest.fn();
    renderHook(() => useKeyboardControls({ 
      ...mockProps, 
      paused: true, 
      setPos 
    }));

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      window.dispatchEvent(event);
    });

    expect(setPos).not.toHaveBeenCalled();
  });

  test('ignores input when pending new piece', () => {
    const setPos = jest.fn();
    renderHook(() => useKeyboardControls({ 
      ...mockProps, 
      pendingNewPiece: true, 
      setPos 
    }));

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      window.dispatchEvent(event);
    });

    expect(setPos).not.toHaveBeenCalled();
  });

  test('sends multiplayer moves when in multiplayer mode', () => {
    const socketAPI = { sendPlayerMove: jest.fn(), sendPauseState: jest.fn() };
    const { result } = renderHook(() => useKeyboardControls({ 
      ...mockProps, 
      isMultiplayer: true,
      currentPlayerId: 'player123',
      socketAPI 
    }));

    act(() => {
      result.current.handleKeyDown({ key: 'ArrowLeft' });
    });

    expect(socketAPI.sendPlayerMove).toHaveBeenCalledWith('player123', 'left');
  });

  test('sends multiplayer rotation', () => {
    const socketAPI = { sendPlayerMove: jest.fn(), sendPauseState: jest.fn() };
    const { result } = renderHook(() => useKeyboardControls({ 
      ...mockProps, 
      isMultiplayer: true,
      currentPlayerId: 'player123',
      socketAPI 
    }));

    act(() => {
      result.current.handleKeyDown({ key: 'ArrowUp' });
    });

    expect(socketAPI.sendPlayerMove).toHaveBeenCalledWith('player123', 'rotate');
  });

  test('sends multiplayer hard drop', () => {
    const socketAPI = { sendPlayerMove: jest.fn(), sendPauseState: jest.fn() };
    const { result } = renderHook(() => useKeyboardControls({ 
      ...mockProps, 
      isMultiplayer: true,
      currentPlayerId: 'player123',
      socketAPI 
    }));

    act(() => {
      result.current.handleKeyDown({ key: ' ' });
    });

    expect(socketAPI.sendPlayerMove).toHaveBeenCalledWith('player123', 'hardDrop');
  });

  test('sends multiplayer pause state', () => {
    const socketAPI = { sendPlayerMove: jest.fn(), sendPauseState: jest.fn() };
    const setPaused = jest.fn();
    const { result } = renderHook(() => useKeyboardControls({ 
      ...mockProps, 
      isMultiplayer: true,
      currentPlayerId: 'player123',
      socketAPI,
      setPaused
    }));

    act(() => {
      result.current.handleKeyDown({ key: 'p' });
    });

    expect(setPaused).toHaveBeenCalledWith(expect.any(Function));
  });

  test('implements key repeat for movement keys', () => {
    const setPos = jest.fn();
    const { result } = renderHook(() => useKeyboardControls({ ...mockProps, setPos }));

    act(() => {
      result.current.handleKeyDown({ key: 'ArrowLeft' });
    });

    expect(setPos).toHaveBeenCalledTimes(1);

    // Fast forward past repeat delay
    act(() => {
      jest.advanceTimersByTime(150);
    });

    // Fast forward through several repeat intervals
    act(() => {
      jest.advanceTimersByTime(200); // 4 intervals of 50ms
    });

    expect(setPos).toHaveBeenCalledTimes(5); // Initial + 4 repeats
  });

  test('stops key repeat on keyup', () => {
    const setPos = jest.fn();
    const { result } = renderHook(() => useKeyboardControls({ ...mockProps, setPos }));

    // Start key repeat
    act(() => {
      result.current.handleKeyDown({ key: 'ArrowLeft' });
    });

    // Release key before repeat starts
    act(() => {
      result.current.handleKeyUp({ key: 'ArrowLeft' });
    });

    // Fast forward past repeat delay
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Should only have been called once (initial keydown)
    expect(setPos).toHaveBeenCalledTimes(1);
  });

  test('prevents duplicate keydown events for held keys', () => {
    const setPos = jest.fn();
    const { result } = renderHook(() => useKeyboardControls({ ...mockProps, setPos }));

    act(() => {
      // First keydown
      result.current.handleKeyDown({ key: 'ArrowLeft' });
      
      // Second keydown (should be ignored)
      result.current.handleKeyDown({ key: 'ArrowLeft' });
    });

    expect(setPos).toHaveBeenCalledTimes(1);
  });

  test('cleans up timers on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    const { result, unmount } = renderHook(() => useKeyboardControls(mockProps));

    // Start some key repeats
    act(() => {
      result.current.handleKeyDown({ key: 'ArrowLeft' });
    });

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(clearIntervalSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });

  test('returns handleKeyDown and handleKeyUp functions', () => {
    const { result } = renderHook(() => useKeyboardControls(mockProps));

    expect(typeof result.current.handleKeyDown).toBe('function');
    expect(typeof result.current.handleKeyUp).toBe('function');
  });
});
