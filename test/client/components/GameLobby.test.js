const React = require('react');
const { render, screen, fireEvent } = require('@testing-library/react');

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve())
  }
});

const GameLobby = require('../../../src/client/components/GameLobby').default;

describe('GameLobby Component', () => {
  const defaultProps = {
    players: [
      { id: '1', name: 'Alice Johnson', isLeader: true },
      { id: '2', name: 'Bob Smith', isLeader: false }
    ],
    roomId: 'ABC123',
    isLeader: true,
    onStartGame: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders lobby with correct elements', () => {
    render(<GameLobby {...defaultProps} />);
    
    expect(screen.getByText('Game Lobby')).toBeInTheDocument();
    expect(screen.getByText('Room:')).toBeInTheDocument();
    expect(screen.getByText('ABC123')).toBeInTheDocument();
    expect(screen.getByText('Players')).toBeInTheDocument();
  });

  test('renders lobby icon', () => {
    render(<GameLobby {...defaultProps} />);
    
    const lobbyIcon = screen.getByRole('img', { name: 'lobby' });
    expect(lobbyIcon).toBeInTheDocument();
    expect(lobbyIcon).toHaveTextContent('🎮');
  });

  test('renders room ID correctly', () => {
    render(<GameLobby {...defaultProps} />);
    
    const roomIdElement = screen.getByText('ABC123');
    expect(roomIdElement).toBeInTheDocument();
    expect(roomIdElement).toHaveClass('room-id');
  });

  test('renders copy room button', () => {
    render(<GameLobby {...defaultProps} />);
    
    const copyButton = screen.getByTitle('Copy room code');
    expect(copyButton).toBeInTheDocument();
    expect(copyButton).toHaveTextContent('📋');
  });

  test('copies room ID to clipboard when copy button is clicked', () => {
    render(<GameLobby {...defaultProps} />);
    
    const copyButton = screen.getByTitle('Copy room code');
    fireEvent.click(copyButton);
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ABC123');
  });

  test('renders all players with correct information', () => {
    render(<GameLobby {...defaultProps} />);
    
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    
    // Check for player avatars (initials)
    expect(screen.getByText('AJ')).toBeInTheDocument(); // Alice Johnson
    expect(screen.getByText('BS')).toBeInTheDocument(); // Bob Smith
  });

  test('shows leader badge for leader player', () => {
    render(<GameLobby {...defaultProps} />);
    
    const leaderBadge = screen.getByText('👑');
    expect(leaderBadge).toBeInTheDocument();
    expect(leaderBadge).toHaveClass('leader-badge');
  });

  test('does not show leader badge for non-leader players', () => {
    const propsWithoutLeader = {
      ...defaultProps,
      players: [
        { id: '1', name: 'Alice Johnson', isLeader: false },
        { id: '2', name: 'Bob Smith', isLeader: false }
      ]
    };
    
    render(<GameLobby {...propsWithoutLeader} />);
    
    expect(screen.queryByText('👑')).not.toBeInTheDocument();
  });

  test('shows start game button when user is leader', () => {
    render(<GameLobby {...defaultProps} />);
    
    const startButton = screen.getByText('Start Game');
    expect(startButton).toBeInTheDocument();
    expect(startButton).toHaveClass('start-game-btn', 'animated');
  });

  test('does not show start game button when user is not leader', () => {
    render(<GameLobby {...defaultProps} isLeader={false} />);
    
    expect(screen.queryByText('Start Game')).not.toBeInTheDocument();
  });

  test('calls onStartGame when start button is clicked', () => {
    render(<GameLobby {...defaultProps} />);
    
    const startButton = screen.getByText('Start Game');
    fireEvent.click(startButton);
    
    expect(defaultProps.onStartGame).toHaveBeenCalledTimes(1);
  });

  test('handles empty players array', () => {
    render(<GameLobby {...defaultProps} players={[]} />);
    
    expect(screen.getByText('Players')).toBeInTheDocument();
    expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
    expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();
  });

  test('handles undefined players prop', () => {
    render(<GameLobby {...defaultProps} players={undefined} />);
    
    expect(screen.getByText('Players')).toBeInTheDocument();
    expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
  });

  test('handles empty room ID', () => {
    const { container } = render(<GameLobby {...defaultProps} roomId="" />);
    
    expect(screen.getByText('Room:')).toBeInTheDocument();
    const roomIdElement = container.querySelector('.room-id');
    expect(roomIdElement).toHaveTextContent('');
  });

  test('handles undefined room ID', () => {
    const { container } = render(<GameLobby {...defaultProps} roomId={undefined} />);
    
    expect(screen.getByText('Room:')).toBeInTheDocument();
    const roomIdElement = container.querySelector('.room-id');
    expect(roomIdElement).toHaveTextContent('');
  });

  test('generates correct initials for single name', () => {
    const singleNameProps = {
      ...defaultProps,
      players: [{ id: '1', name: 'Alice', isLeader: true }]
    };
    
    render(<GameLobby {...singleNameProps} />);
    
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  test('generates correct initials for multiple names', () => {
    const multiNameProps = {
      ...defaultProps,
      players: [{ id: '1', name: 'Alice Bob Charlie', isLeader: true }]
    };
    
    render(<GameLobby {...multiNameProps} />);
    
    expect(screen.getByText('ABC')).toBeInTheDocument();
  });

  test('handles players with special characters in names', () => {
    const specialNameProps = {
      ...defaultProps,
      players: [{ id: '1', name: 'José María', isLeader: true }]
    };
    
    render(<GameLobby {...specialNameProps} />);
    
    expect(screen.getByText('JM')).toBeInTheDocument();
    expect(screen.getByText('José María')).toBeInTheDocument();
  });

  test('renders multiple players with different leader status', () => {
    const multiPlayerProps = {
      ...defaultProps,
      players: [
        { id: '1', name: 'Leader Player', isLeader: true },
        { id: '2', name: 'Regular Player', isLeader: false },
        { id: '3', name: 'Another Player', isLeader: false }
      ]
    };
    
    render(<GameLobby {...multiPlayerProps} />);
    
    expect(screen.getByText('Leader Player')).toBeInTheDocument();
    expect(screen.getByText('Regular Player')).toBeInTheDocument();
    expect(screen.getByText('Another Player')).toBeInTheDocument();
    expect(screen.getByText('👑')).toBeInTheDocument();
  });
});
