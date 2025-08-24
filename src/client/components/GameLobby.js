import React from 'react';

const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase();

const GameLobby = ({ players = [], roomId = '', isLeader = false, onStartGame }) => {
  const handleCopyRoom = () => {
    navigator.clipboard.writeText(roomId);
  };
  return (
    <div className="game-lobby">
      <div className="lobby-icon" aria-label="Lobby">
        <span role="img" aria-label="lobby" style={{fontSize: '2.5rem'}}>🎮</span>
      </div>
      <h2>Game Lobby</h2>
      <div className="room-id-row">
        <p>Room: <strong className="room-id">{roomId}</strong></p>
        <button className="copy-room-btn" onClick={handleCopyRoom} title="Copy room code">📋</button>
      </div>
      <h3>Players</h3>
      <ul className="player-list">
        {players.map((player) => (
          <li key={player.id} className="player-list-item">
            <span className="player-avatar">{getInitials(player.name)}</span>
            <span className="player-name">{player.name}</span>
            {player.isLeader && <span className="leader-badge">👑</span>}
          </li>
        ))}
      </ul>
      {isLeader && (
        <button className="start-game-btn animated" onClick={onStartGame}>Start Game</button>
      )}
    </div>
  );
};

export default GameLobby; 