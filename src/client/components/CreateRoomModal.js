import React from 'react';

const CreateRoomModal = ({
  isOpen,
  onClose,
  createRoomId,
  username,
  setUsername,
  currentRoomId,
  isRoomLeader,
  roomPlayers,
  onValidateUsername,
  onStartGame,
  onLeaveRoom,
  joinError
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100
    }}>
      <div style={{
        background: '#222',
        padding: '40px 32px 32px 32px',
        borderRadius: 24,
        boxShadow: '0 4px 32px #000a',
        textAlign: 'center',
        color: '#FFD700',
        minWidth: 340,
        minHeight: 320,
        position: 'relative'
      }}>
        <div style={{fontSize: 30, fontWeight: 900, marginBottom: 12, letterSpacing: 2}}>
          Create a Room
        </div>
        
        <div style={{
          fontSize: 14, 
          color: '#4CAF50', 
          marginBottom: 18, 
          padding: '8px 12px',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          borderRadius: 8,
          border: '1px solid rgba(76, 175, 80, 0.3)'
        }}>
          👑 You will be the leader and can start the game for all players
        </div>
        
        <div style={{fontSize: 18, color: '#fff', marginBottom: 10}}>
          Room ID: <span style={{color: '#FFD700', fontWeight: 'bold'}}>{createRoomId}</span>
        </div>
        
        {joinError && (
          <div style={{color: '#ff4444', fontSize: 16, marginBottom: 10, fontWeight: 'bold'}}>
            {joinError}
          </div>
        )}
        
        {/* Show username input and validate button only if room is not created yet */}
        {!currentRoomId && (
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 18}}>
            <input
              type="text"
              placeholder="Enter your name"
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={{
                padding: '10px',
                fontSize: 18,
                borderRadius: 8,
                border: '1px solid #FFD700',
                outline: 'none',
                color: '#222',
                background: '#fff',
                flex: 1,
                minWidth: 200
              }}
              onKeyDown={e => { if (e.key === 'Enter') onValidateUsername(); }}
            />
            <button
              onClick={onValidateUsername}
              style={{
                padding: '10px 16px',
                fontSize: 16,
                borderRadius: 8,
                background: '#28a745',
                color: '#fff',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >Validate</button>
          </div>
        )}
        
        {/* Show room status if already created */}
        {currentRoomId && (
          <div style={{
            fontSize: 16, 
            color: '#4CAF50', 
            marginBottom: 18, 
            padding: '12px',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            borderRadius: 8,
            border: '1px solid rgba(76, 175, 80, 0.3)',
            textAlign: 'center'
          }}>
            ✅ Room created successfully! Waiting for other players...
            <div style={{marginTop: 12, fontSize: 14, color: '#fff'}}>
              <strong>Link to share:</strong>
              <div style={{
                marginTop: 8,
                padding: '8px 12px',
                backgroundColor: '#2a2a2a',
                borderRadius: 6,
                fontFamily: 'monospace',
                fontSize: 13,
                color: '#FFD700',
                wordBreak: 'break-all',
                cursor: 'pointer',
                border: '1px solid #555'
              }}
              onClick={() => {
                const link = `${window.location.origin}/#${currentRoomId}[PLAYER_NAME]`;
                navigator.clipboard.writeText(link);
                // Show a temporary feedback
                const elem = document.createElement('div');
                elem.textContent = 'Link copied!';
                elem.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#4CAF50;color:white;padding:12px 24px;border-radius:8px;z-index:10000;font-weight:bold;';
                document.body.appendChild(elem);
                setTimeout(() => document.body.removeChild(elem), 2000);
              }}>
                {`${window.location.origin}/#${currentRoomId}[PLAYER_NAME]`}
              </div>
              <div style={{fontSize: 12, color: '#ccc', marginTop: 4}}>
                Click to copy
              </div>
            </div>
          </div>
        )}

        {/* Show players list if room exists */}
        {currentRoomId && roomPlayers.length > 0 && (
          <div style={{
            marginBottom: 18,
            padding: 12,
            backgroundColor: '#1a1a1a',
            borderRadius: 8,
            border: '1px solid #333'
          }}>
            <div style={{fontSize: 16, color: '#FFD700', marginBottom: 8, fontWeight: 'bold'}}>
              Connected players ({roomPlayers.length}):
            </div>
            <ul style={{listStyle: 'none', padding: 0, margin: 0, fontSize: 14}}>
              {roomPlayers.map((player, index) => (
                <li key={index} style={{
                  padding: '4px 8px',
                  borderBottom: index < roomPlayers.length - 1 ? '1px solid #444' : 'none',
                  color: player.isLeader ? '#FFD700' : '#fff'
                }}>
                  {player.name} {player.isLeader && '👑 (Leader)'}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Show START GAME button only if already in a room and is leader */}
        {currentRoomId && isRoomLeader && (
          <button
            onClick={onStartGame}
            style={{
              padding: '12px 32px',
              fontSize: 20,
              borderRadius: 10,
              background: '#ff6600',
              color: '#fff',
              border: 'none',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 2px 8px #0006',
              letterSpacing: 1,
              marginBottom: 10
            }}
          >START GAME</button>
        )}
        
        {/* The room creation happens automatically when validating username */}
        <button
          onClick={onLeaveRoom}
          style={{
            position: 'absolute',
            top: 12,
            right: 18,
            background: 'transparent',
            color: '#FFD700',
            border: 'none',
            fontSize: 28,
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
          title="Close"
        >×</button>
      </div>
    </div>
  );
};

export default CreateRoomModal;
