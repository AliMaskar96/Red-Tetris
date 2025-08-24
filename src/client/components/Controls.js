import React from 'react';

const controls = [
  { icon: '⬅️➡️', text: 'Move piece left/right' },
  { icon: '🔄', text: 'Rotate piece' },
  { icon: '⬇️', text: 'Soft drop' },
  { icon: '⏬', text: 'Hard drop' },
];

const Controls = () => (
  <div className="controls enhanced fade-in">
    <h3>Controls</h3>
    <ul className="controls-list">
      {controls.map((ctrl, idx) => (
        <li key={idx} className="controls-list-item">
          <span className="control-icon" aria-hidden="true">{ctrl.icon}</span>
          <span className="control-text">{ctrl.text}</span>
        </li>
      ))}
    </ul>
  </div>
);

export default Controls; 