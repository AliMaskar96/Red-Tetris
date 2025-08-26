import React, { useMemo, useState, useEffect, useCallback } from 'react'
import Board, { NextPiecePreview } from '../components/Board'
import { getTetromino } from '../utils/tetrominos'
import {placePiece,clearLines,checkCollision,createEmptyBoard,rotatePiece,movePiece,
  createPieceSequence,
  getNextPiece,
  addPenaltyLines,
  generateSpectrum,
  getBoardWithPieceAndShadow
} from '../utils/gameLogic'
import GameLobby from '../components/GameLobby';
import OpponentsList from '../components/OpponentsList';
import Controls from '../components/Controls';
import CreateRoomModal from '../components/CreateRoomModal';
import JoinRoomModal from '../components/JoinRoomModal';
import GameOverModal from '../components/GameOverModal';
import GameBoard from '../components/GameBoard';
import GameHUD from '../components/GameHUD';
import GameControls from '../components/GameControls';
import socketService from '../services/socketService';
import { getFromLocalStorage, saveToLocalStorage } from '../services/localStorageService';
import { 
  ROWS, 
  COLS, 
  SEQUENCE_LENGTH, 
  SEED, 
  STORAGE_KEYS, 
  DEFAULT_VALUES,
  GAME_MODES 
} from '../utils/gameConstants';
import {
  generateRoomId,
  parseHashUrl,
  createUrlHash,
  updateUrlHash,
  clearUrlHash,
  validateUsername,
  validateRoomId,
  findCurrentPlayer,
  initializeOpponentsScores,
  resetOpponentsData
} from '../utils/gameHelpers';
import { useGameState } from '../hooks/useGameState';
import { useMultiplayerState } from '../hooks/useMultiplayerState';
import { useURLNavigation } from '../hooks/useURLNavigation';
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import '../styles/url-navigation.css';

