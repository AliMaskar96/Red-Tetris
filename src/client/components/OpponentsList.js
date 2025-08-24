import React from 'react';
import '../styles/spectrum.css';

const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase();

// Component to display spectrum as a visual bar chart
const SpectrumDisplay = ({ spectrum, isEliminated = false }) => {
  // Debug log to see spectrum values
  console.log('🔍 SpectrumDisplay rendering with spectrum:', spectrum, 'isEliminated:', isEliminated);
  
  if (isEliminated) {
    return (
      <div className="spectrum-display">
        <div className="spectrum-placeholder" style={{
          color: '#ff4444',
          fontSize: '11px',
          fontWeight: 'bold'
        }}>
          💀 ELIMINATED
        </div>
      </div>
    );
  }

  if (!spectrum || spectrum.length !== 10) {
    console.log('⚠️ Invalid spectrum data:', { spectrum, length: spectrum?.length });
    return (
      <div className="spectrum-display">
        <div className="spectrum-placeholder">No data</div>
      </div>
    );
  }

  return (
    <div className="spectrum-display">
      {spectrum.map((height, idx) => {
        // Height is 0-20, where 0 = empty column, 20 = full column
        // Convert to percentage: 0 = 0%, 20 = 100%
        const percentage = (height / 20) * 100;
        const barHeight = Math.max(2, percentage); // Minimum 2% height for visibility
        
        // Color gradient based on height - green for low, yellow for medium, red for high
        let backgroundColor;
        if (height === 0) {
          backgroundColor = '#333'; // Dark gray for empty
        } else if (height <= 7) {
          backgroundColor = '#4CAF50'; // Green for safe
        } else if (height <= 14) {
          backgroundColor = '#FF9800'; // Orange for warning
        } else {
          backgroundColor = '#f44336'; // Red for danger
        }
        
        return (
          <div 
            key={idx} 
            className="spectrum-bar" 
            style={{
              height: `${barHeight}%`,
              backgroundColor,
              border: '1px solid #555',
              borderRadius: '2px',
              boxShadow: height > 0 ? `0 0 4px ${backgroundColor}88` : 'none'
            }}
            title={`Column ${idx + 1}: ${height === 0 ? 'Empty' : `Height: ${height}/20`}`}
          />
        );
      })}
    </div>
  );
};

const OpponentsList = ({ opponents = [], opponentsSpectrums = {}, opponentsScores = {}, eliminatedPlayers = [] }) => {
  // Check if a player is eliminated
  const isPlayerEliminated = (playerId) => {
    return eliminatedPlayers.some(ep => ep.id === playerId);
  };

  // Debug log for scores and spectrums
  console.log('👥 OpponentsList rendering with:', { 
    opponents: opponents.map(o => o.id), 
    opponentsSpectrums: Object.keys(opponentsSpectrums), 
    opponentsScores: Object.keys(opponentsScores) 
  });

  return (
    <div className="opponents-list enhanced" style={{
      background: '#222',
      borderRadius: '12px',
      padding: '16px',
      minWidth: '200px',
      maxWidth: '250px'
    }}>
      <h3 style={{
        color: '#FFD700',
        marginBottom: '12px',
        fontSize: '18px',
        textAlign: 'center'
      }}>Opponents</h3>
      
      {opponents.length === 0 ? (
        <div style={{
          color: '#999',
          textAlign: 'center',
          fontStyle: 'italic',
          padding: '20px 0'
        }}>
          No opponents
        </div>
      ) : (
        <ul className="opponent-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {opponents.map((opponent) => {
            const isEliminated = isPlayerEliminated(opponent.id);
            const statusColor = isEliminated ? '#ff4444' : '#4CAF50';
            const statusText = isEliminated ? '💀 ELIMINATED' : '🎮 PLAYING';
            const statusBg = isEliminated ? '#2a1a1a' : '#1a2a1a';
            const opponentScore = opponentsScores[opponent.id] || 0;
            
            return (
              <li key={opponent.id} className="opponent-list-item" style={{
                marginBottom: '16px',
                padding: '12px',
                background: isEliminated ? '#2a1a1a' : '#333',
                borderRadius: '8px',
                border: `1px solid ${isEliminated ? '#555' : '#666'}`,
                opacity: isEliminated ? 0.7 : 1,
                transition: 'all 0.3s ease'
              }}>
                {/* Status Badge */}
                <div style={{
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: statusColor,
                  textAlign: 'center',
                  marginBottom: '6px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: statusBg,
                  border: `1px solid ${statusColor}66`,
                  boxShadow: `0 0 8px ${statusColor}33`
                }}>
                  {statusText}
                </div>
                
                {/* Score Display */}
                <div style={{
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#00bcd4',
                  textAlign: 'center',
                  marginBottom: '8px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: '#1a1a1a',
                  border: '1px solid #00bcd4'
                }}>
                  Score: {opponentScore.toLocaleString()}
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span className="opponent-avatar" style={{
                    display: 'inline-block',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: isEliminated ? '#666' : '#FFD700',
                    color: '#222',
                    textAlign: 'center',
                    lineHeight: '24px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    marginRight: '8px'
                  }}>
                    {getInitials(opponent.name)}
                  </span>
                  <span className="opponent-name" style={{
                    color: isEliminated ? '#999' : '#fff',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    textDecoration: isEliminated ? 'line-through' : 'none'
                  }}>
                    {opponent.name}
                  </span>
                </div>
                
                <div style={{
                  background: '#111',
                  borderRadius: '4px',
                  padding: '8px',
                  height: '60px'
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#999',
                    marginBottom: '4px'
                  }}>
                    Field Spectrum:
                  </div>
                  <SpectrumDisplay 
                    spectrum={opponentsSpectrums[opponent.id]} 
                    isEliminated={isEliminated}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default OpponentsList; 