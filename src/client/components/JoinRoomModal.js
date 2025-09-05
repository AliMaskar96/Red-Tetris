import React from 'react';

const JoinRoomModal = ({
  isOpen,
  onClose,
  waitingForRematch,
  joinRoomId,
  setJoinRoomId,
  joinUsername,
  setJoinUsername,
  joinError,
  currentRoomId,
  isJoiningRoom,
  roomPlayers,
  isRoomLeader,
  onJoinRoom,
  onStartGame,
  urlJoinStatus = ''
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        border: '3px solid #FFD700',
        borderRadius: 15,
        padding: 24,
        minWidth: 350,
        maxWidth: 500,
        color: '#fff',
        position: 'relative',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
      }}>
        <h2 style={{
          margin: '0 0 12px 0',
          color: '#FFD700',
          textAlign: 'center',
          fontSize: 24,
          fontWeight: 'bold'
        }}>
          {waitingForRematch ? 'WAITING FOR REMATCH' : 'JOIN A ROOM'}
        </h2>
        
        {waitingForRematch ? (
          <div style={{
            fontSize: 16, 
            color: '#4CAF50', 
            marginBottom: 20, 
            padding: '12px',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            borderRadius: 8,
            border: '1px solid rgba(76, 175, 80, 0.3)',
            textAlign: 'center'
          }}>
            🔄 Ready for rematch! Waiting for the leader to start the new game...
          </div>
        ) : urlJoinStatus === 'success' && currentRoomId ? (
          <div style={{
            fontSize: 16, 
            color: '#4CAF50', 
            marginBottom: 20, 
            padding: '12px',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            borderRadius: 8,
            border: '1px solid rgba(76, 175, 80, 0.3)',
            textAlign: 'center'
          }}>
            🔗 Successfully joined via URL! Welcome to the room.
          </div>
        ) : (
          <div style={{
            fontSize: 14, 
            color: '#ff9800', 
            marginBottom: 20, 
            padding: '8px 12px',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            borderRadius: 8,
            border: '1px solid rgba(255, 152, 0, 0.3)',
            textAlign: 'center'
          }}>
            Only the room leader can start the game
          </div>
        )}

        <div style={{
          fontSize: 13, 
          color: '#00bcd4', 
          marginBottom: 15, 
          padding: '8px 12px',
          backgroundColor: 'rgba(0, 188, 212, 0.1)',
          borderRadius: 8,
          border: '1px solid rgba(0, 188, 212, 0.3)',
          textAlign: 'center'
        }}>
          💡 <strong>Tip:</strong> You can join directly via URL<br/>
          <code style={{fontSize: 11, fontFamily: 'monospace'}}>
            {window.location.origin}/#ROOM123[YourName]
          </code>
        </div>

        {/* Show room ID input only if not in a room yet */}
        {!currentRoomId && (
          <div style={{ marginBottom: 15 }}>
            <label style={{
              display: 'block',
              marginBottom: 8,
              color: '#FFD700',
              fontWeight: 'bold'
            }}>ROOM ID:</label>
            <input
              type="text"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
              placeholder="Enter the room ID"
              style={{
                width: '100%',
                padding: 10,
                border: '2px solid #333',
                borderRadius: 8,
                backgroundColor: '#2a2a2a',
                color: '#fff',
                fontSize: 16,
                outline: 'none'
              }}
              onKeyDown={e => { if (e.key === 'Enter') onJoinRoom(); }}
            />
          </div>
        )}

        {/* Show username input and join button only if not in a room yet */}
        {!currentRoomId && (
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              marginBottom: 8,
              color: '#FFD700',
              fontWeight: 'bold'
            }}>YOUR NAME:</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="text"
                value={joinUsername}
                onChange={(e) => setJoinUsername(e.target.value)}
                placeholder="Enter your name"
                style={{
                  flex: 1,
                  padding: 10,
                  border: '2px solid #333',
                  borderRadius: 8,
                  backgroundColor: '#2a2a2a',
                  color: '#fff',
                  fontSize: 16,
                  outline: 'none'
                }}
                onKeyDown={e => { if (e.key === 'Enter') onJoinRoom(); }}
              />
              <button
                onClick={onJoinRoom}
                disabled={!joinRoomId.trim() || !joinUsername.trim()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#28a745',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  opacity: (!joinRoomId.trim() || !joinUsername.trim()) ? 0.5 : 1
                }}
              >JOIN</button>
            </div>
          </div>
        )}

        {joinError && (
          <div style={{
            color: '#ff4444',
            backgroundColor: 'rgba(255, 68, 68, 0.1)',
            border: '1px solid rgba(255, 68, 68, 0.3)',
            borderRadius: 8,
            padding: 12,
            marginBottom: 15,
            fontSize: 14,
            textAlign: 'center'
          }}>
            {joinError}
          </div>
        )}

        {isJoiningRoom && !currentRoomId && (
          <div style={{
            fontSize: 16, 
            color: '#ff9800', 
            marginBottom: 20, 
            padding: '12px',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            borderRadius: 8,
            border: '1px solid rgba(255, 152, 0, 0.3)',
            textAlign: 'center'
          }}>
            🔄 Attempting to join room...
          </div>
        )}

        {/* Show room status if already joined */}
        {currentRoomId && (
          <div style={{
            fontSize: 16, 
            color: '#4CAF50', 
            marginBottom: 20, 
            padding: '12px',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            borderRadius: 8,
            border: '1px solid rgba(76, 175, 80, 0.3)',
            textAlign: 'center'
          }}>
            ✅ Connected to room <strong>{currentRoomId}</strong>
            
            {/* Show players in room */}
            <div style={{ marginTop: 15 }}>
              <div style={{fontSize: 14, fontWeight: 'bold', marginBottom: 8}}>
                Connected players ({roomPlayers.length}):
              </div>
              <div style={{
                backgroundColor: '#2a2a2a',
                borderRadius: 6,
                padding: 8,
                maxHeight: 100,
                overflowY: 'auto'
              }}>
                {roomPlayers.length === 0 ? (
                  <div style={{
                    color: '#ccc',
                    fontSize: 14,
                    fontStyle: 'italic'
                  }}>
                    Loading players...
                  </div>
                ) : (
                  roomPlayers.map((player, index) => (
                    <div key={index} style={{
                      padding: '4px 8px',
                      borderBottom: index < roomPlayers.length - 1 ? '1px solid #444' : 'none',
                      color: player.isLeader ? '#FFD700' : '#fff'
                    }}>
                      {player.name} {player.isLeader && '👑'}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Show START GAME button only if current user is the leader */}
        {isRoomLeader && currentRoomId && (
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
              marginBottom: 15,
              width: '100%'
            }}
          >START GAME (Leader)</button>
        )}

        <button
          onClick={onClose}
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

export default JoinRoomModal;
