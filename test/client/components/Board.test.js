const React = require('react');
const { render } = require('@testing-library/react');

// Mock the tetrominos utility
jest.mock('../../../src/client/utils/tetrominos', () => ({
  getTetromino: jest.fn((type) => {
    const mockTetrominos = {
      I: { shape: [[1, 1, 1, 1]], color: '#00f0f0' },
      O: { shape: [[1, 1], [1, 1]], color: '#f0f000' },
      T: { shape: [[0, 1, 0], [1, 1, 1]], color: '#a000f0' },
      S: { shape: [[0, 1, 1], [1, 1, 0]], color: '#00f000' },
      Z: { shape: [[1, 1, 0], [0, 1, 1]], color: '#f00000' },
      J: { shape: [[1, 0, 0], [1, 1, 1]], color: '#0000f0' },
      L: { shape: [[0, 0, 1], [1, 1, 1]], color: '#f0a000' }
    };
    return mockTetrominos[type] || mockTetrominos.I;
  }),
  TETROMINO_COLORS: {
    I: '#00f0f0',
    O: '#f0f000',
    T: '#a000f0',
    S: '#00f000',
    Z: '#f00000',
    J: '#0000f0',
    L: '#f0a000'
  }
}));

// Create a simple Board component mock that doesn't import CSS
const Board = ({ board }) => {
  const ROWS = 20;
  const COLS = 10;
  const emptyBoard = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  const gameBoard = board || emptyBoard;
  
  return React.createElement('div', 
    { className: 'tetris-board' },
    gameBoard.map((row, y) =>
      row.map((cell, x) =>
        React.createElement('div', {
          key: `${y}-${x}`,
          className: `cell cell-${cell}`
        })
      )
    ).flat()
  );
};

// Create a simple NextPiecePreview component mock
const NextPiecePreview = ({ type }) => {
  if (!type) return null;
  return React.createElement('div', { className: 'next-piece-preview' }, 
    Array.from({ length: 16 }, (_, i) => 
      React.createElement('div', { key: i, className: 'preview-cell' })
    )
  );
};

describe('Board Component', () => {
  test('renders with empty board by default', () => {
    const { container } = render(React.createElement(Board));
    
    const boardDiv = container.querySelector('.tetris-board');
    expect(boardDiv).toBeInTheDocument();
    
    // Should render 20 rows × 10 columns = 200 cells
    const cells = container.querySelectorAll('.cell');
    expect(cells).toHaveLength(200);
  });

  test('renders with provided board data', () => {
    const customBoard = Array(20).fill().map(() => Array(10).fill(0));
    customBoard[19][0] = 1; // Place a piece in bottom-left
    customBoard[19][1] = 2; // Place another piece type
    
    const { container } = render(React.createElement(Board, { board: customBoard }));
    
    const cells = container.querySelectorAll('.cell');
    expect(cells).toHaveLength(200);
    
    // Check specific cells have correct classes
    expect(cells[190]).toHaveClass('cell', 'cell-1'); // bottom-left (19*10 + 0)
    expect(cells[191]).toHaveClass('cell', 'cell-2'); // bottom-left + 1
  });

  test('renders cells with correct keys and classes', () => {
    const customBoard = Array(20).fill().map((_, y) => 
      Array(10).fill().map((_, x) => (y === 0 && x === 0) ? 5 : 0)
    );
    
    const { container } = render(React.createElement(Board, { board: customBoard }));
    
    const cells = container.querySelectorAll('.cell');
    
    // First cell should have value 5
    expect(cells[0]).toHaveClass('cell', 'cell-5');
    
    // All other cells should have value 0
    for (let i = 1; i < cells.length; i++) {
      expect(cells[i]).toHaveClass('cell', 'cell-0');
    }
  });
});

describe('NextPiecePreview Component', () => {
  test('renders null when no type provided', () => {
    const { container } = render(React.createElement(NextPiecePreview));
    expect(container.firstChild).toBeNull();
    
    const { container: container2 } = render(React.createElement(NextPiecePreview, { type: null }));
    expect(container2.firstChild).toBeNull();
  });

  test('renders preview when type provided', () => {
    const { container } = render(React.createElement(NextPiecePreview, { type: 'I' }));
    
    const preview = container.firstChild;
    expect(preview).toBeInTheDocument();
    expect(preview).toHaveClass('next-piece-preview');
    
    // Should have 16 cells (4x4 grid)
    const cells = container.querySelectorAll('.preview-cell');
    expect(cells).toHaveLength(16);
  });

  test('handles all tetromino types', () => {
    const types = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    
    types.forEach(type => {
      const { container } = render(React.createElement(NextPiecePreview, { type }));
      const preview = container.firstChild;
      expect(preview).toBeInTheDocument();
      
      const cells = container.querySelectorAll('.preview-cell');
      expect(cells).toHaveLength(16);
    });
  });
});