import { useCallback, useEffect, useRef } from 'react';
import { movePiece, rotatePiece } from '../utils/gameLogic';

/**
 * Hook to manage keyboard controls for the game
 */
export const useKeyboardControls = ({
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
  socketAPI,
  dropPieceToBottom
}) => {
  // Key repeat state
  const repeatIntervals = useRef({});
  const heldKeys = useRef({});
  const repeatDelay = 150; // ms before repeat starts
  const repeatRate = 50; // ms between repeats

  // Helper to perform a move
  const doMove = useCallback((key) => {
    let move = null;
    if (key === 'ArrowLeft') {
      move = 'left';
      setPos(currentPos => {
        const { x } = movePiece(shape, 'left', pile, currentPos.x, currentPos.y);
        return { ...currentPos, x };
      });
    } else if (key === 'ArrowRight') {
      move = 'right';
      setPos(currentPos => {
        const { x } = movePiece(shape, 'right', pile, currentPos.x, currentPos.y);
        return { ...currentPos, x };
      });
    } else if (key === 'ArrowDown') {
      move = 'down';
      setPos(currentPos => {
        const { y } = movePiece(shape, 'down', pile, currentPos.x, currentPos.y);
        return { ...currentPos, y };
      });
    }
    if (isMultiplayer && currentPlayerId && move) {
      socketAPI.sendPlayerMove(currentPlayerId, move);
    }
  }, [setPos, shape, pile, isMultiplayer, currentPlayerId, socketAPI]);

  // Keydown handler with repeat logic
  const handleKeyDown = useCallback((e) => {
    if (gameOver || lockInput || pendingNewPiece || multiplayerGameEnded || paused) return;
    if (heldKeys.current[e.key]) return; // Only handle first keydown for this key
    heldKeys.current[e.key] = true;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      doMove(e.key);
      repeatIntervals.current[e.key] = setTimeout(() => {
        repeatIntervals.current[e.key] = setInterval(() => {
          doMove(e.key);
        }, repeatRate);
      }, repeatDelay);
    } else if (e.key === 'ArrowUp') {
      setShape(currentShape => rotatePiece(currentShape, pile, pos.x, pos.y));
      if (isMultiplayer && currentPlayerId) {
        socketAPI.sendPlayerMove(currentPlayerId, 'rotate');
      }
    } else if (e.key === ' ') {
      if (typeof dropPieceToBottom === 'function') {
        dropPieceToBottom();
      }
      if (isMultiplayer && currentPlayerId) {
        socketAPI.sendPlayerMove(currentPlayerId, 'hardDrop');
      }
    } else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
      if (playing && !gameOver && !multiplayerGameEnded) {
        setPaused(prev => {
          const newPausedState = !prev;
          if (isMultiplayer && currentPlayerId) {
            socketAPI.sendPauseState(currentPlayerId, newPausedState);
          }
          return newPausedState;
        });
      }
    }
  }, [gameOver, lockInput, pendingNewPiece, multiplayerGameEnded, paused, doMove, setShape, pile, pos.x, pos.y, isMultiplayer, currentPlayerId, socketAPI, dropPieceToBottom, playing]);

  // Keyup handler to clear repeat
  const handleKeyUp = useCallback((e) => {
    heldKeys.current[e.key] = false;
    if (repeatIntervals.current[e.key]) {
      clearTimeout(repeatIntervals.current[e.key]);
      clearInterval(repeatIntervals.current[e.key]);
      repeatIntervals.current[e.key] = null;
    }
  }, []);

  // Setup keyboard event listeners
  useEffect(() => {
    if (!playing) return;
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      // Clear any remaining intervals
      Object.values(repeatIntervals.current).forEach(timer => {
        clearTimeout(timer);
        clearInterval(timer);
      });
      repeatIntervals.current = {};
      heldKeys.current = {};
    };
  }, [handleKeyDown, handleKeyUp, playing]);

  return {
    handleKeyDown,
    handleKeyUp
  };
};
