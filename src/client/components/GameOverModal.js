import React from 'react';

const GameOverModal = ({
  gameOver,
  multiplayerGameEnded,
  gameWinner,
  currentPlayerId,
  score,
  isMultiplayer,
  onReplay,
  onGoToLobby,
  onRematch
}) => {
  // Game Over Overlay - Solo ou Eliminated en Multi
  if (gameOver && !multiplayerGameEnded) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: isMultiplayer ? '#5d1a1a' : '#222',
          padding: '48px 64px',
          borderRadius: 24,
          boxShadow: '0 8px 48px #000',
          textAlign: 'center',
          color: isMultiplayer ? '#f44336' : '#FFD700',
          fontSize: 40,
          fontWeight: 900,
          letterSpacing: 2,
          border: isMultiplayer ? '3px solid #f44336' : 'none'
        }}>
          {isMultiplayer ? '💀 ELIMINATED!' : 'Game Over'}
          <div style={{fontSize: 24, color: '#fff', marginTop: 16}}>
            Score: {score}
          </div>
          {isMultiplayer ? (
            <div style={{display: 'flex', gap: 20, marginTop: 32, justifyContent: 'center'}}>
              <button onClick={onRematch} style={{
                padding: '16px 32px', 
                fontSize: 20, 
                borderRadius: 12, 
                background: '#4CAF50', 
                color: '#fff', 
                border: 'none', 
                fontWeight: 'bold', 
                cursor: 'pointer', 
                boxShadow: '0 4px 16px #0008'
              }}>
                🔄 PLAY AGAIN
              </button>
              
              <button onClick={onGoToLobby} style={{
                padding: '16px 32px', 
                fontSize: 20, 
                borderRadius: 12, 
                background: '#007bff', 
                color: '#fff', 
                border: 'none', 
                fontWeight: 'bold', 
                cursor: 'pointer', 
                boxShadow: '0 4px 16px #0008'
              }}>
                🏠 LOBBY
              </button>
            </div>
          ) : (
            // Solo mode buttons
            <div style={{display: 'flex', gap: 20, marginTop: 32, justifyContent: 'center'}}>
              <button onClick={onReplay} style={{
                marginTop: 32, 
                padding: '14px 40px', 
                fontSize: 22, 
                borderRadius: 10, 
                background: '#28a745', 
                color: '#fff', 
                border: 'none', 
                fontWeight: 'bold', 
                cursor: 'pointer', 
                boxShadow: '0 2px 8px #0006'
              }}>Play Again</button>
              
              <button onClick={onGoToLobby} style={{
                marginTop: 18, 
                padding: '12px 36px', 
                fontSize: 20, 
                borderRadius: 10, 
                background: '#007bff', 
                color: '#fff', 
                border: 'none', 
                fontWeight: 'bold', 
                cursor: 'pointer', 
                boxShadow: '0 2px 8px #0006'
              }}>Go to Lobby</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Victory/Defeat Overlay - End of multiplayer game
  if (multiplayerGameEnded && gameWinner) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1001
      }}>
        <div style={{
          background: gameWinner.id === currentPlayerId ? '#1a5d1a' : '#5d1a1a',
          padding: '48px 64px',
          borderRadius: 24,
          boxShadow: '0 8px 48px #000',
          textAlign: 'center',
          color: gameWinner.id === currentPlayerId ? '#4CAF50' : '#f44336',
          fontSize: 40,
          fontWeight: 900,
          letterSpacing: 2,
          border: `3px solid ${gameWinner.id === currentPlayerId ? '#4CAF50' : '#f44336'}`
        }}>
          {gameWinner.id === currentPlayerId ? '🏆 WINNER!' : '💀 GAME OVER'}
          <div style={{fontSize: 24, color: '#fff', marginTop: 16}}>
            {gameWinner.id === currentPlayerId 
              ? 'Congratulations! You won!' 
              : `${gameWinner.name} won!`}
          </div>
          <div style={{fontSize: 18, color: '#ccc', marginTop: 12}}>Final score: {score}</div>
          
          <div style={{display: 'flex', gap: 20, marginTop: 32, justifyContent: 'center'}}>
            <button onClick={onRematch} style={{
              padding: '16px 32px', 
              fontSize: 20, 
              borderRadius: 12, 
              background: '#4CAF50', 
              color: '#fff', 
              border: 'none', 
              fontWeight: 'bold', 
              cursor: 'pointer', 
              boxShadow: '0 4px 16px #0008'
            }}>
              🔄 PLAY AGAIN
            </button>
            
            <button onClick={onGoToLobby} style={{
              padding: '16px 32px', 
              fontSize: 20, 
              borderRadius: 12, 
              background: '#007bff', 
              color: '#fff', 
              border: 'none', 
              fontWeight: 'bold', 
              cursor: 'pointer', 
              boxShadow: '0 4px 16px #0008'
            }}>
              🏠 LOBBY
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default GameOverModal;
