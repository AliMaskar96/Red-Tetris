import { useEffect } from 'react';
import { 
  parseHashUrl, 
  createUrlHash, 
  updateUrlHash, 
  clearUrlHash 
} from '../utils/gameHelpers';
import { getFromLocalStorage, saveToLocalStorage } from '../services/localStorageService';
import { STORAGE_KEYS } from '../utils/gameConstants';

/**
 * Hook to manage URL-based room navigation
 */
export const useURLNavigation = ({
  urlRoomInfo,
  setUrlRoomInfo,
  autoJoinAttempted,
  setAutoJoinAttempted,
  currentRoomId,
  currentPlayerName,
  isJoiningRoom,
  setJoinRoomId,
  setJoinUsername,
  setCurrentPlayerName,
  setIsJoiningRoom,
  setJoinError,
  setUrlJoinStatus,
  setShowJoinRoomModal,
  socketAPI
}) => {
  
  // Parse URL hash on component mount and setup hash change listener
  useEffect(() => {
    const getCurrentUrlInfo = () => {
      const hash = window.location.hash.slice(1); // Remove the # character
      return parseHashUrl(hash);
    };

    const urlInfo = getCurrentUrlInfo();
    setUrlRoomInfo(urlInfo);

    // Listen for hash changes
    const handleHashChange = () => {
      const newUrlInfo = getCurrentUrlInfo();
      setUrlRoomInfo(newUrlInfo);
      setAutoJoinAttempted(false); // Reset auto-join for new URL
    };

    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [setUrlRoomInfo, setAutoJoinAttempted]);

  // Auto-join room from URL if present
  useEffect(() => {
    if (urlRoomInfo && !autoJoinAttempted && !currentRoomId && !isJoiningRoom) {
      setAutoJoinAttempted(true);
      
      const { roomId, playerName } = urlRoomInfo;
      
      // Set values for auto-join
      setJoinRoomId(roomId);
      if (playerName) {
        setJoinUsername(playerName);
        setCurrentPlayerName(playerName);
        saveToLocalStorage(STORAGE_KEYS.LAST_USERNAME, playerName);
      }
      
      // Automatically attempt to join the room
      console.log('Auto-joining room from URL:', { roomId, playerName });
      setIsJoiningRoom(true);
      setJoinError('');
      setUrlJoinStatus('joining');
      
      // Use the playerName from URL or the last saved username
      const nameToUse = playerName || getFromLocalStorage(STORAGE_KEYS.LAST_USERNAME, '');
      if (nameToUse) {
        setCurrentPlayerName(nameToUse);
        socketAPI.joinRoom(roomId, nameToUse);
      } else {
        // No username available, show join modal for user to enter name
        setIsJoiningRoom(false);
        setUrlJoinStatus('');
        setShowJoinRoomModal(true);
      }
    }
  }, [
    urlRoomInfo, 
    autoJoinAttempted, 
    currentRoomId, 
    isJoiningRoom,
    setAutoJoinAttempted,
    setJoinRoomId,
    setJoinUsername,
    setCurrentPlayerName,
    setIsJoiningRoom,
    setJoinError,
    setUrlJoinStatus,
    setShowJoinRoomModal,
    socketAPI
  ]);

  // Update URL when room changes
  useEffect(() => {
    if (currentRoomId && currentPlayerName) {
      const newHash = createUrlHash(currentRoomId, currentPlayerName);
      updateUrlHash(newHash);
    } else if (!currentRoomId && window.location.hash) {
      // Clear hash when leaving room
      clearUrlHash();
    }
  }, [currentRoomId, currentPlayerName]);

  return {
    // No additional state or functions needed to return
    // This hook manages URL navigation effects only
  };
};