const App = () => {
  // Use custom hooks for state management
  const gameState = useGameState();
  const multiplayerState = useMultiplayerState();
  
  // Destructure what we need from hooks
  const {
    pieceSequence,
    emptyBoard,
    pieceIndex,
    currentType,
    nextType,
    shape,
    pile,
    pos,
    lockInput,
    pendingNewPiece,
    gameOver,
    playing,
    paused,
    inLobby,
    score,
    lines,
    selectedMode,
    highScores,
    gameStats,
    gravityDrop,
    gravityTimeoutRef,
    invisibleFlash,
    lastY,
    setPieceIndex,
    setCurrentType,
    setNextType,
    setShape,
    setPile,
    setPos,
    setLockInput,
    setPendingNewPiece,
    setGameOver,
    setPlaying,
    setPaused,
    setInLobby,
    setScore,
    setLines,
    setGravityDrop,
    setInvisibleFlash,
    setLastY,
    updateHighScores,
    updateGameStats,
    handleModeChange,
    resetGameState
  } = gameState;
  
  const {
    showCreateRoomModal,
    setShowCreateRoomModal,
    showJoinRoomModal,
    setShowJoinRoomModal,
    createRoomId,
    username,
    setUsername,
    userList,
    setUserList,
    joinRoomId,
    setJoinRoomId,
    joinUsername,
    setJoinUsername,
    isJoiningRoom,
    setIsJoiningRoom,
    joinError,
    setJoinError,
    currentPlayerName,
    setCurrentPlayerName,
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
    urlRoomInfo,
    setUrlRoomInfo,
    autoJoinAttempted,
    setAutoJoinAttempted,
    urlJoinStatus,
    setUrlJoinStatus,
    eliminatedPlayers,
    setEliminatedPlayers,
    gameWinner,
    setGameWinner,
    multiplayerGameEnded,
    setMultiplayerGameEnded,
    waitingForRematch,
    setWaitingForRematch,
    opponentsSpectrums,
    setOpponentsSpectrums,
    opponentsScores,
    setOpponentsScores,
    penaltyNotification,
    setPenaltyNotification,
    initializeOpponents,
    resetOpponents,
    resetMultiplayerState,
    savePlayerName,
    getOpponents
  } = multiplayerState;

  // Setup URL navigation
  useURLNavigation({
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
    socketService
  });

  // Setup keyboard controls
  useKeyboardControls({
    playing,
    gameOver,
    multiplayerGameEnded,
    paused,
    lockInput,
    pendingNewPiece,
    shape,
    pile,
    pos,
    setPos,
    setShape,
    setPaused,
    isMultiplayer,
    currentPlayerId,
    socketService
  });
  
  const handleValidateUsername = () => {
    const validation = validateUsername(username, userList);
    
    if (validation.isValid) {
      setUserList(prev => [...prev, username.trim()]);
      const playerName = username.trim();
      setCurrentPlayerName(playerName); // Save current player name
      // Save username to localStorage
      saveToLocalStorage(STORAGE_KEYS.LAST_USERNAME, playerName);
      setUsername('');
      
      // Automatically create the room after adding the first player
      // Ne pas définir currentRoomId ici - attendre la réponse du serveur
      setIsRoomLeader(true); // Creator is automatically the leader
      setJoinError(''); // Clear any previous errors
      socketService.joinRoom(createRoomId, playerName, true); // true = isCreator
    } else {
      setJoinError(validation.error);
    }
  };

  // Connect to server on component mount
  useEffect(() => {
    socketService.connect();
    
    return () => {
      socketService.removeAllListeners();
      socketService.disconnect();
    };
  }, []);

  // Prevent scrolling on the main page
  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, []);

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
      
      // Find current player using helper function
      const foundCurrentPlayer = findCurrentPlayer(players, currentPlayerName, joinUsername, username, userList);
      
      // Initialize opponents' scores from room join data (excluding current player)
      const initialOpponentsScores = initializeOpponentsScores(players, foundCurrentPlayer?.id);
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
      const resetOpponentsScores = resetOpponentsData(opponentsScores, 0);
      setOpponentsScores(resetOpponentsScores);
      console.log('🔄 Reset opponents scores for new game:', resetOpponentsScores);
      
      // Reset opponents' spectrums to empty for new game
      const resetOpponentsSpectrums = resetOpponentsData(opponentsSpectrums, Array(10).fill(0));
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
    saveToLocalStorage(STORAGE_KEYS.LAST_USERNAME, playerName);
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

  // Quit game function
  const handleQuitGame = () => {
    // Trigger game over state to show end game popup
    setGameOver(true);
    setPlaying(false);
    setPaused(false);
  };

  // Descente automatique de la pièce et fixation
  useEffect(() => {
    if (!playing || gameOver || multiplayerGameEnded || paused) return;
    let interval;
    if (selectedMode === GAME_MODES.GRAVITY) {
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
    if (selectedMode === GAME_MODES.GRAVITY && playing) {
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
    if (selectedMode === GAME_MODES.GRAVITY && playing && gravityDrop) {
      dropPieceToBottom();
    }
    // eslint-disable-next-line
  }, [gravityDrop]);

  // Gravity+ mode: after each new piece appears, after 2s it drops rapidly
  useEffect(() => {
    if (selectedMode === GAME_MODES.GRAVITY && playing) {
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
            if (selectedMode === GAME_MODES.GRAVITY) {
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
              if (selectedMode === GAME_MODES.GRAVITY) {
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
                if (selectedMode === GAME_MODES.GRAVITY) {
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

  // Function de démarrage
  const handlePlay = () => {
    setInLobby(false);
    resetGameState();
  };

  // Board rendering with mode logic
  // Invisible mode: piece is invisible for 2s after every vertical move (including spawn)
  useEffect(() => {
    if (selectedMode === GAME_MODES.INVISIBLE && playing) {
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
  }, [pos.y, selectedMode, playing, lastY, setInvisibleFlash, setLastY]);

  const getDisplayBoard = () => {
    if (selectedMode === GAME_MODES.INVISIBLE && playing) {
      if (invisibleFlash) {
        return boardWithPiece;
      }
      return pile;
    }
    return boardWithPiece;
  };

  // Modal handlers
  const handleCreateRoomClose = () => {
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
  };

  const handleJoinRoomClose = () => {
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
  };

  const handleGameOverReplay = () => {
    // Save score and stats before resetting
    if (score > 0 || lines > 0) {
      updateHighScores(score);
      updateGameStats(score, lines, isMultiplayer, false);
    }
    resetGameState();
  };

  const handleGameOverGoToLobby = () => {
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
  };

  const handleGameOverRematch = () => {
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
  };

  const handleMultiplayerGoToLobby = () => {
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
  };

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
          {/* Panneau à gauche : Score + Next */}
          <GameHUD
            score={score}
            lines={lines}
            nextType={nextType}
            playing={playing}
            paused={paused}
            isMultiplayer={isMultiplayer}
            currentPlayerId={currentPlayerId}
            onTogglePause={togglePause}
            onQuit={handleQuitGame}
            updateHighScores={updateHighScores}
            updateGameStats={updateGameStats}
            socketService={socketService}
          />
          {/* Main Panel avec le jeu au centre */}
          <GameBoard
            playing={playing}
            displayBoard={getDisplayBoard()}
            onPlay={() => setPlaying(true)}
            onCreateRoom={() => setShowCreateRoomModal(true)}
            onJoinRoom={() => setShowJoinRoomModal(true)}
            highScores={highScores}
            selectedMode={selectedMode}
            onModeChange={handleModeChange}
          />
          
          
          {/* Opponents Panel à droite - toujours visible */}
          <div style={{margin: 24, zIndex: 2}}>
            {isMultiplayer && playing && opponents.length > 0 ? (
              <OpponentsList 
                opponents={opponents} 
                opponentsSpectrums={opponentsSpectrums}
                opponentsScores={opponentsScores}
                eliminatedPlayers={eliminatedPlayers}
              />
            ) : (
              /* Panneau opponents vide avec message approprié */
              <div style={{
                width: 160,
                minHeight: 200,
                background: '#222',
                borderRadius: 18,
                boxShadow: '0 2px 12px #0008',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20,
                textAlign: 'center'
              }}>
                <div style={{fontWeight: 'bold', fontSize: 22, marginBottom: 16, color: '#FFD700'}}>
                  OPPONENTS
                </div>
                
                {!playing ? (
                  /* Message pour le lobby */
                  <div style={{
                    color: '#999',
                    fontSize: 16,
                    lineHeight: '1.4',
                    fontStyle: 'italic'
                  }}>
                    🎮
                    <br /><br />
                    En attente d'une partie...
                    <br /><br />
                    Créez ou rejoignez une room pour jouer en multijoueur !
                  </div>
                ) : !isMultiplayer ? (
                  /* Message pour le mode solo */
                  <div style={{
                    color: '#666',
                    fontSize: 16,
                    lineHeight: '1.4',
                    fontStyle: 'italic'
                  }}>
                    🎯
                    <br /><br />
                    Mode Solo
                    <br /><br />
                    Pas d'adversaires
                    <br />
                    Battez votre record !
                  </div>
                ) : (
                  /* Message pour multijoueur sans opponents */
                  <div style={{
                    color: '#888',
                    fontSize: 16,
                    lineHeight: '1.4',
                    fontStyle: 'italic'
                  }}>
                    👥
                    <br /><br />
                    Multijoueur
                    <br /><br />
                    En attente d'autres joueurs...
                  </div>
                )}
              </div>
            )}
          </div>
          
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
          <CreateRoomModal
            isOpen={showCreateRoomModal}
            onClose={handleCreateRoomClose}
            createRoomId={createRoomId}
            username={username}
            setUsername={setUsername}
            currentRoomId={currentRoomId}
            isRoomLeader={isRoomLeader}
            roomPlayers={roomPlayers}
            onValidateUsername={handleValidateUsername}
            onStartGame={handleStartMultiplayerGame}
            onLeaveRoom={handleCreateRoomClose}
            joinError={joinError}
          />

          {/* Modal JOIN ROOM */}
          <JoinRoomModal
            isOpen={showJoinRoomModal}
            onClose={handleJoinRoomClose}
            waitingForRematch={waitingForRematch}
            joinRoomId={joinRoomId}
            setJoinRoomId={setJoinRoomId}
            joinUsername={joinUsername}
            setJoinUsername={setJoinUsername}
            joinError={joinError}
            currentRoomId={currentRoomId}
            isJoiningRoom={isJoiningRoom}
            roomPlayers={roomPlayers}
            isRoomLeader={isRoomLeader}
            onJoinRoom={handleJoinRoom}
            onStartGame={handleStartMultiplayerGame}
          />

          {/* Game Over Modals */}
          <GameOverModal
            gameOver={gameOver}
            multiplayerGameEnded={multiplayerGameEnded}
            gameWinner={gameWinner}
            currentPlayerId={currentPlayerId}
            score={score}
            isMultiplayer={isMultiplayer}
            onReplay={handleGameOverReplay}
            onGoToLobby={multiplayerGameEnded ? handleMultiplayerGoToLobby : handleGameOverGoToLobby}
            onRematch={handleGameOverRematch}
          />
        </div>
      ) : null}

    </div>
  );
}

export default App;


