import { URL_HASH_REGEX } from '../utils/gameConstants.js';

/**
 * Game helper functions
 * Pure functions that don't depend on React state
 */

/**
 * Generate a random room ID
 * @returns {string} A 6-character uppercase room ID
 */
export const generateRoomId = () => {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
};

/**
 * Parse URL hash to extract room and player information
 * @param {string} hash - The URL hash (without #)
 * @returns {object|null} Object with roomId and playerName, or null if invalid
 */
export const parseHashUrl = (hash) => {
  if (!hash) return null;
  
  // Parse format: #<room>[<player_name>]
  // Examples: #ROOM123[Alice], #ROOM123, #ABC123[Bob]
  const match = hash.match(URL_HASH_REGEX);
  if (match) {
    const roomId = match[1];
    const playerName = match[2];
    
    console.log('Parsed URL hash:', { roomId, playerName });
    
    return { roomId, playerName };
  } else {
    console.warn('Invalid hash URL format. Expected: #<room>[<player_name>]');
    return null;
  }
};

/**
 * Create URL hash from room and player information
 * @param {string} roomId - The room ID
 * @param {string} playerName - The player name
 * @returns {string} The formatted hash
 */
export const createUrlHash = (roomId, playerName) => {
  if (!roomId || !playerName) return '';
  return `#${roomId}[${playerName}]`;
};

/**
 * Update browser URL with new hash
 * @param {string} newHash - The new hash to set
 */
export const updateUrlHash = (newHash) => {
  if (window.location.hash !== newHash) {
    window.history.pushState(null, null, newHash);
  }
};

/**
 * Clear URL hash
 */
export const clearUrlHash = () => {
  window.history.pushState(null, null, window.location.pathname);
};

/**
 * Validate username
 * @param {string} username - The username to validate
 * @param {string[]} existingUsers - List of existing usernames
 * @returns {object} Validation result with isValid and error message
 */
export const validateUsername = (username, existingUsers = []) => {
  const trimmedUsername = username.trim();
  
  if (!trimmedUsername) {
    return {
      isValid: false,
      error: 'Veuillez entrer un nom valide'
    };
  }
  
  if (existingUsers.includes(trimmedUsername)) {
    return {
      isValid: false,
      error: 'Ce nom est déjà pris'
    };
  }
  
  return {
    isValid: true,
    error: null
  };
};

/**
 * Validate room ID
 * @param {string} roomId - The room ID to validate
 * @returns {object} Validation result with isValid and error message
 */
export const validateRoomId = (roomId) => {
  const trimmedRoomId = roomId.trim();
  
  if (!trimmedRoomId) {
    return {
      isValid: false,
      error: 'Veuillez entrer un ID de room'
    };
  }
  
  return {
    isValid: true,
    error: null
  };
};

/**
 * Find current player in players list
 * @param {object[]} players - List of players
 * @param {string} currentPlayerName - Current player name
 * @param {string} joinUsername - Join username
 * @param {string} username - Username
 * @param {string[]} userList - User list
 * @returns {object|null} Found player or null
 */
export const findCurrentPlayer = (players, currentPlayerName, joinUsername, username, userList) => {
  let foundPlayer = null;
  
  // Try to find by currentPlayerName first
  if (currentPlayerName) {
    foundPlayer = players.find(p => p.name === currentPlayerName);
  }
  
  // If not found, try by joinUsername
  if (!foundPlayer && joinUsername) {
    foundPlayer = players.find(p => p.name === joinUsername.trim());
  }
  
  // If not found, try by username
  if (!foundPlayer && username) {
    foundPlayer = players.find(p => p.name === username.trim());
  }
  
  // If still not found, try by userList (for create room)
  if (!foundPlayer && userList.length > 0) {
    foundPlayer = players.find(p => userList.includes(p.name));
  }
  
  return foundPlayer;
};

/**
 * Initialize opponents scores from players list
 * @param {object[]} players - List of players
 * @param {string} currentPlayerId - Current player ID
 * @returns {object} Opponents scores object
 */
export const initializeOpponentsScores = (players, currentPlayerId) => {
  const opponentsScores = {};
  players.forEach(player => {
    if (player.score !== undefined && player.id !== currentPlayerId) {
      opponentsScores[player.id] = player.score;
    }
  });
  return opponentsScores;
};

/**
 * Reset opponents data for new game
 * @param {object} opponentsData - Current opponents data
 * @param {any} resetValue - Value to reset to
 * @returns {object} Reset opponents data
 */
export const resetOpponentsData = (opponentsData, resetValue) => {
  const resetData = {};
  Object.keys(opponentsData).forEach(playerId => {
    resetData[playerId] = resetValue;
  });
  return resetData;
};

/**
 * Format game statistics for display
 * @param {object} stats - Game statistics
 * @returns {object} Formatted statistics
 */
export const formatGameStats = (stats) => {
  return {
    ...stats,
    averageScore: stats.gamesPlayed > 0 ? Math.round(stats.totalScore / stats.gamesPlayed) : 0,
    averageLines: stats.gamesPlayed > 0 ? Math.round(stats.totalLines / stats.gamesPlayed) : 0,
    winRate: stats.multiplayerGames > 0 ? Math.round((stats.multiplayerWins / stats.multiplayerGames) * 100) : 0
  };
};
