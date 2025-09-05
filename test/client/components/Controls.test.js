const React = require('react');
const { render, screen } = require('@testing-library/react');
const Controls = require('../../../src/client/components/Controls').default;

describe('Controls Component', () => {
  test('renders controls title', () => {
    render(<Controls />);
    
    expect(screen.getByText('Controls')).toBeInTheDocument();
  });

  test('renders all control items', () => {
    render(<Controls />);
    
    // Check for control text
    expect(screen.getByText('Move piece left/right')).toBeInTheDocument();
    expect(screen.getByText('Rotate piece')).toBeInTheDocument();
    expect(screen.getByText('Soft drop')).toBeInTheDocument();
    expect(screen.getByText('Hard drop')).toBeInTheDocument();
  });

  test('renders control icons', () => {
    render(<Controls />);
    
    // Check that icons are present
    expect(screen.getByText('⬅️➡️')).toBeInTheDocument();
    expect(screen.getByText('🔄')).toBeInTheDocument();
    expect(screen.getByText('⬇️')).toBeInTheDocument();
    expect(screen.getByText('⏬')).toBeInTheDocument();
  });

  test('renders with correct CSS classes', () => {
    render(<Controls />);
    
    const controlsDiv = screen.getByText('Controls').parentElement;
    expect(controlsDiv).toHaveClass('controls', 'enhanced', 'fade-in');
    
    const controlsList = screen.getByRole('list');
    expect(controlsList).toHaveClass('controls-list');
  });

  test('renders correct number of control items', () => {
    render(<Controls />);
    
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(4);
    
    listItems.forEach(item => {
      expect(item).toHaveClass('controls-list-item');
    });
  });

  test('control icons have correct aria-hidden attribute', () => {
    render(<Controls />);
    
    const icons = screen.getAllByRole('generic').filter(el => 
      el.classList.contains('control-icon')
    );
    
    icons.forEach(icon => {
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  test('renders control text with correct class', () => {
    render(<Controls />);
    
    const controlTexts = [
      'Move piece left/right',
      'Rotate piece', 
      'Soft drop',
      'Hard drop'
    ];
    
    controlTexts.forEach(text => {
      const textElement = screen.getByText(text);
      expect(textElement).toHaveClass('control-text');
    });
  });

  test('component structure matches expected DOM', () => {
    const { container } = render(<Controls />);
    
    // Check overall structure
    const controlsDiv = container.querySelector('.controls.enhanced.fade-in');
    expect(controlsDiv).toBeInTheDocument();
    
    const heading = controlsDiv.querySelector('h3');
    expect(heading).toHaveTextContent('Controls');
    
    const list = controlsDiv.querySelector('ul.controls-list');
    expect(list).toBeInTheDocument();
    
    const listItems = list.querySelectorAll('li.controls-list-item');
    expect(listItems).toHaveLength(4);
    
    // Check each list item has icon and text
    listItems.forEach(item => {
      const icon = item.querySelector('.control-icon[aria-hidden="true"]');
      const text = item.querySelector('.control-text');
      expect(icon).toBeInTheDocument();
      expect(text).toBeInTheDocument();
    });
  });
});
