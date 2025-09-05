const React = require('react');
const { render, screen, fireEvent } = require('@testing-library/react');

// Mock the Board component
jest.mock('../../../src/client/components/Board', () => ({
  NextPiecePreview: ({ type }) => (
    <div data-testid="next-piece-preview" data-type={type}>
      Next Piece: {type || 'None'}
    </div>
  )
}));

const GameHUD = require('../../../src/client/components/GameHUD').default;

describe('GameHUD Component', () => {
  const defaultProps = {
    score: 1000,
    lines: 5,
    nextType: 'I',
    playing: true,
    paused: false,
    isMultiplayer: false,
    currentPlayerId: null,
    onTogglePause: jest.fn(),
    onQuit: jest.fn(),
    updateHighScores: jest.fn(),
    updateGameStats: jest.fn(),
    socketAPI: {
      sendGameOver: jest.fn()
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders score, level, and lines correctly', () => {
    render(<GameHUD {...defaultProps} />);
    
    expect(screen.getByText('SCORE')).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();
    expect(screen.getByText('LEVEL')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('LINES')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  test('renders next piece preview', () => {
    render(<GameHUD {...defaultProps} />);
    
    expect(screen.getByText('NEXT')).toBeInTheDocument();
    expect(screen.getByTestId('next-piece-preview')).toBeInTheDocument();
    expect(screen.getByTestId('next-piece-preview')).toHaveAttribute('data-type', 'I');
  });

  test('shows pause button when playing and not paused', () => {
    render(<GameHUD {...defaultProps} />);
    
    expect(screen.getByText('⏸ PAUSE')).toBeInTheDocument();
    expect(screen.queryByText('▶ RESUME')).not.toBeInTheDocument();
  });

  test('shows resume button when playing and paused', () => {
    render(<GameHUD {...defaultProps} paused={true} />);
    
    expect(screen.getByText('▶ RESUME')).toBeInTheDocument();
    expect(screen.queryByText('⏸ PAUSE')).not.toBeInTheDocument();
  });

  test('shows quit button when playing', () => {
    render(<GameHUD {...defaultProps} />);
    
    expect(screen.getByText('🚪 QUIT')).toBeInTheDocument();
  });

  test('does not show pause/quit buttons when not playing', () => {
    render(<GameHUD {...defaultProps} playing={false} />);
    
    expect(screen.queryByText('⏸ PAUSE')).not.toBeInTheDocument();
    expect(screen.queryByText('▶ RESUME')).not.toBeInTheDocument();
    expect(screen.queryByText('🚪 QUIT')).not.toBeInTheDocument();
  });

  test('calls onTogglePause when pause button is clicked', () => {
    render(<GameHUD {...defaultProps} />);
    
    const pauseButton = screen.getByText('⏸ PAUSE');
    fireEvent.click(pauseButton);
    
    expect(defaultProps.onTogglePause).toHaveBeenCalledTimes(1);
  });

  test('calls onTogglePause when resume button is clicked', () => {
    render(<GameHUD {...defaultProps} paused={true} />);
    
    const resumeButton = screen.getByText('▶ RESUME');
    fireEvent.click(resumeButton);
    
    expect(defaultProps.onTogglePause).toHaveBeenCalledTimes(1);
  });

  test('handles quit button click correctly', () => {
    render(<GameHUD {...defaultProps} />);
    
    const quitButton = screen.getByText('🚪 QUIT');
    fireEvent.click(quitButton);
    
    expect(defaultProps.updateHighScores).toHaveBeenCalledWith(1000);
    expect(defaultProps.updateGameStats).toHaveBeenCalledWith(1000, 5, false, false);
    expect(defaultProps.onQuit).toHaveBeenCalledTimes(1);
  });

  test('does not save score/stats when score and lines are zero', () => {
    render(<GameHUD {...defaultProps} score={0} lines={0} />);
    
    const quitButton = screen.getByText('🚪 QUIT');
    fireEvent.click(quitButton);
    
    expect(defaultProps.updateHighScores).not.toHaveBeenCalled();
    expect(defaultProps.updateGameStats).not.toHaveBeenCalled();
    expect(defaultProps.onQuit).toHaveBeenCalledTimes(1);
  });

  test('sends game over to server in multiplayer mode', () => {
    const multiplayerProps = {
      ...defaultProps,
      isMultiplayer: true,
      currentPlayerId: 'player123'
    };
    
    render(<GameHUD {...multiplayerProps} />);
    
    const quitButton = screen.getByText('🚪 QUIT');
    fireEvent.click(quitButton);
    
    expect(multiplayerProps.socketAPI.sendGameOver).toHaveBeenCalledWith('player123');
    expect(defaultProps.onQuit).toHaveBeenCalledTimes(1);
  });

  test('does not send game over when not in multiplayer mode', () => {
    render(<GameHUD {...defaultProps} />);
    
    const quitButton = screen.getByText('🚪 QUIT');
    fireEvent.click(quitButton);
    
    expect(defaultProps.socketAPI.sendGameOver).not.toHaveBeenCalled();
  });

  test('does not send game over when no current player ID', () => {
    const multiplayerProps = {
      ...defaultProps,
      isMultiplayer: true,
      currentPlayerId: null
    };
    
    render(<GameHUD {...multiplayerProps} />);
    
    const quitButton = screen.getByText('🚪 QUIT');
    fireEvent.click(quitButton);
    
    expect(multiplayerProps.socketAPI.sendGameOver).not.toHaveBeenCalled();
  });

  test('updates game stats with multiplayer flag', () => {
    const multiplayerProps = {
      ...defaultProps,
      isMultiplayer: true,
      currentPlayerId: 'player123'
    };
    
    render(<GameHUD {...multiplayerProps} />);
    
    const quitButton = screen.getByText('🚪 QUIT');
    fireEvent.click(quitButton);
    
    expect(multiplayerProps.updateGameStats).toHaveBeenCalledWith(1000, 5, true, false);
  });

  test('renders with different score and lines values', () => {
    render(<GameHUD {...defaultProps} score={2500} lines={12} />);
    
    expect(screen.getByText('2500')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  test('renders with different next piece type', () => {
    render(<GameHUD {...defaultProps} nextType="T" />);
    
    expect(screen.getByTestId('next-piece-preview')).toHaveAttribute('data-type', 'T');
  });

  test('handles null next piece type', () => {
    render(<GameHUD {...defaultProps} nextType={null} />);
    
    const nextPiecePreview = screen.getByTestId('next-piece-preview');
    expect(nextPiecePreview).toBeInTheDocument();
    expect(nextPiecePreview).toHaveTextContent('Next Piece: None');
  });
});
