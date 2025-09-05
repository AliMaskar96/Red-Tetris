const React = require('react');
const { render, screen, fireEvent } = require('@testing-library/react');

const GameOverModal = require('../../../src/client/components/GameOverModal').default;

describe('GameOverModal Component', () => {
  const defaultProps = {
    gameOver: false,
    multiplayerGameEnded: false,
    gameWinner: null,
    currentPlayerId: 'player1',
    score: 1000,
    isMultiplayer: false,
    onReplay: jest.fn(),
    onGoToLobby: jest.fn(),
    onRematch: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders nothing when gameOver is false', () => {
    render(<GameOverModal {...defaultProps} />);
    
    expect(screen.queryByText('Game Over')).not.toBeInTheDocument();
    expect(screen.queryByText('ELIMINATED!')).not.toBeInTheDocument();
    expect(screen.queryByText('WINNER!')).not.toBeInTheDocument();
  });

  test('renders nothing when multiplayerGameEnded is true but no gameWinner', () => {
    render(<GameOverModal {...defaultProps} multiplayerGameEnded={true} />);
    
    expect(screen.queryByText('WINNER!')).not.toBeInTheDocument();
    expect(screen.queryByText('GAME OVER')).not.toBeInTheDocument();
  });

  describe('Single Player Game Over', () => {
    test('renders game over modal for single player', () => {
      render(<GameOverModal {...defaultProps} gameOver={true} />);
      
      expect(screen.getByText('Game Over')).toBeInTheDocument();
      expect(screen.getByText('Score: 1000')).toBeInTheDocument();
      expect(screen.getByText('Play Again')).toBeInTheDocument();
      expect(screen.getByText('Go to Lobby')).toBeInTheDocument();
    });

    test('calls onReplay when Play Again button is clicked', () => {
      render(<GameOverModal {...defaultProps} gameOver={true} />);
      
      const playAgainButton = screen.getByText('Play Again');
      fireEvent.click(playAgainButton);
      
      expect(defaultProps.onReplay).toHaveBeenCalledTimes(1);
    });

    test('calls onGoToLobby when Go to Lobby button is clicked', () => {
      render(<GameOverModal {...defaultProps} gameOver={true} />);
      
      const lobbyButton = screen.getByText('Go to Lobby');
      fireEvent.click(lobbyButton);
      
      expect(defaultProps.onGoToLobby).toHaveBeenCalledTimes(1);
    });

    test('displays correct score', () => {
      render(<GameOverModal {...defaultProps} gameOver={true} score={2500} />);
      
      expect(screen.getByText('Score: 2500')).toBeInTheDocument();
    });
  });

  describe('Multiplayer Elimination', () => {
    test('renders elimination modal for multiplayer when eliminated', () => {
      render(<GameOverModal {...defaultProps} gameOver={true} isMultiplayer={true} />);
      
      expect(screen.getByText('💀 ELIMINATED!')).toBeInTheDocument();
      expect(screen.getByText('Score: 1000')).toBeInTheDocument();
      expect(screen.getByText('🔄 PLAY AGAIN')).toBeInTheDocument();
      expect(screen.getByText('🏠 LOBBY')).toBeInTheDocument();
    });

    test('calls onRematch when PLAY AGAIN button is clicked in multiplayer', () => {
      render(<GameOverModal {...defaultProps} gameOver={true} isMultiplayer={true} />);
      
      const playAgainButton = screen.getByText('🔄 PLAY AGAIN');
      fireEvent.click(playAgainButton);
      
      expect(defaultProps.onRematch).toHaveBeenCalledTimes(1);
    });

    test('calls onGoToLobby when LOBBY button is clicked in multiplayer', () => {
      render(<GameOverModal {...defaultProps} gameOver={true} isMultiplayer={true} />);
      
      const lobbyButton = screen.getByText('🏠 LOBBY');
      fireEvent.click(lobbyButton);
      
      expect(defaultProps.onGoToLobby).toHaveBeenCalledTimes(1);
    });
  });

  describe('Multiplayer Game End - Victory', () => {
    const winnerProps = {
      ...defaultProps,
      multiplayerGameEnded: true,
      gameWinner: { id: 'player1', name: 'Player1' },
      currentPlayerId: 'player1'
    };

    test('renders victory modal when current player wins', () => {
      render(<GameOverModal {...winnerProps} />);
      
      expect(screen.getByText('🏆 WINNER!')).toBeInTheDocument();
      expect(screen.getByText('Congratulations! You won!')).toBeInTheDocument();
      expect(screen.getByText('Final score: 1000')).toBeInTheDocument();
      expect(screen.getByText('🔄 PLAY AGAIN')).toBeInTheDocument();
      expect(screen.getByText('🏠 LOBBY')).toBeInTheDocument();
    });

    test('calls onRematch when PLAY AGAIN button is clicked after victory', () => {
      render(<GameOverModal {...winnerProps} />);
      
      const playAgainButton = screen.getByText('🔄 PLAY AGAIN');
      fireEvent.click(playAgainButton);
      
      expect(defaultProps.onRematch).toHaveBeenCalledTimes(1);
    });

    test('calls onGoToLobby when LOBBY button is clicked after victory', () => {
      render(<GameOverModal {...winnerProps} />);
      
      const lobbyButton = screen.getByText('🏠 LOBBY');
      fireEvent.click(lobbyButton);
      
      expect(defaultProps.onGoToLobby).toHaveBeenCalledTimes(1);
    });

    test('displays correct final score', () => {
      render(<GameOverModal {...winnerProps} score={3500} />);
      
      expect(screen.getByText('Final score: 3500')).toBeInTheDocument();
    });
  });

  describe('Multiplayer Game End - Defeat', () => {
    const defeatProps = {
      ...defaultProps,
      multiplayerGameEnded: true,
      gameWinner: { id: 'player2', name: 'Player2' },
      currentPlayerId: 'player1'
    };

    test('renders defeat modal when another player wins', () => {
      render(<GameOverModal {...defeatProps} />);
      
      expect(screen.getByText('💀 GAME OVER')).toBeInTheDocument();
      expect(screen.getByText('Player2 won!')).toBeInTheDocument();
      expect(screen.getByText('Final score: 1000')).toBeInTheDocument();
      expect(screen.getByText('🔄 PLAY AGAIN')).toBeInTheDocument();
      expect(screen.getByText('🏠 LOBBY')).toBeInTheDocument();
    });

    test('calls onRematch when PLAY AGAIN button is clicked after defeat', () => {
      render(<GameOverModal {...defeatProps} />);
      
      const playAgainButton = screen.getByText('🔄 PLAY AGAIN');
      fireEvent.click(playAgainButton);
      
      expect(defaultProps.onRematch).toHaveBeenCalledTimes(1);
    });

    test('calls onGoToLobby when LOBBY button is clicked after defeat', () => {
      render(<GameOverModal {...defeatProps} />);
      
      const lobbyButton = screen.getByText('🏠 LOBBY');
      fireEvent.click(lobbyButton);
      
      expect(defaultProps.onGoToLobby).toHaveBeenCalledTimes(1);
    });

    test('displays winner name correctly', () => {
      const customDefeatProps = {
        ...defeatProps,
        gameWinner: { id: 'player3', name: 'Alice Johnson' }
      };
      
      render(<GameOverModal {...customDefeatProps} />);
      
      expect(screen.getByText('Alice Johnson won!')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles zero score', () => {
      render(<GameOverModal {...defaultProps} gameOver={true} score={0} />);
      
      expect(screen.getByText('Score: 0')).toBeInTheDocument();
    });

    test('handles high score', () => {
      render(<GameOverModal {...defaultProps} gameOver={true} score={999999} />);
      
      expect(screen.getByText('Score: 999999')).toBeInTheDocument();
    });

    test('handles winner with special characters in name', () => {
      const specialWinnerProps = {
        ...defaultProps,
        multiplayerGameEnded: true,
        gameWinner: { id: 'player2', name: 'José María' },
        currentPlayerId: 'player1'
      };
      
      render(<GameOverModal {...specialWinnerProps} />);
      
      expect(screen.getByText('José María won!')).toBeInTheDocument();
    });

    test('handles winner with numbers in name', () => {
      const numberWinnerProps = {
        ...defaultProps,
        multiplayerGameEnded: true,
        gameWinner: { id: 'player2', name: 'Player123' },
        currentPlayerId: 'player1'
      };
      
      render(<GameOverModal {...numberWinnerProps} />);
      
      expect(screen.getByText('Player123 won!')).toBeInTheDocument();
    });

    test('prioritizes multiplayer game end over regular game over', () => {
      const priorityProps = {
        ...defaultProps,
        gameOver: true,
        multiplayerGameEnded: true,
        gameWinner: { id: 'player1', name: 'Player1' },
        currentPlayerId: 'player1'
      };
      
      render(<GameOverModal {...priorityProps} />);
      
      // Should show victory modal, not elimination modal
      expect(screen.getByText('🏆 WINNER!')).toBeInTheDocument();
      expect(screen.queryByText('💀 ELIMINATED!')).not.toBeInTheDocument();
      expect(screen.queryByText('Game Over')).not.toBeInTheDocument();
    });
  });

  describe('Modal Styling and Structure', () => {
    test('renders with correct overlay structure', () => {
      const { container } = render(<GameOverModal {...defaultProps} gameOver={true} />);
      
      const overlay = container.firstChild;
      expect(overlay).toHaveStyle({
        position: 'fixed',
        top: '0px',
        left: '0px',
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.9)'
      });
    });

    test('renders modal with correct structure for single player game over', () => {
      const { container } = render(<GameOverModal {...defaultProps} gameOver={true} />);
      
      const modal = container.querySelector('div > div');
      expect(modal).toBeInTheDocument();
    });

    test('renders modal with correct structure for multiplayer elimination', () => {
      const { container } = render(<GameOverModal {...defaultProps} gameOver={true} isMultiplayer={true} />);
      
      const modal = container.querySelector('div > div');
      expect(modal).toBeInTheDocument();
    });

    test('renders modal with correct structure for victory', () => {
      const victoryProps = {
        ...defaultProps,
        multiplayerGameEnded: true,
        gameWinner: { id: 'player1', name: 'Player1' },
        currentPlayerId: 'player1'
      };
      
      const { container } = render(<GameOverModal {...victoryProps} />);
      
      const modal = container.querySelector('div > div');
      expect(modal).toBeInTheDocument();
    });

    test('renders modal with correct structure for defeat', () => {
      const defeatProps = {
        ...defaultProps,
        multiplayerGameEnded: true,
        gameWinner: { id: 'player2', name: 'Player2' },
        currentPlayerId: 'player1'
      };
      
      const { container } = render(<GameOverModal {...defeatProps} />);
      
      const modal = container.querySelector('div > div');
      expect(modal).toBeInTheDocument();
    });
  });
});
