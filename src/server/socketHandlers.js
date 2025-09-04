import debug from 'debug';
import { v4 as uuidv4 } from 'uuid';
import Room from './models/Room.js';
import Game from './models/Game.js';
import Player from './models/Player.js';
import { generatePieceBatch } from './utils/pieceGenerator.js';

const loginfo = debug('tetris:info');

// In-memory stores
const rooms = new Map(); // roomId -> Room
const games = new Map(); // gameId -> Game
const players = new Map(); // playerId -> Player

export default function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    loginfo('Socket connected: ' + socket.id);

    socket.on('join-room', ({ roomId, playerName, isCreator }) => {
      if (!roomId || !playerName) return;
      
      loginfo(`Player ${playerName} attempting to join room ${roomId} (isCreator: ${isCreator})`);
      
      let room = rooms.get(roomId);
      
      // If isCreator is true, room should not exist yet
      if (isCreator && room) {
        socket.emit('join-error', { message: 'Room already exists. Please choose a different room ID.' });
        return;
      }
      
      // If not creator and room doesn't exist, it's an error
      if (!isCreator && !room) {
        socket.emit('join-error', { message: 'Room does not exist. Please check the room ID.' });
        return;
      }
      
      if (room) {
        // Prevent joining if game is in progress
        if (room.game && room.game.status === 'playing') {
          socket.emit('join-error', { message: 'Game already in progress. Please wait for the next round.' });
          return;
        }
        // Prevent joining if room is full
        if (room.isFull()) {
          socket.emit('join-error', { message: 'Room is full. Please join another room.' });
          return;
        }
        // Check if player name already exists in room
        if (room.players.some(p => p.name === playerName)) {
          socket.emit('join-error', { message: 'Player name already taken in this room.' });
          return;
        }
      }
      
      if (!room) {
        // Create new room and game (only if isCreator)
        const gameId = uuidv4();
        const game = new Game({ id: gameId });
        games.set(gameId, game);
        room = new Room({ id: roomId, name: roomId, game });
        rooms.set(roomId, room);
        loginfo(`Created new room ${roomId}`);
      }
      
      // Join socket.io room FIRST
      socket.join(roomId);
      
      // Create player
      const playerId = uuidv4();
      const isLeader = room.players.length === 0; // If first player, they are leader
      const player = new Player({ id: playerId, name: playerName, socketId: socket.id, gameId: room.game.id, isLeader });
      players.set(playerId, player);
      room.addPlayer(player);
      
      // Add player to the game as well
      room.game.addPlayer(player);
      
      // Attach roomId and playerId to socket for later reference
      socket.data.roomId = roomId;
      socket.data.playerId = playerId;
      
      // Broadcast updated room state to ALL players in the room (including the new one)
      const playerList = room.players.map(p => ({ 
        id: p.id, 
        name: p.name, 
        isLeader: p.isLeader,
        score: p.score || 0
      }));
      io.to(roomId).emit('room-joined', { game: { id: room.game.id, status: room.game.status }, players: playerList });
      
      loginfo(`Player ${playerName} joined room ${roomId} successfully`);
    });

    socket.on('start-game', ({ gameId }) => {
      // Only leader can start the game
      const playerId = socket.data.playerId;
      const roomId = socket.data.roomId;
      if (!playerId || !roomId) return;
      const room = rooms.get(roomId);
      if (!room) return;
      const player = players.get(playerId);
      if (!player || room.leaderId !== playerId) return; // Only leader
      const game = room.game;
      if (!game) return;
      
      // Generate shared seed for deterministic piece sequence across all clients
      const sharedSeed = Math.floor(Math.random() * 1000000);
      console.log(`🎲 Generated shared seed ${sharedSeed} for room ${roomId}`);
      
      game.startGame(roomId, sharedSeed);
      // Set all players to alive, reset their scores, boards, spectrums, and pause state
      room.players.forEach(p => {
        p.setAlive(true);
        p.setPaused(false); // Reset pause state for new game
        p.score = 0; // Reset score for new game
        p.board = Array.from({ length: 20 }, () => Array(10).fill(0)); // Reset board to empty
        p.spectrum = Array(10).fill(0); // Reset spectrum to empty
      });
      
      // Send shared seed to all players for synchronized piece generation
      io.to(roomId).emit('game-started', { 
        gameId: game.id, 
        sharedSeed: sharedSeed
      });
      
      // Broadcast score reset to all players
      room.players.forEach(player => {
        io.to(roomId).emit('player-score-updated', { 
          playerId: player.id, 
          score: 0 
        });
      });
      
      // Broadcast board and spectrum reset to all players
      room.players.forEach(player => {
        io.to(roomId).emit('player-board-updated', { 
          playerId: player.id, 
          board: player.board,
          spectrum: player.spectrum,
          score: 0
        });
      });
      
      loginfo(`Game ${game.id} started in room ${roomId} with shared seed ${sharedSeed} for client-side piece generation`);
    });

    socket.on('player-move', ({ playerId, move }) => {
      // Broadcast move to other players in the room
      const roomId = socket.data.roomId;
      if (!roomId) return;
      socket.to(roomId).emit('player-move', { playerId, move });
      loginfo(`Player ${playerId} move: ${move} in room ${roomId}`);
    });

    socket.on('piece-placed', ({ playerId, piece, newBoard }) => {
      // Update player's board and synchronize pieces
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const room = rooms.get(roomId);
      if (!room) return;
      const player = players.get(playerId);
      if (!player) return;
      
      player.board = newBoard;
      
      // Update spectrum for this player
      player.spectrum = generateSpectrum(newBoard);
      
      // Broadcast updated board and spectrum
      io.to(roomId).emit('player-board-updated', { 
        playerId, 
        board: newBoard, 
        spectrum: player.spectrum,
        score: player.score || 0
      });
      
      // console.log(`📡 Broadcasting spectrum for player ${playerId} (piece placed):`, player.spectrum);
      
      loginfo(`Player ${playerId} placed piece ${piece} in room ${roomId}`);
    });

    // 🕰️ REMOVED: Request next piece - clients now handle piece generation locally

    socket.on('lines-cleared', ({ playerId, linesCleared, newBoard, newScore }) => {
      // Update player's board and spectrum
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const room = rooms.get(roomId);
      if (!room) return;
      const player = players.get(playerId);
      if (!player) return;
      
      // Update player's board, spectrum, and score
      player.board = newBoard;
      player.spectrum = generateSpectrum(newBoard);
      if (newScore !== undefined) {
        player.score = newScore;
      }
      
      // Broadcast updated board, spectrum, and score to all players
      io.to(roomId).emit('player-board-updated', { 
        playerId, 
        board: newBoard, 
        spectrum: player.spectrum,
        score: player.score || 0
      });
      
      // console.log(`📡 Broadcasting spectrum for player ${playerId}:`, player.spectrum);
      
      // Also broadcast score update specifically
      if (newScore !== undefined) {
        io.to(roomId).emit('player-score-updated', { 
          playerId, 
          score: newScore 
        });
      }
      
      // Distribute penalty lines to other players if more than 1 line cleared
      if (linesCleared > 1) {
        const penalty = linesCleared - 1;
        room.players.forEach(p => {
          if (p.id !== playerId && p.isAlive) {
            io.to(p.socketId).emit('penalty-lines', { playerId: p.id, count: penalty });
          }
        });
      }
      loginfo(`Player ${playerId} cleared ${linesCleared} lines, sent ${linesCleared > 1 ? linesCleared - 1 : 0} penalty lines to others`);
    });

    socket.on('board-update', ({ playerId, board }) => {
      // Update player's board and broadcast spectrum
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const room = rooms.get(roomId);
      if (!room) return;
      const player = players.get(playerId);
      if (!player) return;
      
      // Update player's board and spectrum
      player.board = board;
      player.spectrum = generateSpectrum(board);
      
      // Broadcast updated spectrum to all players
      io.to(roomId).emit('player-board-updated', { 
        playerId, 
        board: board, 
        spectrum: player.spectrum,
        score: player.score || 0
      });
      
      // console.log(`📡 Broadcasting spectrum for player ${playerId} (board update):`, player.spectrum);
      
      loginfo(`Player ${playerId} updated board in room ${roomId}`);
    });

    // Handle score updates from clients
    socket.on('score-update', ({ playerId, score }) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const room = rooms.get(roomId);
      if (!room) return;
      const player = players.get(playerId);
      if (!player) return;
      
      // Update player's score
      player.score = score;
      
      // Broadcast score update to all other players in the room
      io.to(roomId).emit('player-score-updated', { 
        playerId, 
        score: player.score 
      });
      
      loginfo(`Player ${playerId} score updated to ${score} in room ${roomId}`);
    });

    // Handle pause state updates from clients
    socket.on('pause-state', ({ playerId, isPaused }) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const room = rooms.get(roomId);
      if (!room) return;
      const player = players.get(playerId);
      if (!player) return;
      
      // Update player's pause state
      player.setPaused(isPaused);
      
      loginfo(`Player ${playerId} ${isPaused ? 'paused' : 'unpaused'} in room ${roomId}`);
      
      // Check if we need to end the game due to all active players being eliminated
      checkGameEndConditions(room, io, roomId);
    });

    // Handle player ready for rematch
    socket.on('player-ready-rematch', ({ playerId }) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const room = rooms.get(roomId);
      if (!room) return;
      const player = players.get(playerId);
      if (!player) return;
      const game = room.game;
      if (!game) return;
      
      // Reset game status to allow new game
      game.status = 'waiting';
      
      // Reset player states for rematch
      player.setAlive(true);
      player.setPaused(false);
      player.score = 0;
      player.board = Array.from({ length: 20 }, () => Array(10).fill(0));
      player.spectrum = Array(10).fill(0);
      
      loginfo(`Player ${player.name} is ready for rematch in room ${roomId}`);
      
      // Broadcast updated room state to all players
      const playerList = room.players.map(p => ({ 
        id: p.id, 
        name: p.name, 
        isLeader: p.isLeader,
        score: p.score || 0
      }));
      io.to(roomId).emit('room-joined', { game: { id: room.game.id, status: room.game.status }, players: playerList });
    });

    // Handle player leaving room (going to lobby)
    socket.on('leave-room', ({ playerId }) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const room = rooms.get(roomId);
      if (!room) return;
      const player = players.get(playerId);
      if (!player) return;
      
      loginfo(`Player ${player.name} is leaving room ${roomId} to go to lobby`);
      
      // Check if this player was the leader before removing
      const wasLeader = player.isLeader;
      
      // Remove player from socket.io room
      socket.leave(roomId);
      
      // Remove player from room and game (Room.removePlayer handles leaderId automatically)
      room.removePlayer(playerId);
      if (room.game) {
        room.game.removePlayer(playerId);
      }
      players.delete(playerId);
      
      // Clear socket data
      socket.data.roomId = null;
      socket.data.playerId = null;
      
      // Notify remaining players about player leaving
      io.to(roomId).emit('player-disconnected', { playerId });
      
      // Update Player instances' isLeader property to match the new leaderId
      if (room.players.length > 0) {
        room.players.forEach(p => p.setLeader(p.id === room.leaderId));
        
        if (wasLeader) {
          loginfo(`Leadership transferred to ${room.players.find(p => p.id === room.leaderId)?.name} in room ${roomId}`);
        }
      }
      
      // Always emit latest player list and game state after a player leaves
      if (!room.isEmpty()) {
        const playerList = room.players.map(p => ({ 
          id: p.id, 
          name: p.name, 
          isLeader: p.isLeader,
          score: p.score || 0
        }));
        io.to(roomId).emit('room-joined', { game: { id: room.game.id, status: room.game.status }, players: playerList });
      }
      
      // If room is empty, clean up
      if (room.isEmpty()) {
        // Clean up game resources
        games.delete(room.game.id);
        rooms.delete(roomId);
        loginfo(`Room ${roomId} deleted - all players left`);
      }
      
      loginfo(`Player ${playerId} successfully left room ${roomId}`);
    });

    socket.on('game-over', ({ playerId }) => {
      // Mark player as eliminated, check for winner
      loginfo(`Received game-over event from player: ${playerId}`);
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const room = rooms.get(roomId);
      if (!room) return;
      const player = players.get(playerId);
      if (!player) return;
      
      // Mark player as eliminated
      player.setAlive(false);
      loginfo(`Player ${player.name} eliminated in room ${roomId}`);
      
      // Notify all players about elimination
      console.log('Emitting player-eliminated event to room:', roomId);
      io.to(roomId).emit('player-eliminated', { 
        playerId: player.id, 
        playerName: player.name,
        remainingPlayers: room.players.filter(p => p.isAlive).length
      });
      
      // Check game end conditions with new logic
      checkGameEndConditions(room, io, roomId);
    });

    socket.on('disconnect', () => {
      // Remove player from room, transfer leader, clean up if empty
      const playerId = socket.data.playerId;
      const roomId = socket.data.roomId;
      if (!playerId || !roomId) return;
      const room = rooms.get(roomId);
      if (!room) return;
      
      const player = players.get(playerId);
      const wasLeader = player ? player.isLeader : false;
      
      // Remove player from room and game (Room.removePlayer handles leaderId automatically)
      room.removePlayer(playerId);
      if (room.game) {
        room.game.removePlayer(playerId);
      }
      players.delete(playerId);
      io.to(roomId).emit('player-disconnected', { playerId });
      
      // Update Player instances' isLeader property to match the new leaderId
      if (room.players.length > 0) {
        room.players.forEach(p => p.setLeader(p.id === room.leaderId));
        
        if (wasLeader) {
          loginfo(`Leadership transferred to ${room.players.find(p => p.id === room.leaderId)?.name} in room ${roomId} after disconnect`);
        }
      }
      // Always emit latest player list and game state after a player leaves
      if (!room.isEmpty()) {
        const playerList = room.players.map(p => ({ 
          id: p.id, 
          name: p.name, 
          isLeader: p.isLeader,
          score: p.score || 0
        }));
        io.to(roomId).emit('room-joined', { game: { id: room.game.id, status: room.game.status }, players: playerList });
      }
      // If room is empty, clean up
      if (room.isEmpty()) {
        // Clean up game resources
        games.delete(room.game.id);
        rooms.delete(roomId);
      }
      loginfo(`Player ${playerId} disconnected from room ${roomId}`);
    });
  });
}

