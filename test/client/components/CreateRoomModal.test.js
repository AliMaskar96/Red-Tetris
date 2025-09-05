const React = require('react');
const { render, screen, fireEvent } = require('@testing-library/react');

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve())
  }
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000'
  },
  writable: true
});

const CreateRoomModal = require('../../../src/client/components/CreateRoomModal').default;

describe('CreateRoomModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    createRoomId: 'ABC123',
    username: '',
    setUsername: jest.fn(),
    currentRoomId: null,
    isRoomLeader: true,
    roomPlayers: [],
    onValidateUsername: jest.fn(),
    onStartGame: jest.fn(),
    onLeaveRoom: jest.fn(),
    joinError: ''
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders when isOpen is true', () => {
    render(<CreateRoomModal {...defaultProps} />);
    
    expect(screen.getByText('Create a Room')).toBeInTheDocument();
    expect(screen.getByText('Room ID:')).toBeInTheDocument();
    expect(screen.getByText('ABC123')).toBeInTheDocument();
  });

  test('does not render when isOpen is false', () => {
    render(<CreateRoomModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Create a Room')).not.toBeInTheDocument();
  });

  test('shows leader message', () => {
    render(<CreateRoomModal {...defaultProps} />);
    
    expect(screen.getByText('👑 You will be the leader and can start the game for all players')).toBeInTheDocument();
  });

  test('shows room ID', () => {
    render(<CreateRoomModal {...defaultProps} createRoomId="XYZ789" />);
    
    expect(screen.getByText('Room ID:')).toBeInTheDocument();
    expect(screen.getByText('XYZ789')).toBeInTheDocument();
  });

  test('shows join error when provided', () => {
    render(<CreateRoomModal {...defaultProps} joinError="Room is full" />);
    
    expect(screen.getByText('Room is full')).toBeInTheDocument();
  });

  test('shows username input when room is not created', () => {
    render(<CreateRoomModal {...defaultProps} currentRoomId={null} />);
    
    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
    expect(screen.getByText('Validate')).toBeInTheDocument();
  });

  test('does not show username input when room is created', () => {
    render(<CreateRoomModal {...defaultProps} currentRoomId="ROOM123" />);
    
    expect(screen.queryByPlaceholderText('Enter your name')).not.toBeInTheDocument();
    expect(screen.queryByText('Validate')).not.toBeInTheDocument();
  });

  test('calls setUsername when input changes', () => {
    render(<CreateRoomModal {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Enter your name');
    fireEvent.change(input, { target: { value: 'TestPlayer' } });
    
    expect(defaultProps.setUsername).toHaveBeenCalledWith('TestPlayer');
  });

  test('calls onValidateUsername when validate button is clicked', () => {
    render(<CreateRoomModal {...defaultProps} />);
    
    const validateButton = screen.getByText('Validate');
    fireEvent.click(validateButton);
    
    expect(defaultProps.onValidateUsername).toHaveBeenCalledTimes(1);
  });

  test('calls onValidateUsername when Enter key is pressed in input', () => {
    render(<CreateRoomModal {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Enter your name');
    fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(defaultProps.onValidateUsername).toHaveBeenCalledTimes(1);
  });

  test('shows room created message when currentRoomId exists', () => {
    render(<CreateRoomModal {...defaultProps} currentRoomId="ROOM123" />);
    
    expect(screen.getByText('✅ Room created successfully! Waiting for other players...')).toBeInTheDocument();
  });

  test('shows shareable link when room is created', () => {
    render(<CreateRoomModal {...defaultProps} currentRoomId="ROOM123" />);
    
    expect(screen.getByText('Link to share:')).toBeInTheDocument();
    expect(screen.getByText('http://localhost:3000/#ROOM123[PLAYER_NAME]')).toBeInTheDocument();
    expect(screen.getByText('Click to copy')).toBeInTheDocument();
  });

  test('copies link to clipboard when clicked', () => {
    render(<CreateRoomModal {...defaultProps} currentRoomId="ROOM123" />);
    
    const linkElement = screen.getByText('http://localhost:3000/#ROOM123[PLAYER_NAME]');
    fireEvent.click(linkElement);
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('http://localhost:3000/#ROOM123[PLAYER_NAME]');
  });

  test('shows players list when room exists and has players', () => {
    const players = [
      { id: '1', name: 'Player1' },
      { id: '2', name: 'Player2' }
    ];
    
    render(<CreateRoomModal {...defaultProps} currentRoomId="ROOM123" roomPlayers={players} />);
    
    expect(screen.getByText('Connected players (2):')).toBeInTheDocument();
    expect(screen.getByText('Player1')).toBeInTheDocument();
    expect(screen.getByText('Player2')).toBeInTheDocument();
  });

  test('does not show players list when room exists but no players', () => {
    render(<CreateRoomModal {...defaultProps} currentRoomId="ROOM123" roomPlayers={[]} />);
    
    expect(screen.queryByText('Connected players')).not.toBeInTheDocument();
  });

  test('shows start game button when user is leader and room has players', () => {
    const players = [{ id: '1', name: 'Player1' }];
    
    render(<CreateRoomModal {...defaultProps} currentRoomId="ROOM123" roomPlayers={players} isRoomLeader={true} />);
    
    expect(screen.getByText('START GAME')).toBeInTheDocument();
  });

  test('does not show start game button when user is not leader', () => {
    const players = [{ id: '1', name: 'Player1' }];
    
    render(<CreateRoomModal {...defaultProps} currentRoomId="ROOM123" roomPlayers={players} isRoomLeader={false} />);
    
    expect(screen.queryByText('Start Game')).not.toBeInTheDocument();
  });

  test('calls onStartGame when start game button is clicked', () => {
    const players = [{ id: '1', name: 'Player1' }];
    
    render(<CreateRoomModal {...defaultProps} currentRoomId="ROOM123" roomPlayers={players} isRoomLeader={true} />);
    
    const startButton = screen.getByText('START GAME');
    fireEvent.click(startButton);
    
    expect(defaultProps.onStartGame).toHaveBeenCalledTimes(1);
  });

  test('shows close button when room is created', () => {
    render(<CreateRoomModal {...defaultProps} currentRoomId="ROOM123" />);
    
    expect(screen.getByTitle('Close')).toBeInTheDocument();
  });

  test('calls onLeaveRoom when close button is clicked', () => {
    render(<CreateRoomModal {...defaultProps} currentRoomId="ROOM123" />);
    
    const closeButton = screen.getByTitle('Close');
    fireEvent.click(closeButton);
    
    expect(defaultProps.onLeaveRoom).toHaveBeenCalledTimes(1);
  });

  test('calls onLeaveRoom when close button is clicked', () => {
    render(<CreateRoomModal {...defaultProps} />);
    
    const closeButton = screen.getByTitle('Close');
    fireEvent.click(closeButton);
    
    expect(defaultProps.onLeaveRoom).toHaveBeenCalledTimes(1);
  });

  test('handles empty username', () => {
    render(<CreateRoomModal {...defaultProps} username="" />);
    
    const input = screen.getByPlaceholderText('Enter your name');
    expect(input).toHaveValue('');
  });

  test('handles username with value', () => {
    render(<CreateRoomModal {...defaultProps} username="TestPlayer" />);
    
    const input = screen.getByPlaceholderText('Enter your name');
    expect(input).toHaveValue('TestPlayer');
  });

  test('renders with different room ID', () => {
    render(<CreateRoomModal {...defaultProps} createRoomId="DIFFERENT" />);
    
    expect(screen.getByText('Room ID:')).toBeInTheDocument();
    expect(screen.getByText('DIFFERENT')).toBeInTheDocument();
  });

  test('handles multiple players in list', () => {
    const players = [
      { id: '1', name: 'Player1' },
      { id: '2', name: 'Player2' },
      { id: '3', name: 'Player3' },
      { id: '4', name: 'Player4' }
    ];
    
    render(<CreateRoomModal {...defaultProps} currentRoomId="ROOM123" roomPlayers={players} />);
    
    expect(screen.getByText('Connected players (4):')).toBeInTheDocument();
    expect(screen.getByText('Player1')).toBeInTheDocument();
    expect(screen.getByText('Player2')).toBeInTheDocument();
    expect(screen.getByText('Player3')).toBeInTheDocument();
    expect(screen.getByText('Player4')).toBeInTheDocument();
  });

  test('handles players with special characters in names', () => {
    const players = [
      { id: '1', name: 'José María' },
      { id: '2', name: 'Player-With_Numbers123' }
    ];
    
    render(<CreateRoomModal {...defaultProps} currentRoomId="ROOM123" roomPlayers={players} />);
    
    expect(screen.getByText('José María')).toBeInTheDocument();
    expect(screen.getByText('Player-With_Numbers123')).toBeInTheDocument();
  });
});
