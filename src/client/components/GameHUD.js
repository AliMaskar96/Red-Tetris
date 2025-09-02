import React from 'react';
import { NextPiecePreview } from './Board';

const GameHUD = ({
  score,
  lines,
  nextType,
  playing,
  paused,
  isMultiplayer,
  currentPlayerId,
  onTogglePause,
  onQuit,
  updateHighScores,
  updateGameStats,
  socketService
}) => {
  const handleQuit = () => {
    // Save score and stats before quitting
    if (score > 0 || lines > 0) {
      updateHighScores(score);
      updateGameStats(score, lines, isMultiplayer, false);
    }
    
    // If in multiplayer, send game-over to server to eliminate player
    if (isMultiplayer && currentPlayerId) {
      socketService.sendGameOver(currentPlayerId);
    }
    
    // Call the onQuit callback
    onQuit();
  };

  return (
    <div style={{margin: 24, display: 'flex', flexDirection: 'column', gap: 48, zIndex: 2}}>
      {/* Score/Level/Lines Panel */}
      <div style={{
        width: 160, 
        height: 160, 
        background: '#222', 
        borderRadius: 18, 
        boxShadow: '0 2px 12px #0008', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'flex-start', 
        padding: 16
      }}>
        <div style={{fontWeight: 'bold', fontSize: 22, marginBottom: 8}}>SCORE</div>
        <div style={{
          background: '#111', 
          borderRadius: 8, 
          width: 120, 
          height: 32, 
          marginBottom: 8, 
          color: '#FFD700', 
          fontSize: 20, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center'
        }}>
          {score}
        </div>
        <div style={{fontWeight: 'bold', fontSize: 18, marginBottom: 4}}>LEVEL</div>
        <div style={{
          background: '#111', 
          borderRadius: 8, 
          width: 120, 
          height: 24, 
          marginBottom: 8, 
          color: '#FFD700', 
          fontSize: 16, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center'
        }}>
          1
        </div>
        <div style={{fontWeight: 'bold', fontSize: 18, marginBottom: 4}}>LINES</div>
        <div style={{
          background: '#111', 
          borderRadius: 8, 
          width: 120, 
          height: 24, 
          color: '#FFD700', 
          fontSize: 16, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center'
        }}>
          {lines}
        </div>
      </div>
      
      {/* Next Panel en bas du score */}
      <div style={{
        width: 160, 
        height: playing ? 180 : 120, 
        background: '#222', 
        borderRadius: 18, 
        boxShadow: '0 2px 12px #0008', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'flex-start', 
        padding: 12
      }}>
        <div style={{fontWeight: 'bold', fontSize: 22, marginBottom: 8}}>NEXT</div>
        <div style={{
          background: '#111', 
          borderRadius: 8, 
          width: 120, 
          height: 80, 
          marginBottom: playing ? 12 : 0, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center'
        }}>
          <NextPiecePreview type={nextType} />
        </div>
        
        {/* Boutons Pause et Quit - seulement quand on joue */}
        {playing && (
          <>
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
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                marginBottom: 6
              }}
            >
              {paused ? '▶ RESUME' : '⏸ PAUSE'}
            </button>
            
            <button
              onClick={handleQuit}
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
          </>
        )}
      </div>
    </div>
  );
};

export default GameHUD;
