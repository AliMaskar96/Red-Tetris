import React, { useMemo, useState, useEffect, useCallback } from 'react'
import Board, { NextPiecePreview } from '../components/Board'
import { getTetromino } from '../utils/tetrominos'
import {
  placePiece,
  clearLines,
  checkCollision,
  createEmptyBoard,
  rotatePiece,
  movePiece,
  createPieceSequence,
  getNextPiece,
  addPenaltyLines,
  generateSpectrum,
  getBoardWithPieceAndShadow
} from '../utils/gameLogic'
import GameLobby from '../components/GameLobby';
import OpponentsList from '../components/OpponentsList';
import Controls from '../components/Controls';
import socketService from '../services/socketService';
import '../styles/url-navigation.css';

const ROWS = 20;
const COLS = 10;
const SEQUENCE_LENGTH = 500; // Arbitrary large enough value for a game
const SEED = undefined; // Optionally set for deterministic multiplayer

// LocalStorage helper functions
const getFromLocalStorage = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

const saveToLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

const App = () => {
  // Modal CREATE ROOM state and logic (must be at top level, not inside JSX)
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [createRoomId] = useState(() => Math.random().toString(36).substr(2, 6).toUpperCase());
  const [username, setUsername] = useState(getFromLocalStorage('tetris_last_username', ''));
  const [userList, setUserList] = useState([]);
  
  // Modal JOIN ROOM state
  const [showJoinRoomModal, setShowJoinRoomModal] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [joinUsername, setJoinUsername] = useState(getFromLocalStorage('tetris_last_username', ''));
  
  // Current player name for multiplayer
  const [currentPlayerName, setCurrentPlayerName] = useState('');
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  
  // URL-based room joining state
  const [urlRoomInfo, setUrlRoomInfo] = useState(null);
  const [autoJoinAttempted, setAutoJoinAttempted] = useState(false);
  const [urlJoinStatus, setUrlJoinStatus] = useState(''); // 'joining', 'success', 'error'
  
  // Multiplayer state
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [currentGameId, setCurrentGameId] = useState(null);
  const [currentPlayerId, setCurrentPlayerId] = useState(null);
  const [roomPlayers, setRoomPlayers] = useState([]);
  const [isRoomLeader, setIsRoomLeader] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  
  // Multiplayer game state
  const [eliminatedPlayers, setEliminatedPlayers] = useState([]);
  const [gameWinner, setGameWinner] = useState(null);
  const [multiplayerGameEnded, setMultiplayerGameEnded] = useState(false);
  const [waitingForRematch, setWaitingForRematch] = useState(false);
  
  // Opponents' spectrums for display
  const [opponentsSpectrums, setOpponentsSpectrums] = useState({});
  
  // Opponents' scores for display
  const [opponentsScores, setOpponentsScores] = useState({});
  
  // Penalty lines notification
  const [penaltyNotification, setPenaltyNotification] = useState(null);
  
  // High scores from localStorage
  const [highScores, setHighScores] = useState(getFromLocalStorage('tetris_high_scores', [0, 0, 0, 0, 0]));
  
  // Game statistics
  const [gameStats, setGameStats] = useState(getFromLocalStorage('tetris_game_stats', {
    gamesPlayed: 0,
    totalScore: 0,
    totalLines: 0,
    multiplayerWins: 0,
    multiplayerGames: 0
  }));
  
  const handleValidateUsername = () => {
    if (username.trim() && !userList.includes(username.trim())) {
      setUserList(prev => [...prev, username.trim()]);
      const playerName = username.trim();
      setCurrentPlayerName(playerName); // Save current player name
      // Save username to localStorage
      saveToLocalStorage('tetris_last_username', playerName);
      setUsername('');
      
      // Automatically create the room after adding the first player
      // Ne pas définir currentRoomId ici - attendre la réponse du serveur
      setIsRoomLeader(true); // Creator is automatically the leader
      setJoinError(''); // Clear any previous errors
      socketService.joinRoom(createRoomId, playerName, true); // true = isCreator
    } else if (!username.trim()) {
      setJoinError('Veuillez entrer un nom valide');
    } else if (userList.includes(username.trim())) {
      setJoinError('Ce nom est déjà pris');
    }
  };

  // Prevent scrolling on the main page
  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, []);

  // Connect to server on component mount
  useEffect(() => {
    socketService.connect();
    
    return () => {
      socketService.removeAllListeners();
      socketService.disconnect();
    };
  }, []);

  // Parse URL hash on component mount and setup hash change listener
  useEffect(() => {
    const parseHashUrl = () => {
      const hash = window.location.hash.slice(1); // Remove the # character
      if (hash) {
        // Parse format: #<room>[<player_name>]
        // Examples: #ROOM123[Alice], #ROOM123, #ABC123[Bob]
        const match = hash.match(/^([A-Z0-9]+)(?:\[([^\]]+)\])?$/);
        if (match) {
          const roomId = match[1];
          const playerName = match[2];
          
          console.log('Parsed URL hash:', { roomId, playerName });
          
          return { roomId, playerName };
        } else {
          console.warn('Invalid hash URL format. Expected: #<room>[<player_name>]');
          return null;
        }
      }
      return null;
    };

    const urlInfo = parseHashUrl();
    setUrlRoomInfo(urlInfo);

    // Listen for hash changes
    const handleHashChange = () => {
      const newUrlInfo = parseHashUrl();
      setUrlRoomInfo(newUrlInfo);
      setAutoJoinAttempted(false); // Reset auto-join for new URL
    };

    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

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
        saveToLocalStorage('tetris_last_username', playerName);
      }
      
      // Automatically attempt to join the room
      console.log('Auto-joining room from URL:', { roomId, playerName });
      setIsJoiningRoom(true);
      setJoinError('');
      setUrlJoinStatus('joining');
      
      // Use the playerName from URL or the last saved username
      const nameToUse = playerName || getFromLocalStorage('tetris_last_username', '');
      if (nameToUse) {
        setCurrentPlayerName(nameToUse);
        socketService.joinRoom(roomId, nameToUse);
      } else {
        // No username available, show join modal for user to enter name
        setIsJoiningRoom(false);
        setUrlJoinStatus('');
        setShowJoinRoomModal(true);
      }
    }
  }, [urlRoomInfo, autoJoinAttempted, currentRoomId, isJoiningRoom]);

  // Update URL when room changes
  useEffect(() => {
    if (currentRoomId && currentPlayerName) {
      const newHash = `#${currentRoomId}[${currentPlayerName}]`;
      if (window.location.hash !== newHash) {
        window.history.pushState(null, null, newHash);
      }
    } else if (!currentRoomId && window.location.hash) {
      // Clear hash when leaving room
      window.history.pushState(null, null, window.location.pathname);
    }
  }, [currentRoomId, currentPlayerName]);

  // Setup socket event listeners with current state values
  useEffect(() => {
    // Remove previous listeners to avoid duplicates
    socketService.removeAllListeners();
    
    // Setup socket event listeners
    socketService.onRoomJoined(({ game, players }) => {
      console.log('Room joined:', { game, players });
      console.log('Current player name:', currentPlayerName);
      console.log('Join username:', joinUsername);
      console.log('Username:', username);
      
      setCurrentGameId(game.id);
      setRoomPlayers(players);
      
      // Find current player first
      let foundCurrentPlayer = null;
      
      // Try to find by currentPlayerName first
      if (currentPlayerName) {
        foundCurrentPlayer = players.find(p => p.name === currentPlayerName);
      }
      
      // If not found, try by joinUsername
      if (!foundCurrentPlayer && joinUsername) {
        foundCurrentPlayer = players.find(p => p.name === joinUsername.trim());
      }
      
      // If not found, try by username
      if (!foundCurrentPlayer && username) {
        foundCurrentPlayer = players.find(p => p.name === username.trim());
      }
      
      // If still not found, try by userList (for create room)
      if (!foundCurrentPlayer && userList.length > 0) {
        foundCurrentPlayer = players.find(p => userList.includes(p.name));
      }
      
      // Initialize opponents' scores from room join data (excluding current player)
      const initialOpponentsScores = {};
      players.forEach(player => {
        if (player.score !== undefined && player.id !== (foundCurrentPlayer ? foundCurrentPlayer.id : null)) {
          initialOpponentsScores[player.id] = player.score;
        }
      });
      setOpponentsScores(initialOpponentsScores);
      console.log('📊 Initialized opponents scores:', initialOpponentsScores);
      
      // Set room ID only when server confirms successful join
      if (joinRoomId) {
        setCurrentRoomId(joinRoomId.trim().toUpperCase());
      } else if (createRoomId) {
        setCurrentRoomId(createRoomId);
      }
      
      // Update URL join status
      if (urlJoinStatus === 'joining') {
        setUrlJoinStatus('success');
      }
      
      // Use the current player we found earlier
      if (foundCurrentPlayer) {
        console.log('Found current player:', foundCurrentPlayer);
        setCurrentPlayerId(foundCurrentPlayer.id);
        setIsRoomLeader(foundCurrentPlayer.isLeader);
        // Update currentPlayerName if it wasn't set correctly
        if (!currentPlayerName) {
          setCurrentPlayerName(foundCurrentPlayer.name);
        }
        console.log('Set currentPlayerId to:', foundCurrentPlayer.id, 'for player:', foundCurrentPlayer.name);
      } else {
        console.log('Current player not found in players list');
        console.log('Available players:', players.map(p => p.name));
        console.log('Searching for currentPlayerName:', currentPlayerName);
        console.log('Searching for joinUsername:', joinUsername);
        console.log('Searching for username:', username);
        console.log('Searching in userList:', userList);
      }
      
      setJoinError('');
      setIsMultiplayer(true);
      setIsJoiningRoom(false); // Stop loading state
    });

    socketService.onJoinError(({ message }) => {
      console.error('Join error:', message);
      setJoinError(message);
      setIsJoiningRoom(false); // Stop loading state
    });

    socketService.onGameStarted(({ gameId, currentPiece, nextPiece }) => {
      console.log('Game started:', { gameId, currentPiece, nextPiece });
      
      // Fermer toutes les modales
      setShowCreateRoomModal(false);
      setShowJoinRoomModal(false);
      
      // Set pieces from server
      if (currentPiece) {
        setCurrentType(currentPiece);
        setShape(getTetromino(currentPiece).shape);
      }
      if (nextPiece) {
        setNextType(nextPiece);
      }
      
      setPlaying(true);
      setPaused(false); // Reset pause state
      setWaitingForRematch(false); // Reset rematch waiting state
      // Reset game state for multiplayer but keep server pieces
      const newShape = getTetromino(currentPiece || 'I').shape;
      setPile(emptyBoard);
      setPieceIndex(0);
      setPos({ x: Math.floor((COLS - newShape[0].length) / 2), y: 0 });
      setScore(0);
      setLines(0);
      setGameOver(false);
      setLockInput(false);
      setPendingNewPiece(false);
      
      // Reset multiplayer game state
      setEliminatedPlayers([]);
      setGameWinner(null);
      setMultiplayerGameEnded(false);
      
      // Reset opponents' scores to 0 for new game
      const resetOpponentsScores = {};
      Object.keys(opponentsScores).forEach(playerId => {
        resetOpponentsScores[playerId] = 0;
      });
      setOpponentsScores(resetOpponentsScores);
      console.log('🔄 Reset opponents scores for new game:', resetOpponentsScores);
      
      // Reset opponents' spectrums to empty for new game
      const resetOpponentsSpectrums = {};
      Object.keys(opponentsSpectrums).forEach(playerId => {
        resetOpponentsSpectrums[playerId] = Array(10).fill(0); // Empty spectrum (all columns at height 0)
      });
      setOpponentsSpectrums(resetOpponentsSpectrums);
      console.log('🔄 Reset opponents spectrums for new game:', resetOpponentsSpectrums);
    });

    socketService.onNextPiece(({ currentPiece, nextPiece }) => {
      console.log('Next piece from server:', { currentPiece, nextPiece });
      
      // In multiplayer, always use pieces from server
      if (isMultiplayer) {
        if (currentPiece) {
          setCurrentType(currentPiece);
          const newShape = getTetromino(currentPiece).shape;
          setShape(newShape);
          setPos({ x: Math.floor((COLS - newShape[0].length) / 2), y: 0 });
        }
        if (nextPiece) {
          setNextType(nextPiece);
        }
        setPendingNewPiece(false);
      } else {
        // Solo play - use old logic or ignore server pieces
        if (currentPiece) {
          setNextType(currentPiece);
        }
      }
    });

    socketService.onPlayerEliminated(({ playerId, playerName, remainingPlayers }) => {
      console.log('Player eliminated:', { playerId, playerName, remainingPlayers });
      console.log('Current player ID:', currentPlayerId);
      setEliminatedPlayers(prev => [...prev, { id: playerId, name: playerName }]);
      
      // Si c'est nous qui sommes éliminés
      if (playerId === currentPlayerId) {
        console.log('WE ARE ELIMINATED!');
        setGameOver(true);
        // Ne pas mettre playing à false ici pour permettre l'affichage de l'overlay
      }
    });

    socketService.onGameEnd(({ winnerId, winnerName, gameResult }) => {
      console.log('Game ended:', { winnerId, winnerName, gameResult });
      console.log('Setting game winner and multiplayer ended states');
      
      const winner = { id: winnerId, name: winnerName };
      console.log('Winner object:', winner);
      
      setGameWinner(winner);
      setMultiplayerGameEnded(true);
      // Ne pas mettre playing à false ici pour permettre l'affichage de l'overlay
      
      // Save multiplayer game stats
      const isWinner = winnerId === currentPlayerId;
      updateGameStats(score, lines, true, isWinner);
      if (score > 0) {
        updateHighScores(score);
      }
      
      // Debug après setState
      setTimeout(() => {
        console.log('States after setState in onGameEnd:');
        console.log('gameWinner should be:', winner);
        console.log('multiplayerGameEnded should be: true');
      }, 100);
      
      // Si c'est nous qui avons gagné
      if (winnerId === currentPlayerId) {
        console.log('WE WON!');
        setGameOver(false); // Pas de game over pour le gagnant
      } else {
        console.log('WE LOST OR SOMEONE ELSE WON');
      }
    });

    // Handle penalty lines received from server
    socketService.onPenaltyLines(({ playerId, count }) => {
      console.log('🚨 Received penalty lines:', { playerId, count, currentPlayerId });
      // Only apply penalty if it's for current player
      if (playerId === currentPlayerId) {
        console.log('🚨 Applying penalty lines to current player...');
        setPile(currentBoard => {
          console.log('🚨 Current board before penalty:', currentBoard);
          const newBoard = addPenaltyLines(currentBoard, count);
          console.log('🚨 New board after penalty:', newBoard);
          return newBoard;
        });
        console.log(`🚨 Applied ${count} penalty lines to current player`);
        
        // Show penalty notification
        setPenaltyNotification({ count, timestamp: Date.now() });
        setTimeout(() => setPenaltyNotification(null), 2000);
      } else {
        console.log('🚨 Penalty lines not for current player, ignoring');
      }
    });

    // Handle board updates from other players (for spectrum display)
    socketService.onPlayerBoardUpdated(({ playerId, board, spectrum, score }) => {
      console.log('📊 Player board updated:', { playerId, spectrum, score });
      if (playerId !== currentPlayerId) {
        console.log('🔥 Updating opponent spectrum:', { playerId, spectrum });
        setOpponentsSpectrums(prev => {
          const updated = {
            ...prev,
            [playerId]: spectrum
          };
          console.log('🔄 New opponents spectrums state:', updated);
          return updated;
        });
        // Update opponent's score if provided
        if (score !== undefined) {
          console.log('📊 Updating opponent score:', { playerId, score });
          setOpponentsScores(prev => ({
            ...prev,
            [playerId]: score
          }));
        }
      } else {
        console.log('🚫 Ignoring own board update');
      }
    });

    // Handle score updates from other players
    socketService.onPlayerScoreUpdated(({ playerId, score }) => {
      console.log('📊 Received score update:', { playerId, score });
      if (playerId !== currentPlayerId) {
        setOpponentsScores(prev => ({
          ...prev,
          [playerId]: score
        }));
      }
    });
  }, [currentPlayerName, joinUsername, username, joinRoomId, createRoomId, userList, currentPlayerId]);

  // Send score updates to server in multiplayer
  useEffect(() => {
    if (isMultiplayer && currentPlayerId && score >= 0) {
      console.log('📊 Sending score update:', { currentPlayerId, score });
      socketService.sendScoreUpdate(currentPlayerId, score);
      // Also send board update to include score in spectrum update
      socketService.sendBoardUpdate(currentPlayerId, pile);
    }
  }, [score, isMultiplayer, currentPlayerId, pile]);

  // Generate a piece sequence at game start
  const pieceSequence = useMemo(() => createPieceSequence(SEQUENCE_LENGTH, SEED), []);

  // State for piece index, next piece preview, etc.
  const [pieceIndex, setPieceIndex] = useState(0);
  const [currentType, setCurrentType] = useState(getNextPiece(pieceSequence, 0));
  const [nextType, setNextType] = useState(getNextPiece(pieceSequence, 1));
  const [shape, setShape] = useState(getTetromino(currentType).shape);
  const emptyBoard = useMemo(() => createEmptyBoard(), []);
  const startX = Math.floor((COLS - shape[0].length) / 2);

  // State for the rest
  const [pile, setPile] = useState(emptyBoard);
  const [pos, setPos] = useState({ x: startX, y: 0 });
  const [lockInput, setLockInput] = useState(false);
  const [pendingNewPiece, setPendingNewPiece] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [inLobby, setInLobby] = useState(true); // Add lobby/game toggle
  const [selectedMode, setSelectedMode] = useState(getFromLocalStorage('tetris_selected_mode', 'classic')); // Mode selection from localStorage
  const [lines, setLines] = useState(0);
  const [gravityDrop, setGravityDrop] = useState(false);
  const gravityTimeoutRef = React.useRef();

  // Mock data for demonstration (now will be replaced by real multiplayer data)
  const mockPlayers = roomPlayers.length > 0 ? roomPlayers : [
    { id: '1', name: 'Ali', isLeader: true },
    { id: '2', name: 'ilyas', isLeader: false }
  ];
  // Real opponents data for display
  const opponents = roomPlayers.filter(p => p.id !== currentPlayerId).map(p => ({ 
    id: p.id, 
    name: p.name
  }));
  const roomId = currentRoomId || 'ROOM123';
  const isLeader = isRoomLeader;
  
  // Handle multiplayer room joining
  const handleJoinRoom = () => {
    if (!joinRoomId.trim()) {
      setJoinError('Veuillez entrer un ID de room');
      return;
    }
    if (!joinUsername.trim()) {
      setJoinError('Veuillez entrer votre nom');
      return;
    }
    
    const playerName = joinUsername.trim();
    setCurrentPlayerName(playerName); // Save current player name
    // Save username to localStorage
    saveToLocalStorage('tetris_last_username', playerName);
    setIsJoiningRoom(true); // Show loading state
    setJoinError(''); // Clear previous errors
    socketService.joinRoom(joinRoomId.trim().toUpperCase(), playerName);
    // Ne pas fermer la modal - la garder ouverte pour voir les joueurs
  };
  
  const handleValidateJoinUsername = () => {
    handleJoinRoom();
  };
  
  const handleStartMultiplayerGame = () => {
    if (isRoomLeader && currentGameId) {
      socketService.startGame(currentGameId);
    }
  };
  
  const handleStartGame = () => { 
    // Fermer toutes les modales
    setShowCreateRoomModal(false);
    setShowJoinRoomModal(false);
    
    if (isMultiplayer) {
      handleStartMultiplayerGame();
    } else {
      setInLobby(false); 
      setPlaying(true);
      setPaused(false); // Reset pause state 
    }
  };

  // Toggle pause function
  const togglePause = () => {
    if (playing && !gameOver && !multiplayerGameEnded) {
      setPaused(prev => {
        const newPausedState = !prev;
        // Send pause state to server in multiplayer mode
        if (isMultiplayer && currentPlayerId) {
          socketService.sendPauseState(currentPlayerId, newPausedState);
        }
        return newPausedState;
      });
    }
  };

  // Gestion des touches
  const handleKeyDown = useCallback((e) => {
    // Handle pause key (P or Escape) even when paused
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
      if (playing && !gameOver && !multiplayerGameEnded) {
        setPaused(prev => !prev);
        return;
      }
    }
    
    if (gameOver || lockInput || pendingNewPiece || multiplayerGameEnded || paused || e.repeat) return;
    
    let move = null;
    if (e.key === 'ArrowLeft') {
      move = 'left';
      setPos(pos => {
        const { x, y } = movePiece(shape, 'left', pile, pos.x, pos.y);
        return { ...pos, x };
      });
    } else if (e.key === 'ArrowRight') {
      move = 'right';
      setPos(pos => {
        const { x, y } = movePiece(shape, 'right', pile, pos.x, pos.y);
        return { ...pos, x };
      });
    } else if (e.key === 'ArrowDown') {
      move = 'down';
      setPos(pos => {
        const { x, y } = movePiece(shape, 'down', pile, pos.x, pos.y);
        return { ...pos, y };
      });
    } else if (e.key === 'ArrowUp' || e.key === ' ') {
      move = 'rotate';
      setShape(s => rotatePiece(s, pile, pos.x, pos.y));
    }
    
    // Send move to server if in multiplayer
    if (isMultiplayer && currentPlayerId && move) {
      socketService.sendPlayerMove(currentPlayerId, move);
    }
  }, [shape, pile, pos.x, pos.y, lockInput, pendingNewPiece, gameOver, multiplayerGameEnded, isMultiplayer, currentPlayerId, paused, playing]);

  useEffect(() => {
    if (!playing) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, playing]);

  // Descente automatique de la pièce et fixation
  useEffect(() => {
    if (!playing || gameOver || multiplayerGameEnded || paused) return;
    let interval;
    if (selectedMode === 'gravity') {
      if (gravityDrop) {
        interval = setInterval(() => {
          setPos(pos => {
            if (!checkCollision(shape, pile, pos.x, pos.y + 1)) {
              return { ...pos, y: pos.y + 1 };
            }
            return pos;
          });
        }, 20); // Gravity+ rapide
      } else {
        interval = setInterval(() => {
          setPos(pos => {
            if (!checkCollision(shape, pile, pos.x, pos.y + 1)) {
              return { ...pos, y: pos.y + 1 };
            }
            return pos;
          });
        }, 500); // Gravity+ lent (avant gravityDrop)
      }
    } else {
      interval = setInterval(() => {
        setPos(pos => {
          if (!checkCollision(shape, pile, pos.x, pos.y + 1)) {
            return { ...pos, y: pos.y + 1 };
          }
          return pos;
        });
      }, 500); // Classic et Invisible
    }
    return () => clearInterval(interval);
  }, [shape, pile, gameOver, playing, selectedMode, gravityDrop, multiplayerGameEnded, paused]);

  // Gravity+ mode: after each new piece appears, after 2s it drops INSTANTLY to the bottom
  useEffect(() => {
    if (selectedMode === 'gravity' && playing) {
      if (pos.y === 0) {
        setGravityDrop(false);
        if (gravityTimeoutRef.current) clearTimeout(gravityTimeoutRef.current);
        gravityTimeoutRef.current = setTimeout(() => {
          setGravityDrop(true);
        }, 2000);
      }
    } else {
      setGravityDrop(false);
      if (gravityTimeoutRef.current) clearTimeout(gravityTimeoutRef.current);
    }
    return () => { if (gravityTimeoutRef.current) clearTimeout(gravityTimeoutRef.current); };
  }, [pos.y, selectedMode, playing]);

  // Helper to drop piece instantly to the bottom
  const dropPieceToBottom = useCallback(() => {
    let y = pos.y;
    while (!checkCollision(shape, pile, pos.x, y + 1)) {
      y++;
    }
    setPos(pos => ({ ...pos, y }));
    setGravityDrop(false);
  }, [pos, shape, pile]);

  // Only trigger instant drop ONCE per piece
  useEffect(() => {
    if (selectedMode === 'gravity' && playing && gravityDrop) {
      dropPieceToBottom();
    }
    // eslint-disable-next-line
  }, [gravityDrop]);

  // Gravity+ mode: after each new piece appears, after 2s it drops rapidly
  useEffect(() => {
    if (selectedMode === 'gravity' && playing) {
      // When a new piece spawns (pos.y === 0)
      if (pos.y === 0) {
        setGravityDrop(false);
        if (gravityTimeoutRef.current) clearTimeout(gravityTimeoutRef.current);
        gravityTimeoutRef.current = setTimeout(() => {
          setGravityDrop(true);
        }, 500);
      }
    } else {
      setGravityDrop(false);
      if (gravityTimeoutRef.current) clearTimeout(gravityTimeoutRef.current);
    }
    return () => { if (gravityTimeoutRef.current) clearTimeout(gravityTimeoutRef.current); };
  }, [pos.y, selectedMode, playing]);

  useEffect(() => {
    if (!playing || gameOver || multiplayerGameEnded || paused) return;
    const interval = setInterval(() => {
      setPos(pos => {
        if (!checkCollision(shape, pile, pos.x, pos.y + 1)) {
          return { ...pos, y: pos.y + 1 };
        } else {
          setPendingNewPiece(true); // Empêche toute entrée
          setPile(pile => {
            const merged = placePiece(shape, pile, pos.x, pos.y);
            let newBoard, linesCleared;
            if (selectedMode === 'gravity') {
              ({ newBoard, linesCleared } = require('../utils/gameLogic').clearLinesWithGravity(merged));
            } else {
              ({ newBoard, linesCleared } = clearLines(merged));
            }
            if (linesCleared > 0) {
              const newScore = score + (linesCleared * 100);
              setScore(newScore);
              setLines(l => l + linesCleared);
              
              // Send lines cleared to server in multiplayer WITH the new score
              if (isMultiplayer && currentPlayerId) {
                console.log(`🎯 Sending lines cleared: ${linesCleared} lines by player ${currentPlayerId} with new score: ${newScore}`);
                socketService.sendLinesCleared(currentPlayerId, linesCleared, newBoard, newScore);
              }
            }
            
            // Send piece placed to server in multiplayer
            if (isMultiplayer && currentPlayerId) {
              console.log(`🔧 Sending piece placed with board update for spectrum calculation`);
              socketService.sendPiecePlaced(currentPlayerId, currentType, newBoard);
              // Also explicitly send board update for spectrum calculation
              socketService.sendBoardUpdate(currentPlayerId, newBoard);
            }
            
            return newBoard;
          });
          setTimeout(() => {
            // Handle new piece logic differently for solo vs multiplayer
            if (isMultiplayer && currentPlayerId) {
              // MULTIPLAYER: Request next piece from server
              const merged = placePiece(shape, pile, pos.x, pos.y);
              let newBoard;
              if (selectedMode === 'gravity') {
                ({ newBoard } = require('../utils/gameLogic').clearLinesWithGravity(merged));
              } else {
                ({ newBoard } = clearLines(merged));
              }
              
              // Check for game over with current piece before requesting new one
              const nextShape = getTetromino(nextType || 'I').shape;
              const newStartX = Math.floor((COLS - nextShape[0].length) / 2);
              
              if (checkCollision(nextShape, newBoard, newStartX, 0)) {
                console.log('Game over detected in multiplayer!');
                setGameOver(true);
                setPendingNewPiece(false);
                socketService.sendGameOver(currentPlayerId);
              } else {
                // Request next piece from server - it will update our state via socket
                socketService.requestNextPiece(currentPlayerId);
              }
            } else {
              // SOLO: Use local piece generation
              setPieceIndex(idx => {
                const newIndex = idx + 1;
                const newType = getNextPiece(pieceSequence, newIndex);
                const newShape = getTetromino(newType).shape;
                const newStartX = Math.floor((COLS - newShape[0].length) / 2);
                const merged = placePiece(shape, pile, pos.x, pos.y);
                let newBoard;
                if (selectedMode === 'gravity') {
                  ({ newBoard } = require('../utils/gameLogic').clearLinesWithGravity(merged));
                } else {
                  ({ newBoard } = clearLines(merged));
                }
                if (checkCollision(newShape, newBoard, newStartX, 0)) {
                  setGameOver(true);
                  setPendingNewPiece(false);
                  return newIndex;
                }
                setCurrentType(newType);
                setNextType(getNextPiece(pieceSequence, newIndex + 1));
                setShape(newShape);
                setPos({ x: newStartX, y: 0 });
                setPendingNewPiece(false);
                return newIndex;
              });
            }
          }, 0);
          return pos;
        }
      });
    }, 500);
    return () => clearInterval(interval);
  }, [shape, pile, gameOver, playing, pieceSequence, selectedMode, multiplayerGameEnded, isMultiplayer, currentPlayerId, currentType, nextType, paused]);

  // Update shape if currentType changes (e.g., after reset)
  useEffect(() => {
    setShape(getTetromino(currentType).shape);
  }, [currentType]);

  // Quand on retourne au lobby, reset gameOver
  useEffect(() => {
    if (inLobby) {
      setGameOver(false);
      setPlaying(false);
      // Reset multiplayer game state
      setEliminatedPlayers([]);
      setGameWinner(null);
      setMultiplayerGameEnded(false);
    }
  }, [inLobby]);

  // Fusionne la pièce à sa position courante sur la pile avec le spectre
  const boardWithPiece = getBoardWithPieceAndShadow(shape, pile, pos.x, pos.y);

  // Fonction de reset
  const handleReset = () => {
    // Save score and stats before resetting
    if (score > 0 || lines > 0) {
      updateHighScores(score);
      updateGameStats(score, lines, isMultiplayer, false);
    }
    
    setPile(emptyBoard);
    setPieceIndex(0);
    setCurrentType(getNextPiece(pieceSequence, 0));
    setNextType(getNextPiece(pieceSequence, 1));
    const newShape = getTetromino(getNextPiece(pieceSequence, 0)).shape;
    setShape(newShape);
    setPos({ x: Math.floor((COLS - newShape[0].length) / 2), y: 0 });
    setScore(0);
    setLines(0);
    setGameOver(false);
    setLockInput(false);
    setPendingNewPiece(false);
    setPlaying(true);
    setPaused(false); // Reset pause state
    
    // Reset multiplayer game state
    setEliminatedPlayers([]);
    setGameWinner(null);
    setMultiplayerGameEnded(false);
    setWaitingForRematch(false);
    setWaitingForRematch(false);
  };

  // Function to update high scores
  const updateHighScores = (newScore) => {
    if (newScore > 0) {
      const updatedScores = [...highScores, newScore]
        .sort((a, b) => b - a)
        .slice(0, 5); // Keep only top 5 scores
      setHighScores(updatedScores);
      saveToLocalStorage('tetris_high_scores', updatedScores);
    }
  };

  // Function to update game statistics
  const updateGameStats = (finalScore, finalLines, isMultiplayer = false, isWinner = false) => {
    const newStats = {
      ...gameStats,
      gamesPlayed: gameStats.gamesPlayed + 1,
      totalScore: gameStats.totalScore + finalScore,
      totalLines: gameStats.totalLines + finalLines,
      multiplayerGames: gameStats.multiplayerGames + (isMultiplayer ? 1 : 0),
      multiplayerWins: gameStats.multiplayerWins + (isMultiplayer && isWinner ? 1 : 0)
    };
    setGameStats(newStats);
    saveToLocalStorage('tetris_game_stats', newStats);
  };

  // Function to save selected mode
  const handleModeChange = (mode) => {
    setSelectedMode(mode);
    saveToLocalStorage('tetris_selected_mode', mode);
  };

  // Function de démarrage
  const handlePlay = () => {
    setInLobby(false);
    handleReset();
  };

  // Board rendering with mode logic
  const [invisibleFlash, setInvisibleFlash] = useState(false);
  const [lastY, setLastY] = useState(0);

  // Invisible mode: piece is invisible for 2s after every vertical move (including spawn)
  useEffect(() => {
    if (selectedMode === 'invisible' && playing) {
      if (pos.y !== lastY) {
        setInvisibleFlash(false); // Hide immediately
        const timeout = setTimeout(() => setInvisibleFlash(true), 2000); // Show after 2s
        setLastY(pos.y);
        return () => clearTimeout(timeout);
      }
    } else {
      setInvisibleFlash(true); // Always visible in other modes
      setLastY(0);
    }
  }, [pos.y, selectedMode, playing]);

  const getDisplayBoard = () => {
    if (selectedMode === 'invisible' && playing) {
      if (invisibleFlash) {
        return boardWithPiece;
      }
      return pile;
    }
    return boardWithPiece;
  };

  // Parse URL hash for room info
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const [roomId, playerName] = hash.substring(1).split('/');
      if (roomId && playerName) {
        setUrlRoomInfo({ roomId, playerName });
      }
    }
  }, []);

  // Auto-join room if URL hash is present
  useEffect(() => {
    if (urlRoomInfo && !autoJoinAttempted) {
      setJoinRoomId(urlRoomInfo.roomId);
      setJoinUsername(urlRoomInfo.playerName);
      handleJoinRoom();
      setAutoJoinAttempted(true);
    }
  }, [urlRoomInfo, autoJoinAttempted]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      color: '#fff',
      position: 'relative',
    }}>
      {inLobby ? (
        <div style={{
          display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100vw', height: '100vh', position: 'relative',
        }}>
          {/* Score/Level/Lines Panel (à gauche) */}
          <div style={{margin: 24, width: 160, height: 160, background: '#222', borderRadius: 18, boxShadow: '0 2px 12px #0008', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: 16, zIndex: 2}}>
            <div style={{fontWeight: 'bold', fontSize: 22, marginBottom: 8}}>SCORE</div>
            <div style={{background: '#111', borderRadius: 8, width: 120, height: 32, marginBottom: 8, color: '#FFD700', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{score}</div>
            <div style={{fontWeight: 'bold', fontSize: 18, marginBottom: 4}}>LEVEL</div>
            <div style={{background: '#111', borderRadius: 8, width: 120, height: 24, marginBottom: 8, color: '#FFD700', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>1</div>
            <div style={{fontWeight: 'bold', fontSize: 18, marginBottom: 4}}>LINES</div>
            <div style={{background: '#111', borderRadius: 8, width: 120, height: 24, color: '#FFD700', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{lines}</div>
          </div>
          {/* Main Panel avec le jeu au centre */}
          <div style={{
            background: '#111',
            borderRadius: 24,
            boxShadow: '0 4px 32px #000a',
            padding: 0,
            minWidth: COLS * 32 + 16, // 10*32px + padding
            minHeight: ROWS * 32 + 16, // 20*32px + padding
            width: COLS * 32 + 16,
            height: ROWS * 32 + 16,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            zIndex: 3,
            position: 'relative',
            overflow: 'hidden',
            paddingBottom: 24, // Ajoute du padding en bas pour équilibrer avec le haut
          }}>
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
              <span style={{color: '#FF3B3B'}}>T</span><span style={{color: '#FFD700'}}>E</span><span style={{color: '#00E6FF'}}>T</span><span style={{color: '#00FF00'}}>R</span><span style={{color: '#FF00FF'}}>I</span><span style={{color: '#FF3B3B'}}>S</span>
            </div>
            {/* Affiche le jeu si playing, sinon affiche le lobby */}
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
                  <Board board={getDisplayBoard()} />
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
                <button onClick={() => { setPlaying(true); }} style={{
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
                }}>PLAY</button>
                
                <button 
                  onClick={() => setShowCreateRoomModal(true)}
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
                  }}>CREATE ROOM</button>
                <button onClick={() => setShowJoinRoomModal(true)} style={{
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
                }}>JOIN ROOM</button>
                <div style={{background: '#222', borderRadius: 10, padding: '12px 24px', marginBottom: 18, width: 220}}>
                  <div style={{fontWeight: 'bold', fontSize: 18, marginBottom: 6, color: '#FFD700'}}>HIGH SCORES</div>
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
                {/* Mode Game selection EN BAS, boutons en colonne */}
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
                  justifyContent: 'center',
                  minHeight: 44,
                  minWidth: 220,
                  boxShadow: '0 1px 6px #0004',
                  gap: 10,
                }}>
                  <span style={{fontSize: 18, letterSpacing: 1, marginBottom: 8}}>MODE :</span>
                  <button
                    style={{
                      background: selectedMode === 'classic' ? '#FFD700' : '#444',
                      color: selectedMode === 'classic' ? '#222' : '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 32px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: 18,
                      transition: 'background 0.2s, color 0.2s',
                      boxShadow: selectedMode === 'classic' ? '0 2px 8px #FFD70055' : 'none',
                      marginBottom: 6,
                    }}
                    onClick={() => handleModeChange('classic')}
                  >Classic</button>
                  <button
                    style={{
                      background: selectedMode === 'invisible' ? '#FFD700' : '#444',
                      color: selectedMode === 'invisible' ? '#222' : '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 32px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: 18,
                      transition: 'background 0.2s, color 0.2s',
                      boxShadow: selectedMode === 'invisible' ? '0 2px 8px #FFD70055' : 'none',
                      marginBottom: 6,
                    }}
                    onClick={() => handleModeChange('invisible')}
                  >Invisible</button>
                  <button
                    style={{
                      background: selectedMode === 'gravity' ? '#FFD700' : '#444',
                      color: selectedMode === 'gravity' ? '#222' : '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 32px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: 18,
                      transition: 'background 0.2s, color 0.2s',
                      boxShadow: selectedMode === 'gravity' ? '0 2px 8px #FFD70055' : 'none',
                    }}
                    onClick={() => handleModeChange('gravity')}
                  >Gravity+</button>
                </div>
              </div>
            )}
          </div>
          
          {/* Game Over Overlay - Solo ou Eliminated en Multi */}
          {gameOver && !multiplayerGameEnded && (
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
                  Score : {score}
                </div>
                {isMultiplayer ? (
                  <div style={{display: 'flex', gap: 20, marginTop: 32, justifyContent: 'center'}}>
                    <button onClick={() => {
                      // Save score and stats before rejoining
                      if (score > 0 || lines > 0) {
                        updateHighScores(score);
                        updateGameStats(score, lines, isMultiplayer, false);
                      }
                      
                      // Send ready signal to server
                      if (currentPlayerId) {
                        socketService.sendPlayerReady(currentPlayerId);
                      }
                      
                      // Set waiting for rematch state
                      setWaitingForRematch(true);
                      
                      // Reset game state but stay in multiplayer room
                      setPlaying(false);
                      setGameOver(false);
                      setMultiplayerGameEnded(false);
                      setGameWinner(null);
                      setEliminatedPlayers([]);
                      setPaused(false);
                      
                      // Reset all game state to initial values
                      setPile(emptyBoard);
                      setPieceIndex(0);
                      setCurrentType(getNextPiece(pieceSequence, 0));
                      setNextType(getNextPiece(pieceSequence, 1));
                      const newShape = getTetromino(getNextPiece(pieceSequence, 0)).shape;
                      setShape(newShape);
                      setPos({ x: Math.floor((COLS - newShape[0].length) / 2), y: 0 });
                      setScore(0);
                      setLines(0);
                      setLockInput(false);
                      setPendingNewPiece(false);
                      
                      // Stay in multiplayer room, waiting for leader to start new game
                      setShowCreateRoomModal(false);
                      setShowJoinRoomModal(true); // Show room modal to see players waiting
                    }} style={{
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
                      🔄 REJOUER
                    </button>
                    
                    <button onClick={() => {
                      // Save score and stats before going to lobby
                      if (score > 0 || lines > 0) {
                        updateHighScores(score);
                        updateGameStats(score, lines, isMultiplayer, false);
                      }
                      
                      // Send leave room command to server
                      if (currentPlayerId) {
                        socketService.leaveRoom(currentPlayerId);
                      }
                      
                      // Reset multiplayer state and go to lobby
                      setCurrentRoomId(null);
                      setCurrentPlayerName('');
                      setRoomPlayers([]);
                      setIsRoomLeader(false);
                      setIsMultiplayer(false);
                      setCurrentPlayerId(null);
                      setCurrentGameId(null);
                      
                      setInLobby(true);
                      setPlaying(false);
                      setGameOver(false);
                      setMultiplayerGameEnded(false);
                      setGameWinner(null);
                      setEliminatedPlayers([]);
                      setPaused(false);
                      
                      // Reset all game state to initial values
                      setPile(emptyBoard);
                      setPieceIndex(0);
                      setCurrentType(getNextPiece(pieceSequence, 0));
                      setNextType(getNextPiece(pieceSequence, 1));
                      const newShape = getTetromino(getNextPiece(pieceSequence, 0)).shape;
                      setShape(newShape);
                      setPos({ x: Math.floor((COLS - newShape[0].length) / 2), y: 0 });
                      setScore(0);
                      setLines(0);
                      setLockInput(false);
                      setPendingNewPiece(false);
                      
                      // Update URL to remove room hash
                      window.location.hash = '';
                    }} style={{
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
                  <div style={{fontSize: 18, color: '#ccc', marginTop: 12}}>
                    Partie terminée
                  </div>
                )}
                {!isMultiplayer && (
                  <>
                    <button onClick={handleReset} style={{marginTop: 32, padding: '14px 40px', fontSize: 22, borderRadius: 10, background: '#28a745', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #0006'}}>Rejouer</button>
                    <button onClick={() => {
                      // Save score and stats before going to lobby
                      if (score > 0 || lines > 0) {
                        updateHighScores(score);
                        updateGameStats(score, lines, isMultiplayer, false);
                      }
                      setInLobby(true);
                      setPlaying(false);
                      setGameOver(false);
                      // Reset all game state to initial values
                      setPile(emptyBoard);
                      setPieceIndex(0);
                      setCurrentType(getNextPiece(pieceSequence, 0));
                      setNextType(getNextPiece(pieceSequence, 1));
                      const newShape = getTetromino(getNextPiece(pieceSequence, 0)).shape;
                      setShape(newShape);
                      setPos({ x: Math.floor((COLS - newShape[0].length) / 2), y: 0 });
                      setScore(0);
                      setLines(0);
                      setLockInput(false);
                      setPendingNewPiece(false);
                    }} style={{marginTop: 18, padding: '12px 36px', fontSize: 20, borderRadius: 10, background: '#007bff', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #0006'}}>Go to Lobby</button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Victory/Defeat Overlay - Fin de partie multijoueur */}
          {multiplayerGameEnded && gameWinner && (
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
                    ? 'Félicitations! Tu as gagné!' 
                    : `${gameWinner.name} a gagné!`}
                </div>
                <div style={{fontSize: 18, color: '#ccc', marginTop: 12}}>Score final : {score}</div>
                
                <div style={{display: 'flex', gap: 20, marginTop: 32, justifyContent: 'center'}}>
                  <button onClick={() => {
                    // Save score and stats before rejoining
                    if (score > 0 || lines > 0) {
                      updateHighScores(score);
                      // Don't update stats here as they're already updated in onGameEnd for multiplayer
                    }
                    
                    // Send ready signal to server
                    if (currentPlayerId) {
                      socketService.sendPlayerReady(currentPlayerId);
                    }
                    
                    // Set waiting for rematch state
                    setWaitingForRematch(true);
                    
                    // Reset game state but stay in multiplayer room
                    setPlaying(false);
                    setGameOver(false);
                    setMultiplayerGameEnded(false);
                    setGameWinner(null);
                    setEliminatedPlayers([]);
                    setPaused(false);
                    
                    // Reset all game state to initial values
                    setPile(emptyBoard);
                    setPieceIndex(0);
                    setCurrentType(getNextPiece(pieceSequence, 0));
                    setNextType(getNextPiece(pieceSequence, 1));
                    const newShape = getTetromino(getNextPiece(pieceSequence, 0)).shape;
                    setShape(newShape);
                    setPos({ x: Math.floor((COLS - newShape[0].length) / 2), y: 0 });
                    setScore(0);
                    setLines(0);
                    setLockInput(false);
                    setPendingNewPiece(false);
                    
                    // Stay in multiplayer room, waiting for leader to start new game
                    setShowCreateRoomModal(false);
                    setShowJoinRoomModal(true); // Show room modal to see players waiting
                  }} style={{
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
                    🔄 REJOUER
                  </button>
                  
                  <button onClick={() => {
                    // Save score and stats before going to lobby
                    if (score > 0 || lines > 0) {
                      updateHighScores(score);
                      // Don't update stats here as they're already updated in onGameEnd for multiplayer
                    }
                    
                    // Send leave room command to server
                    if (currentPlayerId) {
                      socketService.leaveRoom(currentPlayerId);
                    }
                    
                    // Reset multiplayer state and go to lobby
                    setCurrentRoomId(null);
                    setCurrentPlayerName('');
                    setRoomPlayers([]);
                    setIsRoomLeader(false);
                    setIsMultiplayer(false);
                    setCurrentPlayerId(null);
                    setCurrentGameId(null);
                    
                    setInLobby(true);
                    setPlaying(false);
                    setGameOver(false);
                    setMultiplayerGameEnded(false);
                    setGameWinner(null);
                    setEliminatedPlayers([]);
                    setPaused(false);
                    
                    // Reset all game state to initial values
                    setPile(emptyBoard);
                    setPieceIndex(0);
                    setCurrentType(getNextPiece(pieceSequence, 0));
                    setNextType(getNextPiece(pieceSequence, 1));
                    const newShape = getTetromino(getNextPiece(pieceSequence, 0)).shape;
                    setShape(newShape);
                    setPos({ x: Math.floor((COLS - newShape[0].length) / 2), y: 0 });
                    setScore(0);
                    setLines(0);
                    setLockInput(false);
                    setPendingNewPiece(false);
                    
                    // Update URL to remove room hash
                    window.location.hash = '';
                  }} style={{
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
          )}
          
          {/* Next Panel à droite */}
          <div style={{margin: 24, width: 160, height: playing ? 240 : 160, background: '#222', borderRadius: 18, boxShadow: '0 2px 12px #0008', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: 12, zIndex: 2}}>
            <div style={{fontWeight: 'bold', fontSize: 22, marginBottom: 8}}>NEXT</div>
            <div style={{background: '#111', borderRadius: 8, width: 120, height: 100, marginBottom: playing ? 12 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <NextPiecePreview type={nextType} />
            </div>
            
            {/* Pause Button - only show when playing */}
            {playing && (
              <>
                <button
                  onClick={togglePause}
                  style={{
                    width: 120,
                    height: 32,
                    borderRadius: 8,
                    border: 'none',
                    background: paused ? '#4CAF50' : '#FF9800',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: 14,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    marginBottom: 8
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
                  }}
                >
                  {paused ? '▶ REPRENDRE' : '⏸ PAUSE'}
                </button>
                
                {/* Quit Game Button */}
                <button
                  onClick={() => {
                    // Save score and stats before quitting
                    if (score > 0 || lines > 0) {
                      updateHighScores(score);
                      updateGameStats(score, lines, isMultiplayer, false);
                    }
                    
                    // If in multiplayer, send game-over to server to eliminate player
                    if (isMultiplayer && currentPlayerId) {
                      socketService.sendGameOver(currentPlayerId);
                    }
                    
                    // Trigger game over state to show end game popup
                    setGameOver(true);
                    setPlaying(false);
                    setPaused(false);
                  }}
                  style={{
                    width: 120,
                    height: 32,
                    borderRadius: 8,
                    border: 'none',
                    background: '#f44336',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: 14,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
                    e.target.style.background = '#d32f2f';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
                    e.target.style.background = '#f44336';
                  }}
                >
                  🚪 QUITTER
                </button>
              </>
            )}
          </div>

          {/* Opponents Panel - only show in multiplayer game */}
          {isMultiplayer && playing && opponents.length > 0 && (
            <div style={{margin: 24, zIndex: 2, position: 'absolute', right: 200, top: '50%', transform: 'translateY(-50%)'}}>
              <OpponentsList 
                opponents={opponents} 
                opponentsSpectrums={opponentsSpectrums}
                opponentsScores={opponentsScores}
                eliminatedPlayers={eliminatedPlayers}
              />
            </div>
          )}
          
          {/* URL Join Status Notification */}
          {urlJoinStatus === 'joining' && (
            <div style={{
              position: 'fixed',
              top: 20,
              right: 20,
              background: '#ff9800',
              color: '#fff',
              padding: '12px 20px',
              borderRadius: 8,
              boxShadow: '0 4px 12px #0006',
              fontWeight: 'bold',
              zIndex: 1500
            }}>
              🔄 Rejoindre la room via URL...
            </div>
          )}
          
          {urlJoinStatus === 'success' && (
            <div style={{
              position: 'fixed',
              top: 20,
              right: 20,
              background: '#4CAF50',
              color: '#fff',
              padding: '12px 20px',
              borderRadius: 8,
              boxShadow: '0 4px 12px #0006',
              fontWeight: 'bold',
              zIndex: 1500,
              animation: 'fadeOut 3s forwards'
            }}
            onAnimationEnd={() => setUrlJoinStatus('')}>
              ✅ Room rejointe avec succès !
            </div>
          )}
          
          {urlJoinStatus === 'error' && (
            <div style={{
              position: 'fixed',
              top: 20,
              right: 20,
              background: '#f44336',
              color: '#fff',
              padding: '12px 20px',
              borderRadius: 8,
              boxShadow: '0 4px 12px #0006',
              fontWeight: 'bold',
              zIndex: 1500,
              animation: 'fadeOut 4s forwards'
            }}
            onAnimationEnd={() => setUrlJoinStatus('')}>
              ❌ Erreur lors de la jointure : {joinError}
            </div>
          )}

          {/* Penalty Lines Notification */}
          {penaltyNotification && (
            <div style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#ff4444',
              color: '#fff',
              padding: '20px 32px',
              borderRadius: 12,
              boxShadow: '0 8px 24px rgba(255, 68, 68, 0.4)',
              fontWeight: 'bold',
              fontSize: '24px',
              zIndex: 2000,
              border: '3px solid #ff6666',
              animation: 'pulseRed 0.5s ease-in-out'
            }}>
              🚨 +{penaltyNotification.count} Penalty Lines!
            </div>
          )}
          {/* Modal CREATE ROOM dans le lobby */}
          {showCreateRoomModal && (
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
                <div style={{fontSize: 30, fontWeight: 900, marginBottom: 12, letterSpacing: 2}}>Créer une Room</div>
                <div style={{
                  fontSize: 14, 
                  color: '#4CAF50', 
                  marginBottom: 18, 
                  padding: '8px 12px',
                  backgroundColor: 'rgba(76, 175, 80, 0.1)',
                  borderRadius: 8,
                  border: '1px solid rgba(76, 175, 80, 0.3)'
                }}>
                  👑 Vous serez le leader et pourrez lancer le jeu pour tous les joueurs
                </div>
                <div style={{fontSize: 18, color: '#fff', marginBottom: 10}}>ID de la Room : <span style={{color: '#FFD700', fontWeight: 'bold'}}>{createRoomId}</span></div>
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
                      placeholder="Entrez votre nom"
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
                      onKeyDown={e => { if (e.key === 'Enter') handleValidateUsername(); }}
                    />
                    <button
                      onClick={handleValidateUsername}
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
                    >Valider</button>
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
                    ✅ Room créée avec succès ! En attente d'autres joueurs...
                    <div style={{marginTop: 12, fontSize: 14, color: '#fff'}}>
                      <strong>Lien à partager :</strong>
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
                        elem.textContent = 'Lien copié !';
                        elem.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#4CAF50;color:white;padding:12px 24px;border-radius:8px;z-index:10000;font-weight:bold;';
                        document.body.appendChild(elem);
                        setTimeout(() => document.body.removeChild(elem), 2000);
                      }}>
                        {`${window.location.origin}/#${currentRoomId}[PLAYER_NAME]`}
                      </div>
                      <div style={{fontSize: 12, color: '#ccc', marginTop: 4}}>
                        Cliquez pour copier (remplacez PLAYER_NAME par le nom du joueur)
                      </div>
                    </div>
                  </div>
                )}
                <div style={{marginTop: 6, color: '#fff', fontSize: 18, fontWeight: 'bold'}}>Joueurs dans la room :</div>
                <ul style={{listStyle: 'none', padding: 0, margin: '10px 0 20px 0', color: '#FFD700', fontSize: 18}}>
                  {(!roomPlayers || roomPlayers.length === 0) && (
                    <li style={{color: '#fff', fontSize: 16, fontStyle: 'italic'}}>
                      {currentRoomId ? 'En attente de joueurs...' : 'Aucun joueur'}
                    </li>
                  )}
                  {roomPlayers && roomPlayers.map((player, i) => (
                    <li key={`player-${i}`} style={{margin: '4px 0', color: player.isLeader ? '#FFD700' : '#4CAF50'}}>
                      {player.name} {player.isLeader && '👑 (Leader)'}
                    </li>
                  ))}
                </ul>
                
                {/* Show START GAME button only if already in a room and is leader */}
                {currentRoomId && isRoomLeader && (
                  <button
                    onClick={handleStartMultiplayerGame}
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
                  onClick={() => {
                    // Send leave room command to server if in a room
                    if (currentPlayerId && currentRoomId) {
                      socketService.leaveRoom(currentPlayerId);
                    }
                    
                    setShowCreateRoomModal(false);
                    setJoinError('');
                    
                    // Reset room state when closing modal
                    setCurrentRoomId(null);
                    setCurrentPlayerName('');
                    setRoomPlayers([]);
                    setIsRoomLeader(false);
                    setIsMultiplayer(false);
                    setCurrentPlayerId(null);
                    setCurrentGameId(null);
                    // Update URL to remove room hash
                    window.location.hash = '';
                  }}
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
                  title="Fermer"
                >×</button>
              </div>
            </div>
          )}

          {/* Modal JOIN ROOM */}
          {showJoinRoomModal && (
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
                }}>{waitingForRematch ? 'EN ATTENTE DU REMATCH' : 'REJOINDRE UNE ROOM'}</h2>
                
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
                    🔄 Prêt pour le rematch ! En attente que le leader lance la nouvelle partie...
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
                    Seul le leader de la room peut lancer le jeu
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
                  💡 <strong>Astuce :</strong> Vous pouvez rejoindre directement via l'URL<br/>
                  <code style={{fontSize: 11, fontFamily: 'monospace'}}>
                    {window.location.origin}/#ROOM123[VotreNom]
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
                    }}>ID DE LA ROOM:</label>
                    <input
                      type="text"
                      value={joinRoomId}
                      onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                      placeholder="Entrez l'ID de la room"
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
                      onKeyDown={e => { if (e.key === 'Enter') handleJoinRoom(); }}
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
                    }}>VOTRE NOM:</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input
                        type="text"
                        value={joinUsername}
                        onChange={(e) => setJoinUsername(e.target.value)}
                        placeholder="Entrez votre nom"
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
                        onKeyDown={e => { if (e.key === 'Enter') handleValidateJoinUsername(); }}
                      />
                      <button
                        onClick={handleValidateJoinUsername}
                        style={{
                          padding: '10px 20px',
                          fontSize: 16,
                          borderRadius: 8,
                          background: '#4CAF50',
                          color: '#fff',
                          border: 'none',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px #0006'
                        }}
                      >Rejoindre</button>
                    </div>
                  </div>
                )}

                {/* Show loading state when trying to join */}
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
                    🔄 Tentative de rejoindre la room...
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
                    ✅ Rejoint la room {currentRoomId} avec succès !
                  </div>
                )}

                {joinError && (
                  <div style={{
                    color: '#ff4444',
                    marginBottom: 15,
                    textAlign: 'center',
                    fontSize: 14,
                    fontWeight: 'bold'
                  }}>
                    {joinError}
                  </div>
                )}

                {/* Show players list if in a room */}
                {currentRoomId && (
                  <div style={{ marginBottom: 20 }}>
                    <h3 style={{
                      color: '#FFD700',
                      marginBottom: 10,
                      fontSize: 18
                    }}>JOUEURS DANS LA ROOM:</h3>
                    <div style={{
                      maxHeight: 120,
                      overflowY: 'auto',
                      border: '1px solid #333',
                      borderRadius: 8,
                      padding: 8,
                      backgroundColor: '#2a2a2a'
                    }}>
                      {(!roomPlayers || roomPlayers.length === 0) ? (
                        <div style={{
                          padding: '4px 8px',
                          color: '#fff',
                          fontStyle: 'italic'
                        }}>
                          Chargement des joueurs...
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
                )}

                {/* Show START GAME button only if current user is the leader */}
                {isRoomLeader && currentRoomId && (
                  <button
                    onClick={handleStartMultiplayerGame}
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
                  onClick={() => {
                    // Send leave room command to server if in a room
                    if (currentPlayerId && currentRoomId) {
                      socketService.leaveRoom(currentPlayerId);
                    }
                    
                    setShowJoinRoomModal(false);
                    setJoinError('');
                    setJoinRoomId('');
                    setJoinUsername('');
                    setWaitingForRematch(false);
                    // Reset room state when closing modal
                    setCurrentRoomId(null);
                    setCurrentPlayerName('');
                    setRoomPlayers([]);
                    setIsRoomLeader(false);
                    setIsMultiplayer(false);
                    setCurrentPlayerId(null);
                    setCurrentGameId(null);
                    // Update URL to remove room hash
                    window.location.hash = '';
                  }}
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
                  title="Fermer"
                >×</button>
              </div>
            </div>
          )}
        </div>
      ) : null}

    </div>
  );
}

export default App;


