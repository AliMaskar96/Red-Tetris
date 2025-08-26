import { useCallback, useEffect } from 'react';
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
  socketService
}) => {
  
  const handleKeyDown = useCallback((e) => {
    // Handle pause key (P or Escape) even when paused
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
      if (playing && !gameOver && !multiplayerGameEnded) {
        setPaused(prev => {
          const newPausedState = !prev;
          // Send pause state to server in multiplayer mode
          if (isMultiplayer && currentPlayerId) {
            socketService.sendPauseState(currentPlayerId, newPausedState);
          }
          return newPausedState;
        });
        return;
      }
    }
    
    if (gameOver || lockInput || pendingNewPiece || multiplayerGameEnded || paused || e.repeat) return;
    
    let move = null;
    
    if (e.key === 'ArrowLeft') {
      move = 'left';
      setPos(currentPos => {
        const { x, y } = movePiece(shape, 'left', pile, currentPos.x, currentPos.y);
        return { ...currentPos, x };
      });
    } else if (e.key === 'ArrowRight') {
      move = 'right';
      setPos(currentPos => {
        const { x, y } = movePiece(shape, 'right', pile, currentPos.x, currentPos.y);
        return { ...currentPos, x };
      });
    } else if (e.key === 'ArrowDown') {
      move = 'down';
      setPos(currentPos => {
        const { x, y } = movePiece(shape, 'down', pile, currentPos.x, currentPos.y);
        return { ...currentPos, y };
      });
    } else if (e.key === 'ArrowUp' || e.key === ' ') {
      move = 'rotate';
      setShape(currentShape => rotatePiece(currentShape, pile, pos.x, pos.y));
    }
    
    // Send move to server if in multiplayer
    if (isMultiplayer && currentPlayerId && move) {
      socketService.sendPlayerMove(currentPlayerId, move);
    }
  }, [
    playing,
    gameOver,
    multiplayerGameEnded,
    paused,
    lockInput,
    pendingNewPiece,
    shape,
    pile,
    pos.x,
    pos.y,
    setPos,
    setShape,
    setPaused,
    isMultiplayer,
    currentPlayerId,
    socketService
  ]);

  // Setup keyboard event listeners
  useEffect(() => {
    if (!playing) return;
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, playing]);

  return {
    handleKeyDown
  };
};
