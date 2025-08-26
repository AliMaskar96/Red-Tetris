import { useState } from 'react';
import { 
  generateRoomId,
  initializeOpponentsScores,
  resetOpponentsData 
} from '../utils/gameHelpers';
import { getFromLocalStorage, saveToLocalStorage } from '../services/localStorageService';
import { STORAGE_KEYS } from '../utils/gameConstants';

/**
 * Hook to manage multiplayer-specific state
 */
export const useMultiplayerState = () => {
  // Modal state
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showJoinRoomModal, setShowJoinRoomModal] = useState(false);
  
  // Room creation state
  const [createRoomId] = useState(() => generateRoomId());
  const [username, setUsername] = useState(getFromLocalStorage(STORAGE_KEYS.LAST_USERNAME, ''));
  const [userList, setUserList] = useState([]);
  
  // Room joining state
  const [joinRoomId, setJoinRoomId] = useState('');
  const [joinUsername, setJoinUsername] = useState(getFromLocalStorage(STORAGE_KEYS.LAST_USERNAME, ''));
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [joinError, setJoinError] = useState('');
  
  // Current player state
  const [currentPlayerName, setCurrentPlayerName] = useState('');
  
  // Room state
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [currentGameId, setCurrentGameId] = useState(null);
  const [currentPlayerId, setCurrentPlayerId] = useState(null);
  const [roomPlayers, setRoomPlayers] = useState([]);
  const [isRoomLeader, setIsRoomLeader] = useState(false);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  
  // URL navigation state
  const [urlRoomInfo, setUrlRoomInfo] = useState(null);
  const [autoJoinAttempted, setAutoJoinAttempted] = useState(false);
  const [urlJoinStatus, setUrlJoinStatus] = useState(''); // 'joining', 'success', 'error'
  
  // Game state
  const [eliminatedPlayers, setEliminatedPlayers] = useState([]);
  const [gameWinner, setGameWinner] = useState(null);
  const [multiplayerGameEnded, setMultiplayerGameEnded] = useState(false);
  const [waitingForRematch, setWaitingForRematch] = useState(false);
  
  // Opponents data
  const [opponentsSpectrums, setOpponentsSpectrums] = useState({});
  const [opponentsScores, setOpponentsScores] = useState({});
  
  // Notifications
  const [penaltyNotification, setPenaltyNotification] = useState(null);
  
  // Helper functions
  const initializeOpponents = (players, currentPlayerId) => {
    const scores = initializeOpponentsScores(players, currentPlayerId);
    setOpponentsScores(scores);
    return scores;
  };
  
  const resetOpponents = () => {
    const resetScores = resetOpponentsData(opponentsScores, 0);
    const resetSpectrums = resetOpponentsData(opponentsSpectrums, Array(10).fill(0));
    
    setOpponentsScores(resetScores);
    setOpponentsSpectrums(resetSpectrums);
    
    return { resetScores, resetSpectrums };
  };
  
  const resetMultiplayerState = () => {
    setCurrentRoomId(null);
    setCurrentPlayerName('');
    setRoomPlayers([]);
    setIsRoomLeader(false);
    setIsMultiplayer(false);
    setCurrentPlayerId(null);
    setCurrentGameId(null);
    setEliminatedPlayers([]);
    setGameWinner(null);
    setMultiplayerGameEnded(false);
    setWaitingForRematch(false);
    setOpponentsSpectrums({});
    setOpponentsScores({});
    setPenaltyNotification(null);
    setJoinError('');
    setIsJoiningRoom(false);
    setUrlJoinStatus('');
    setAutoJoinAttempted(false);
  };
  
  const savePlayerName = (playerName) => {
    setCurrentPlayerName(playerName);
    saveToLocalStorage(STORAGE_KEYS.LAST_USERNAME, playerName);
  };
  
  // Get opponents data for display
  const getOpponents = () => {
    return roomPlayers
      .filter(p => p.id !== currentPlayerId)
      .map(p => ({ 
        id: p.id, 
        name: p.name,
        score: opponentsScores[p.id] || 0,
        spectrum: opponentsSpectrums[p.id] || Array(10).fill(0)
      }));
  };

  return {
    // Modal state
    showCreateRoomModal,
    setShowCreateRoomModal,
    showJoinRoomModal,
    setShowJoinRoomModal,
    
    // Room creation state
    createRoomId,
    username,
    setUsername,
    userList,
    setUserList,
    
    // Room joining state
    joinRoomId,
    setJoinRoomId,
    joinUsername,
    setJoinUsername,
    isJoiningRoom,
    setIsJoiningRoom,
    joinError,
    setJoinError,
    
    // Current player state
    currentPlayerName,
    setCurrentPlayerName,
    
    // Room state
    currentRoomId,
    setCurrentRoomId,
    currentGameId,
    setCurrentGameId,
    currentPlayerId,
    setCurrentPlayerId,
    roomPlayers,
    setRoomPlayers,
    isRoomLeader,
    setIsRoomLeader,
    isMultiplayer,
    setIsMultiplayer,
    
    // URL navigation state
    urlRoomInfo,
    setUrlRoomInfo,
    autoJoinAttempted,
    setAutoJoinAttempted,
    urlJoinStatus,
    setUrlJoinStatus,
    
    // Game state
    eliminatedPlayers,
    setEliminatedPlayers,
    gameWinner,
    setGameWinner,
    multiplayerGameEnded,
    setMultiplayerGameEnded,
    waitingForRematch,
    setWaitingForRematch,
    
    // Opponents data
    opponentsSpectrums,
    setOpponentsSpectrums,
    opponentsScores,
    setOpponentsScores,
    
    // Notifications
    penaltyNotification,
    setPenaltyNotification,
    
    // Helper functions
    initializeOpponents,
    resetOpponents,
    resetMultiplayerState,
    savePlayerName,
    getOpponents
  };
};
