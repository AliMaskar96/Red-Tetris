const React = require('react');
const { render, screen } = require('@testing-library/react');

const PlayerGrid = require('../../../src/client/components/PlayerGrid').default;

describe('PlayerGrid Component', () => {
  const defaultProps = {
    grid: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ],
    playerName: 'Test Player',
    spectrum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  };

  test('renders player header with name and avatar', () => {
    render(<PlayerGrid {...defaultProps} />);
    
    expect(screen.getByText('Test Player')).toBeInTheDocument();
    expect(screen.getByText('TP')).toBeInTheDocument(); // Initials
  });

  test('renders grid with correct structure', () => {
    const { container } = render(<PlayerGrid {...defaultProps} />);
    
    const gridRows = container.querySelectorAll('.grid-row');
    expect(gridRows).toHaveLength(20); // 20 rows
    
    gridRows.forEach(row => {
      const cells = row.querySelectorAll('.grid-cell');
      expect(cells).toHaveLength(10); // 10 columns per row
    });
  });

  test('renders grid cells with correct classes', () => {
    const { container } = render(<PlayerGrid {...defaultProps} />);
    
    const cells = container.querySelectorAll('.grid-cell');
    expect(cells.length).toBe(200); // 20 rows * 10 columns
    
    // All cells should have cell-0 class for empty grid
    cells.forEach(cell => {
      expect(cell).toHaveClass('cell-0');
    });
  });

  test('renders grid with different cell values', () => {
    const gridWithPieces = [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Full row
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2]  // Another full row
    ];
    
    const { container } = render(<PlayerGrid {...defaultProps} grid={gridWithPieces} />);
    
    const cell0Elements = container.querySelectorAll('.cell-0');
    const cell1Elements = container.querySelectorAll('.cell-1');
    const cell2Elements = container.querySelectorAll('.cell-2');
    
    expect(cell0Elements).toHaveLength(180); // 18 rows of 0s
    expect(cell1Elements).toHaveLength(10);  // 1 row of 1s
    expect(cell2Elements).toHaveLength(10);  // 1 row of 2s
  });

  test('renders spectrum bar chart when spectrum is provided', () => {
    const { container } = render(<PlayerGrid {...defaultProps} />);
    
    const spectrumChart = container.querySelector('.spectrum-bar-chart');
    expect(spectrumChart).toBeInTheDocument();
    expect(spectrumChart).toHaveAttribute('aria-label', 'Spectrum');
    
    const spectrumBars = container.querySelectorAll('.spectrum-bar');
    expect(spectrumBars).toHaveLength(10); // 10 columns
  });

  test('does not render spectrum when spectrum is empty', () => {
    const { container } = render(<PlayerGrid {...defaultProps} spectrum={[]} />);
    
    const spectrumChart = container.querySelector('.spectrum-bar-chart');
    expect(spectrumChart).not.toBeInTheDocument();
  });

  test('does not render spectrum when spectrum is undefined', () => {
    const { container } = render(<PlayerGrid {...defaultProps} spectrum={undefined} />);
    
    const spectrumChart = container.querySelector('.spectrum-bar-chart');
    expect(spectrumChart).not.toBeInTheDocument();
  });

  test('renders spectrum bars with correct heights', () => {
    const { container } = render(<PlayerGrid {...defaultProps} />);
    
    const spectrumBars = container.querySelectorAll('.spectrum-bar');
    spectrumBars.forEach((bar, index) => {
      const expectedHeight = Math.max(2, index * 5);
      expect(bar).toHaveStyle(`height: ${expectedHeight}px`);
    });
  });

  test('handles empty grid', () => {
    const { container } = render(<PlayerGrid {...defaultProps} grid={[[]]} />);
    
    const gridRows = container.querySelectorAll('.grid-row');
    expect(gridRows).toHaveLength(1);
    
    const cells = container.querySelectorAll('.grid-cell');
    expect(cells).toHaveLength(0); // Empty row has no cells
  });

  test('handles undefined grid', () => {
    const { container } = render(<PlayerGrid {...defaultProps} grid={undefined} />);
    
    const gridRows = container.querySelectorAll('.grid-row');
    expect(gridRows).toHaveLength(1); // Default empty array [[]] is used
  });

  test('handles empty player name', () => {
    const { container } = render(<PlayerGrid {...defaultProps} playerName="" />);
    
    const playerNameElement = container.querySelector('h4');
    const avatarElement = container.querySelector('.player-avatar-large');
    
    expect(playerNameElement).toHaveTextContent('');
    expect(avatarElement).toHaveTextContent('');
  });

  test('handles undefined player name', () => {
    const { container } = render(<PlayerGrid {...defaultProps} playerName={undefined} />);
    
    const playerNameElement = container.querySelector('h4');
    const avatarElement = container.querySelector('.player-avatar-large');
    
    expect(playerNameElement).toHaveTextContent('');
    expect(avatarElement).toHaveTextContent('');
  });

  test('generates correct initials for single name', () => {
    render(<PlayerGrid {...defaultProps} playerName="Alice" />);
    
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  test('generates correct initials for multiple names', () => {
    render(<PlayerGrid {...defaultProps} playerName="Alice Bob Charlie" />);
    
    expect(screen.getByText('ABC')).toBeInTheDocument();
  });

  test('handles names with special characters', () => {
    render(<PlayerGrid {...defaultProps} playerName="José María" />);
    
    expect(screen.getByText('JM')).toBeInTheDocument();
    expect(screen.getByText('José María')).toBeInTheDocument();
  });

  test('handles names with numbers and symbols', () => {
    render(<PlayerGrid {...defaultProps} playerName="Player123 Test!" />);
    
    expect(screen.getByText('PT')).toBeInTheDocument();
    expect(screen.getByText('Player123 Test!')).toBeInTheDocument();
  });

  test('renders with different spectrum values', () => {
    const customSpectrum = [5, 10, 15, 20, 0, 3, 7, 12, 18, 25];
    const { container } = render(<PlayerGrid {...defaultProps} spectrum={customSpectrum} />);
    
    const spectrumBars = container.querySelectorAll('.spectrum-bar');
    expect(spectrumBars).toHaveLength(10);
    
    spectrumBars.forEach((bar, index) => {
      const expectedHeight = Math.max(2, customSpectrum[index] * 5);
      expect(bar).toHaveStyle(`height: ${expectedHeight}px`);
    });
  });

  test('handles spectrum with zero values', () => {
    const zeroSpectrum = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const { container } = render(<PlayerGrid {...defaultProps} spectrum={zeroSpectrum} />);
    
    const spectrumBars = container.querySelectorAll('.spectrum-bar');
    spectrumBars.forEach(bar => {
      expect(bar).toHaveStyle('height: 2px'); // Minimum height
    });
  });
});
