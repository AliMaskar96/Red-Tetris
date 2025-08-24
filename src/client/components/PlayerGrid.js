import React from 'react';

const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase();

const PlayerGrid = ({ grid = [[]], playerName = '', spectrum = [] }) => {
  return (
    <div className="player-grid enhanced">
      <div className="player-header">
        <span className="player-avatar-large">{getInitials(playerName)}</span>
        <h4>{playerName}</h4>
      </div>
      <div className="grid">
        {grid.map((row, rowIndex) => (
          <div className="grid-row" key={rowIndex}>
            {row.map((cell, colIndex) => (
              <span className={`grid-cell cell-${cell}`} key={colIndex}></span>
            ))}
          </div>
        ))}
      </div>
      {spectrum.length > 0 && (
        <div className="spectrum-bar-chart" aria-label="Spectrum">
          {spectrum.map((height, idx) => (
            <div key={idx} className="spectrum-bar" style={{height: `${Math.max(2, height * 5)}px`}}></div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlayerGrid; 