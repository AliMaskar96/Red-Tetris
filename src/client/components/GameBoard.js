import React from 'react';
import Board from './Board';

const GameBoard = ({
  playing,
  displayBoard,
  gameTitle = "TETRIS",
  onPlay,
  onCreateRoom,
  onJoinRoom,
  highScores = [],
  selectedMode,
  onModeChange
}) => {
  const modes = [
    { key: 'classic', label: 'Classic', color: '#28a745' },
    { key: 'invisible', label: 'Invisible', color: '#ff6b35' },
    { key: 'gravity', label: 'Gravity+', color: '#FFD700' }
  ];

  return (
    <div style={{
      background: '#111',
      borderRadius: 24,
      boxShadow: '0 4px 32px #000a',
      padding: 0,
      minWidth: 10 * 32 + 16, // 10*32px + padding
      minHeight: 20 * 32 + 16, // 20*32px + padding
      width: 10 * 32 + 16,
      height: 20 * 32 + 16,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      zIndex: 3,
      position: 'relative',
      overflow: 'hidden',
      paddingBottom: 24, // Ajoute du padding en bas pour équilibrer avec le haut
    }}>
      {/* Game Title */}
      <div style={{
        fontSize: 48,
        fontWeight: 900,
        letterSpacing: 2,
        color: '#FFD700',
        textShadow: '2px 2px 8px #000',
        marginTop: 24,
        marginBottom: 16,
        width: '100%',
        textAlign: 'center',
        userSelect: 'none',
      }}>
        <span style={{color: '#FF3B3B'}}>T</span>
        <span style={{color: '#FFD700'}}>E</span>
        <span style={{color: '#00E6FF'}}>T</span>
        <span style={{color: '#00FF00'}}>R</span>
        <span style={{color: '#FF00FF'}}>I</span>
        <span style={{color: '#FF3B3B'}}>S</span>
      </div>

      {/* Game Content */}
      {playing ? (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          position: 'relative',
        }}>
          <div style={{margin: 0}}>
            <Board board={displayBoard} />
          </div>
        </div>
      ) : (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}>
          {/* Play Button */}
          <button 
            onClick={onPlay}
            style={{
              padding: '12px 0',
              fontSize: 20,
              borderRadius: 10,
              background: '#28a745',
              color: '#fff',
              border: 'none',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 2px 8px #0006',
              marginBottom: 10,
              letterSpacing: 1,
              minWidth: 180,
              width: 180,
              textAlign: 'center',
              height: 44
            }}
          >
            PLAY
          </button>
          
          {/* Create Room Button */}
          <button 
            onClick={onCreateRoom}
            style={{
              padding: '12px 0',
              fontSize: 20,
              borderRadius: 10,
              background: '#007bff',
              color: '#fff',
              border: 'none',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 2px 8px #0006',
              marginBottom: 10,
              letterSpacing: 1,
              minWidth: 180,
              width: 180,
              textAlign: 'center',
              height: 44
            }}
          >
            CREATE ROOM
          </button>

          {/* Join Room Button */}
          <button 
            onClick={onJoinRoom}
            style={{
              padding: '12px 0',
              fontSize: 20,
              borderRadius: 10,
              background: '#ff9800',
              color: '#fff',
              border: 'none',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 2px 8px #0006',
              marginBottom: 18,
              letterSpacing: 1,
              minWidth: 180,
              width: 180,
              textAlign: 'center',
              height: 44
            }}
          >
            JOIN ROOM
          </button>

          {/* High Scores */}
          <div style={{
            background: '#222',
            borderRadius: 10,
            padding: '12px 24px',
            marginBottom: 18,
            width: 220
          }}>
            <div style={{
              fontWeight: 'bold',
              fontSize: 18,
              marginBottom: 6,
              color: '#FFD700'
            }}>
              HIGH SCORES
            </div>
            <div style={{fontSize: 16, color: '#fff'}}>
              {highScores.map((score, index) => (
                <div key={index} style={{
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: 2,
                  color: index === 0 ? '#FFD700' : '#fff'
                }}>
                  <span>#{index + 1}</span>
                  <span>{score.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Game Mode Selection */}
          <div style={{
            marginTop: 24,
            fontSize: 20,
            color: '#fff',
            fontWeight: 'bold',
            background: '#222',
            borderRadius: 10,
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            width: 220
          }}>
            <div style={{ marginBottom: 8, color: '#FFD700' }}>GAME MODE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
              {modes.map(mode => (
                <button
                  key={mode.key}
                  style={{
                    padding: '8px 12px',
                    fontSize: 16,
                    borderRadius: 8,
                    background: selectedMode === mode.key ? mode.color : '#444',
                    color: selectedMode === mode.key ? '#fff' : '#ccc',
                    border: 'none',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'background 0.2s, color 0.2s',
                    boxShadow: selectedMode === mode.key ? `0 2px 8px ${mode.color}55` : 'none',
                  }}
                  onClick={() => onModeChange(mode.key)}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
