/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, act } from '@testing-library/react';

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

// Simple test component
const TestComponent = () => {
  const socketAPI = useSocket();
  
  return (
    <div>
      <div data-testid="connected">{socketAPI.isConnected ? 'true' : 'false'}</div>
      <div data-testid="error">{socketAPI.connectionError || 'none'}</div>
      <button 
        data-testid="join-btn" 
        onClick={() => socketAPI.joinRoom('TEST', 'Player')}
      >
        Join
      </button>
    </div>
  );
};

describe('SocketProvider Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSocket.on.mockClear();
    mockSocket.off.mockClear();
    mockSocket.emit.mockClear();
    mockSocket.disconnect.mockClear();
    mockIo.mockClear();
  });

  it('should provide socket API through context', () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    // Should render without crashing
    expect(screen.getByTestId('connected')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('none');
  });

  it('should create socket connection on mount', () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    // Should call io with correct config
    expect(mockIo).toHaveBeenCalledWith('http://localhost:3004', {
      autoConnect: true,
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });
  });

  it('should setup event listeners', () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    // Should setup connection event listeners
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
  });

  it('should emit join room event', () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    const joinBtn = screen.getByTestId('join-btn');
    act(() => {
      joinBtn.click();
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('join-room', {
      roomId: 'TEST',
      playerName: 'Player',
      isCreator: false
    });
  });

  it('should handle connection state changes', () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    // Initially disconnected
    expect(screen.getByTestId('connected')).toHaveTextContent('false');

    // Simulate connection
    act(() => {
      const connectHandler = mockSocket.on.mock.calls
        .find(call => call[0] === 'connect')[1];
      connectHandler();
    });

    // Should be connected now
    expect(screen.getByTestId('connected')).toHaveTextContent('true');
  });

  it('should handle connection errors', () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    // Initially no error
    expect(screen.getByTestId('error')).toHaveTextContent('none');

    // Simulate connection error
    act(() => {
      const errorHandler = mockSocket.on.mock.calls
        .find(call => call[0] === 'connect_error')[1];
      errorHandler({ message: 'Connection failed' });
    });

    // Should show error
    expect(screen.getByTestId('error')).toHaveTextContent('Connection failed');
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useSocket must be used within a SocketProvider');
    
    consoleSpy.mockRestore();
  });

  it('should create socket connection properly', () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    // Verify socket was created with correct configuration
    expect(mockIo).toHaveBeenCalledTimes(1);
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('reconnect_attempt', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('reconnect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('reconnect_failed', expect.any(Function));
  });
});
