import { useState, useMemo, useRef } from 'react';
import { getTetromino } from '../utils/tetrominos';
import { 
  createPieceSequence, 
  getNextPiece, 
  createEmptyBoard 
} from '../utils/gameLogic';
import { 
  SEQUENCE_LENGTH, 
  SEED, 
  COLS,
  STORAGE_KEYS,
  DEFAULT_VALUES 
} from '../utils/gameConstants';
import { getFromLocalStorage, saveToLocalStorage } from '../services/localStorageService';

/**
 * Hook to manage core game state (board, pieces, score, etc.)
 */
export const useGameState = () => {
  // Generate a piece sequence at game start
  const pieceSequence = useMemo(() => createPieceSequence(SEQUENCE_LENGTH, SEED), []);
  
  // Create empty board
  const emptyBoard = useMemo(() => createEmptyBoard(), []);
  
  // Piece state
  const [pieceIndex, setPieceIndex] = useState(0);
  const [currentType, setCurrentType] = useState(getNextPiece(pieceSequence, 0));
  const [nextType, setNextType] = useState(getNextPiece(pieceSequence, 1));
  const [shape, setShape] = useState(getTetromino(currentType).shape);
  
  // Calculate initial position
  const startX = Math.floor((COLS - shape[0].length) / 2);
  
  // Board and position state
  const [pile, setPile] = useState(emptyBoard);
  const [pos, setPos] = useState({ x: startX, y: 0 });
  
  // Game control state
  const [lockInput, setLockInput] = useState(false);
  const [pendingNewPiece, setPendingNewPiece] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [inLobby, setInLobby] = useState(true);
  
  // Game metrics
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  
  // Game mode and settings
  const [selectedMode, setSelectedMode] = useState(
    getFromLocalStorage(STORAGE_KEYS.SELECTED_MODE, DEFAULT_VALUES.SELECTED_MODE)
  );
  
  // High scores and stats
  const [highScores, setHighScores] = useState(
    getFromLocalStorage(STORAGE_KEYS.HIGH_SCORES, DEFAULT_VALUES.HIGH_SCORES)
  );
  const [gameStats, setGameStats] = useState(
    getFromLocalStorage(STORAGE_KEYS.GAME_STATS, DEFAULT_VALUES.GAME_STATS)
  );
  
  // Gravity mode specific state
  const [gravityDrop, setGravityDrop] = useState(false);
  const gravityTimeoutRef = useRef();
  
  // Invisible mode specific state
  const [invisibleFlash, setInvisibleFlash] = useState(false);
  const [lastY, setLastY] = useState(0);
  
  // Function to update high scores
  const updateHighScores = (newScore) => {
    if (newScore > 0) {
      const updatedScores = [...highScores, newScore]
        .sort((a, b) => b - a)
        .slice(0, 5); // Keep only top 5 scores
      setHighScores(updatedScores);
      saveToLocalStorage(STORAGE_KEYS.HIGH_SCORES, updatedScores);
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
    saveToLocalStorage(STORAGE_KEYS.GAME_STATS, newStats);
  };

  // Function to save selected mode
  const handleModeChange = (mode) => {
    setSelectedMode(mode);
    saveToLocalStorage(STORAGE_KEYS.SELECTED_MODE, mode);
  };

  // Reset game state
  const resetGameState = () => {
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
    setPaused(false);
    setGravityDrop(false);
    setInvisibleFlash(false);
    setLastY(0);
    
    // Clear gravity timeout
    if (gravityTimeoutRef.current) {
      clearTimeout(gravityTimeoutRef.current);
    }
  };

  return {
    // State
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
    
    // Setters
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
    setSelectedMode,
    setHighScores,
    setGameStats,
    setGravityDrop,
    setInvisibleFlash,
    setLastY,
    
    // Functions
    updateHighScores,
    updateGameStats,
    handleModeChange,
    resetGameState
  };
};
