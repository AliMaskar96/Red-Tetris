const React = require('react');
const { render, screen, fireEvent } = require('@testing-library/react');
const GameControls = require('../../../src/client/components/GameControls').default;

describe('GameControls Component', () => {
  const defaultProps = {
    playing: true,
    paused: false,
    onTogglePause: jest.fn(),
    onQuit: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders null when not playing', () => {
    const { container } = render(
      <GameControls {...defaultProps} playing={false} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  test('renders controls when playing', () => {
    render(<GameControls {...defaultProps} />);
    
    expect(screen.getByText('⏸ PAUSE')).toBeInTheDocument();
    expect(screen.getByText('🚪 QUIT')).toBeInTheDocument();
  });

  test('shows resume button when paused', () => {
    render(<GameControls {...defaultProps} paused={true} />);
    
    expect(screen.getByText('▶ RESUME')).toBeInTheDocument();
    expect(screen.getByText('🚪 QUIT')).toBeInTheDocument();
  });

  test('calls onTogglePause when pause/resume button is clicked', () => {
    const onTogglePause = jest.fn();
    render(<GameControls {...defaultProps} onTogglePause={onTogglePause} />);
    
    const pauseButton = screen.getByText('⏸ PAUSE');
    fireEvent.click(pauseButton);
    
    expect(onTogglePause).toHaveBeenCalledTimes(1);
  });

  test('calls onQuit when quit button is clicked', () => {
    const onQuit = jest.fn();
    render(<GameControls {...defaultProps} onQuit={onQuit} />);
    
    const quitButton = screen.getByText('🚪 QUIT');
    fireEvent.click(quitButton);
    
    expect(onQuit).toHaveBeenCalledTimes(1);
  });

  test('pause button has correct styles when not paused', () => {
    render(<GameControls {...defaultProps} paused={false} />);
    
    const pauseButton = screen.getByText('⏸ PAUSE');
    // Test key style properties that are reliably applied
    expect(pauseButton).toHaveStyle({
      width: '120px',
      height: '28px',
      color: 'white',
      cursor: 'pointer'
    });
  });

  test('pause button has correct styles when paused', () => {
    render(<GameControls {...defaultProps} paused={true} />);
    
    const resumeButton = screen.getByText('▶ RESUME');
    expect(resumeButton).toHaveStyle({
      background: '#4CAF50'
    });
  });

  test('quit button has correct styles', () => {
    render(<GameControls {...defaultProps} />);
    
    const quitButton = screen.getByText('🚪 QUIT');
    // Test key style properties that are reliably applied
    expect(quitButton).toHaveStyle({
      width: '120px',
      height: '28px',
      color: 'white',
      cursor: 'pointer'
    });
  });

  test('container has correct layout styles', () => {
    const { container } = render(<GameControls {...defaultProps} />);
    
    const controlsDiv = container.firstChild;
    expect(controlsDiv).toHaveStyle({
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      marginTop: '12px'
    });
  });

  test('buttons have transition and shadow styles', () => {
    render(<GameControls {...defaultProps} />);
    
    const pauseButton = screen.getByText('⏸ PAUSE');
    const quitButton = screen.getByText('🚪 QUIT');
    
    [pauseButton, quitButton].forEach(button => {
      expect(button).toHaveStyle({
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      });
    });
  });

  test('handles multiple pause/resume toggles', () => {
    const onTogglePause = jest.fn();
    const { rerender } = render(
      <GameControls {...defaultProps} onTogglePause={onTogglePause} paused={false} />
    );
    
    // Click pause
    fireEvent.click(screen.getByText('⏸ PAUSE'));
    expect(onTogglePause).toHaveBeenCalledTimes(1);
    
    // Re-render with paused state
    rerender(
      <GameControls {...defaultProps} onTogglePause={onTogglePause} paused={true} />
    );
    
    // Click resume
    fireEvent.click(screen.getByText('▶ RESUME'));
    expect(onTogglePause).toHaveBeenCalledTimes(2);
  });

  test('maintains button accessibility', () => {
    render(<GameControls {...defaultProps} />);
    
    const pauseButton = screen.getByText('⏸ PAUSE');
    const quitButton = screen.getByText('🚪 QUIT');
    
    // Buttons should be focusable
    expect(pauseButton.tagName).toBe('BUTTON');
    expect(quitButton.tagName).toBe('BUTTON');
    
    // Check they can receive focus
    pauseButton.focus();
    expect(document.activeElement).toBe(pauseButton);
    
    quitButton.focus();
    expect(document.activeElement).toBe(quitButton);
  });
});
