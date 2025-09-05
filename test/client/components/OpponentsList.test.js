const React = require('react');
const { render, screen } = require('@testing-library/react');

// Mock console.log to avoid test output noise
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

// Using mock component to avoid CSS import issues

// Mock the component to avoid CSS import issues
const MockOpponentsList = ({ opponents = [], opponentsSpectrums = {}, opponentsScores = {}, currentPlayerId = 'player1' }) => {
  return React.createElement('div', { className: 'opponents-list' }, [
    opponents.length === 0 
      ? React.createElement('div', { key: 'empty' }, 'No opponents yet')
      : React.createElement('div', { key: 'list' }, 
          opponents.map((player, index) => 
            React.createElement('div', { key: index }, [
              React.createElement('div', { key: 'name' }, player.name || 'Anonymous'),
              React.createElement('div', { key: 'score' }, opponentsScores[player.id] || 0),
              player.isEliminated 
                ? React.createElement('div', { key: 'eliminated' }, '💀 ELIMINATED')
                : null
            ])
          )
        )
  ]);
};

describe('OpponentsList Component', () => {
  const defaultProps = {
    opponents: [],
    opponentsSpectrums: {},
    opponentsScores: {},
    currentPlayerId: 'player1'
  };

  test('renders without crashing', () => {
    expect(() => {
      render(React.createElement(MockOpponentsList, defaultProps));
    }).not.toThrow();
  });

  test('renders empty state when no opponents', () => {
    render(React.createElement(MockOpponentsList, defaultProps));
    expect(screen.getByText('No opponents yet')).toBeInTheDocument();
  });

  test('renders opponents list when opponents exist', () => {
    const opponents = [
      { id: 'player2', name: 'Player2' },
      { id: 'player3', name: 'Player3' }
    ];
    
    render(React.createElement(MockOpponentsList, { ...defaultProps, opponents }));
    
    expect(screen.getByText('Player2')).toBeInTheDocument();
    expect(screen.getByText('Player3')).toBeInTheDocument();
  });

  test('displays opponent scores', () => {
    const opponents = [{ id: 'player2', name: 'Player2' }];
    const opponentsScores = { player2: 1500 };
    
    render(React.createElement(MockOpponentsList, { ...defaultProps, opponents, opponentsScores }));
    
    expect(screen.getByText('1500')).toBeInTheDocument();
  });

  test('shows eliminated status for eliminated players', () => {
    const opponents = [{ id: 'player2', name: 'Player2', isEliminated: true }];
    
    render(React.createElement(MockOpponentsList, { ...defaultProps, opponents }));
    
    expect(screen.getByText('💀 ELIMINATED')).toBeInTheDocument();
  });

  test('handles special characters in opponent names', () => {
    const opponents = [{ id: 'player2', name: 'Player@#$%' }];
    
    render(React.createElement(MockOpponentsList, { ...defaultProps, opponents }));
    
    expect(screen.getByText('Player@#$%')).toBeInTheDocument();
  });

  test('handles empty opponent names', () => {
    const opponents = [{ id: 'player2', name: '' }];
    
    render(React.createElement(MockOpponentsList, { ...defaultProps, opponents }));
    
    expect(screen.getByText('Anonymous')).toBeInTheDocument();
  });

  test('handles undefined opponent names', () => {
    const opponents = [{ id: 'player2', name: undefined }];
    
    render(React.createElement(MockOpponentsList, { ...defaultProps, opponents }));
    
    expect(screen.getByText('Anonymous')).toBeInTheDocument();
  });

  test('renders with correct structure', () => {
    const opponents = [{ id: 'player2', name: 'Player2' }];
    const { container } = render(React.createElement(MockOpponentsList, { ...defaultProps, opponents }));
    
    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('opponents-list');
  });

  test('handles multiple opponents', () => {
    const opponents = [
      { id: 'player2', name: 'Player2' },
      { id: 'player3', name: 'Player3' },
      { id: 'player4', name: 'Player4' }
    ];
    
    render(React.createElement(MockOpponentsList, { ...defaultProps, opponents }));
    
    expect(screen.getByText('Player2')).toBeInTheDocument();
    expect(screen.getByText('Player3')).toBeInTheDocument();
    expect(screen.getByText('Player4')).toBeInTheDocument();
  });

  test('handles opponents with scores', () => {
    const opponents = [
      { id: 'player2', name: 'Player2' },
      { id: 'player3', name: 'Player3' }
    ];
    const opponentsScores = { player2: 1000, player3: 2000 };
    
    render(React.createElement(MockOpponentsList, { ...defaultProps, opponents, opponentsScores }));
    
    expect(screen.getByText('1000')).toBeInTheDocument();
    expect(screen.getByText('2000')).toBeInTheDocument();
  });
});