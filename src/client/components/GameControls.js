import React from 'react';

const GameControls = ({
  playing,
  paused,
  onTogglePause,
  onQuit
}) => {
  if (!playing) return null;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      marginTop: 12
    }}>
      <button
        onClick={onTogglePause}
        style={{
          width: 120,
          height: 28,
          borderRadius: 8,
          border: 'none',
          background: paused ? '#4CAF50' : '#FF9800',
          color: 'white',
          fontWeight: 'bold',
          fontSize: 12,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}
      >
        {paused ? '▶ RESUME' : '⏸ PAUSE'}
      </button>
      
      <button
        onClick={onQuit}
        style={{
          width: 120,
          height: 28,
          borderRadius: 8,
          border: 'none',
          background: '#f44336',
          color: 'white',
          fontWeight: 'bold',
          fontSize: 12,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}
      >
        🚪 QUIT
      </button>
    </div>
  );
};

export default GameControls;