// Helper function for spectrum generation
function generateSpectrum(board) {
  // Returns an array of 10 numbers: for each column, the height of blocks (0 = empty, 20 = full)
  const spectrum = Array(10).fill(0);
  for (let col = 0; col < 10; col++) {
    // Find the topmost occupied cell and calculate height
    let height = 0;
    for (let row = 0; row < 20; row++) { // Start from top (row 0)
      if (board[row][col] !== 0) {
        height = 20 - row; // Height is 20 minus the topmost occupied row
        break; // Stop at the first occupied cell from the top
      }
    }
    spectrum[col] = height;
  }
  // console.log('🎯 Generated spectrum for board:', spectrum);
  return spectrum;
}

// Helper function to check game end conditions with new logic
function checkGameEndConditions(room, io, roomId) {
  const game = room.game;
  
  if (game.status === 'ended') {
    console.log('Game already ended, skipping');
    return; // Prevent duplicate game-ended events
  }
  
  const alivePlayers = room.players.filter(p => p.isAlive);
  const activePlayers = alivePlayers.filter(p => !p.isPaused); // Players who are alive and not paused
  const eliminatedPlayers = room.players.filter(p => !p.isAlive);
  
  console.log(`Alive players: ${alivePlayers.length}, Active players (not paused): ${activePlayers.length}, Eliminated players: ${eliminatedPlayers.length}`);
  console.log('Alive players:', alivePlayers.map(p => `${p.name} (paused: ${p.isPaused})`));
  
  // Only end the game if ALL players are eliminated OR only one player remains alive (regardless of pause state)
  if (alivePlayers.length === 0) {
    // All players eliminated - winner is determined by highest score
    const allPlayers = room.players.filter(p => p.score > 0);
    
    if (allPlayers.length === 0) {
      // No one scored, it's a draw
      game.status = 'ended';
      console.log('Game ended with no winner (draw - no scores)');
      io.to(roomId).emit('game-end', { 
        winnerId: null, 
        winnerName: null,
        gameResult: 'draw'
      });
      loginfo(`Game ended in room ${roomId} with no winner (draw)`);
      return;
    }
    
    // Find winner by highest score
    const winner = allPlayers.reduce((highest, current) => {
      return current.score > highest.score ? current : highest;
    }, allPlayers[0]);
    
    game.setWinner(winner.id);
    game.status = 'ended';
    
    console.log(`Game ended - all eliminated. Winner by highest score: ${winner.name} (${winner.score})`);
    
    io.to(roomId).emit('game-end', { 
      winnerId: winner.id, 
      winnerName: winner.name,
      gameResult: 'victory'
    });
    
    loginfo(`Game ended in room ${roomId}, winner by highest score: ${winner.name} (${winner.score})`);
    return;
  }
  
  // Only end the game if there's exactly one player alive (last man standing)
  if (alivePlayers.length === 1) {
    const winner = alivePlayers[0];
    game.setWinner(winner.id);
    game.status = 'ended';
    
    console.log(`Game ended with winner: ${winner.name} (last player alive)`);
    
    io.to(roomId).emit('game-end', { 
      winnerId: winner.id, 
      winnerName: winner.name,
      gameResult: 'victory'
    });
    
    loginfo(`Game ended in room ${roomId}, winner: ${winner.name} (last player alive)`);
    return;
  }
  
  // If there are multiple alive players but no active players (all paused), DON'T end the game
  // Let them continue when they unpause
  if (activePlayers.length === 0 && alivePlayers.length > 1) {
    console.log(`All ${alivePlayers.length} alive players are paused. Game continues...`);
    return; // Game continues, don't end it
  }
  
  // In all other cases, the game continues
  console.log(`Game continues: ${alivePlayers.length} alive, ${activePlayers.length} active`);
} 