import chai from 'chai';
import Player from '../src/server/models/Player.js';
import Game from '../src/server/models/Game.js';
import Piece from '../src/server/models/Piece.js';

const expect = chai.expect;

describe('Server Models', () => {
  
  describe('Player Model', () => {
    it('should create a player with required properties', () => {
      const player = new Player({
        id: 'player1',
        name: 'Alice',
        socketId: 'socket123'
      });
      
      expect(player.id).to.equal('player1');
      expect(player.name).to.equal('Alice');
      expect(player.socketId).to.equal('socket123');
      expect(player.gameId).to.be.null;
      expect(player.isLeader).to.be.false;
      expect(player.isAlive).to.be.true;
      expect(player.isPaused).to.be.false;
      expect(player.board).to.be.an('array').with.lengthOf(20);
      expect(player.board[0]).to.be.an('array').with.lengthOf(10);
      expect(player.spectrum).to.be.an('array').with.lengthOf(10);
      expect(player.score).to.equal(0);
      // Removed piece-related properties - now handled client-side
    });

    it('should create a player with optional properties', () => {
      const customBoard = Array(20).fill().map(() => Array(10).fill(1));
      const customSpectrum = Array(10).fill(5);
      
      const player = new Player({
        id: 'player2',
        name: 'Bob',
        socketId: 'socket456',
        gameId: 'game123',
        isLeader: true,
        board: customBoard,
        spectrum: customSpectrum,
        isAlive: false,
        isPaused: true
      });
      
      expect(player.gameId).to.equal('game123');
      expect(player.isLeader).to.be.true;
      expect(player.board).to.deep.equal(customBoard);
      expect(player.spectrum).to.deep.equal(customSpectrum);
      expect(player.isAlive).to.be.false;
      expect(player.isPaused).to.be.true;
    });

    it('should throw error for missing required properties', () => {
      expect(() => new Player({ id: 'player1', name: 'Alice' })).to.throw('Player requires id, name, and socketId');
      expect(() => new Player({ id: 'player1', socketId: 'socket123' })).to.throw('Player requires id, name, and socketId');
      expect(() => new Player({ name: 'Alice', socketId: 'socket123' })).to.throw('Player requires id, name, and socketId');
      expect(() => new Player({})).to.throw('Player requires id, name, and socketId');
    });

    it('should update spectrum correctly', () => {
      const player = new Player({
        id: 'player1',
        name: 'Alice',
        socketId: 'socket123'
      });
      
      const newSpectrum = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      player.updateSpectrum(newSpectrum);
      expect(player.spectrum).to.deep.equal(newSpectrum);
    });

    it('should throw error for invalid spectrum', () => {
      const player = new Player({
        id: 'player1',
        name: 'Alice',
        socketId: 'socket123'
      });
      
      expect(() => player.updateSpectrum([1, 2, 3])).to.throw('Spectrum must be an array of 10 numbers');
      expect(() => player.updateSpectrum('invalid')).to.throw('Spectrum must be an array of 10 numbers');
      expect(() => player.updateSpectrum(null)).to.throw('Spectrum must be an array of 10 numbers');
    });

    it('should set leader status', () => {
      const player = new Player({
        id: 'player1',
        name: 'Alice',
        socketId: 'socket123'
      });
      
      player.setLeader(true);
      expect(player.isLeader).to.be.true;
      
      player.setLeader(false);
      expect(player.isLeader).to.be.false;
      
      player.setLeader('truthy');
      expect(player.isLeader).to.be.true;
      
      player.setLeader(0);
      expect(player.isLeader).to.be.false;
    });

    it('should set alive status', () => {
      const player = new Player({
        id: 'player1',
        name: 'Alice',
        socketId: 'socket123'
      });
      
      player.setAlive(false);
      expect(player.isAlive).to.be.false;
      
      player.setAlive(true);
      expect(player.isAlive).to.be.true;
    });

    it('should set paused status', () => {
      const player = new Player({
        id: 'player1',
        name: 'Alice',
        socketId: 'socket123'
      });
      
      player.setPaused(true);
      expect(player.isPaused).to.be.true;
      
      player.setPaused(false);
      expect(player.isPaused).to.be.false;
    });

    it('should set score', () => {
      const player = new Player({
        id: 'player1',
        name: 'Alice',
        socketId: 'socket123'
      });
      
      player.setScore(1000);
      expect(player.score).to.equal(1000);
      
      player.setScore(null);
      expect(player.score).to.equal(0);
      
      player.setScore(undefined);
      expect(player.score).to.equal(0);
    });

    // Removed: Piece index management tests - now handled client-side

    // Removed: Set current and next pieces tests - now handled client-side

    // Removed: Advance pieces tests - now handled client-side

    // Removed: Advance past sequence end tests - now handled client-side

    // Removed: Initialize pieces tests - now handled client-side

    // Removed: Empty sequence initialization tests - now handled client-side

    // Removed: Single piece sequence initialization tests - now handled client-side
  });

  describe('Game Model', () => {
    it('should create a game with required properties', () => {
      const game = new Game({ id: 'game123' });
      
      expect(game.id).to.equal('game123');
      expect(game.players).to.be.an('array').with.lengthOf(0);
      expect(game.status).to.equal('waiting');
      expect(game.winner).to.be.null;
      expect(game.roomId).to.be.null;
      // Removed piece sequence properties - now handled client-side
    });

    it('should create a game with optional properties', () => {
      const players = [{ id: 'player1' }, { id: 'player2' }];
      const pieceSequence = ['I', 'O', 'T'];
      
      const game = new Game({
        id: 'game123',
        players: players,
        status: 'playing',
        pieceSequence: pieceSequence,
        currentPieceIndex: 1
      });
      
      expect(game.players).to.deep.equal(players);
      expect(game.status).to.equal('playing');
      expect(game.pieceSequence).to.deep.equal(pieceSequence);
      expect(game.currentPieceIndex).to.equal(1);
    });

    it('should throw error for missing id', () => {
      expect(() => new Game({})).to.throw('Game requires an id');
      expect(() => new Game({ id: null })).to.throw('Game requires an id');
      expect(() => new Game({ id: '' })).to.throw('Game requires an id');
    });

    it('should add players correctly', () => {
      const game = new Game({ id: 'game123' });
      const player1 = { id: 'player1', name: 'Alice' };
      const player2 = { id: 'player2', name: 'Bob' };
      
      game.addPlayer(player1);
      expect(game.players).to.have.lengthOf(1);
      expect(game.players[0]).to.deep.equal(player1);
      
      game.addPlayer(player2);
      expect(game.players).to.have.lengthOf(2);
      expect(game.players[1]).to.deep.equal(player2);
    });

    it('should throw error for invalid player', () => {
      const game = new Game({ id: 'game123' });
      
      expect(() => game.addPlayer(null)).to.throw('addPlayer requires a valid Player instance');
      expect(() => game.addPlayer('invalid')).to.throw('addPlayer requires a valid Player instance');
      expect(() => game.addPlayer({})).to.throw('addPlayer requires a valid Player instance');
      expect(() => game.addPlayer({ name: 'Alice' })).to.throw('addPlayer requires a valid Player instance');
    });

    it('should remove players correctly', () => {
      const game = new Game({ id: 'game123' });
      const player1 = { id: 'player1', name: 'Alice' };
      const player2 = { id: 'player2', name: 'Bob' };
      
      game.addPlayer(player1);
      game.addPlayer(player2);
      expect(game.players).to.have.lengthOf(2);
      
      game.removePlayer('player1');
      expect(game.players).to.have.lengthOf(1);
      expect(game.players[0]).to.deep.equal(player2);
      
      game.removePlayer('nonexistent');
      expect(game.players).to.have.lengthOf(1);
      
      game.removePlayer('player2');
      expect(game.players).to.have.lengthOf(0);
    });

    it('should start game without initial pieces', () => {
      const game = new Game({ id: 'game123' });
      const player1 = new Player({ id: 'player1', name: 'Alice', socketId: 'socket1' });
      game.addPlayer(player1);
      
      // Mock the piece generator to avoid circular dependencies
      const originalRequire = require;
      require = function(moduleName) {
        if (moduleName === '../utils/pieceGenerator.js') {
          return { generatePieceBatch: () => Array(50).fill('I') }; // Return 50 pieces as expected
        }
        return originalRequire.apply(this, arguments);
      };
      
      game.startGame('room123');
      
      expect(game.status).to.equal('playing');
      expect(game.roomId).to.equal('room123');
      expect(game.winner).to.be.null;
      expect(game.sharedSeed).to.be.a('number'); // Now uses shared seed instead of piece sequence
      
      // Restore require
      require = originalRequire;
    });

    it('should start game with shared seed', () => {
      const game = new Game({ id: 'game123' });
      const player1 = new Player({ id: 'player1', name: 'Alice', socketId: 'socket1' });
      game.addPlayer(player1);
      
      const sharedSeed = 12345;
      game.startGame('room123', sharedSeed);
      
      expect(game.status).to.equal('playing');
      expect(game.roomId).to.equal('room123');
      expect(game.sharedSeed).to.equal(sharedSeed);
      // Removed player piece expectations - now handled client-side
    });

    it('should get alive players', () => {
      const game = new Game({ id: 'game123' });
      const player1 = new Player({ id: 'player1', name: 'Alice', socketId: 'socket1' });
      const player2 = new Player({ id: 'player2', name: 'Bob', socketId: 'socket2' });
      const player3 = new Player({ id: 'player3', name: 'Charlie', socketId: 'socket3' });
      
      player2.setAlive(false);
      
      game.addPlayer(player1);
      game.addPlayer(player2);
      game.addPlayer(player3);
      
      const alivePlayers = game.getAlivePlayers();
      expect(alivePlayers).to.have.lengthOf(2);
      expect(alivePlayers[0].id).to.equal('player1');
      expect(alivePlayers[1].id).to.equal('player3');
    });

    it('should set winner correctly', () => {
      const game = new Game({ id: 'game123' });
      const player1 = new Player({ id: 'player1', name: 'Alice', socketId: 'socket1' });
      game.addPlayer(player1);
      
      game.setWinner('player1');
      expect(game.status).to.equal('ended');
      expect(game.winner).to.equal('player1');
    });

    it('should throw error for invalid winner', () => {
      const game = new Game({ id: 'game123' });
      const player1 = new Player({ id: 'player1', name: 'Alice', socketId: 'socket1' });
      game.addPlayer(player1);
      
      expect(() => game.setWinner('nonexistent')).to.throw('Winner must be a valid player in the game');
    });

    // Removed: Get current piece for player tests - now handled client-side

    // Removed: Get next piece for player tests - now handled client-side

    it('should handle legacy getCurrentPiece method', () => {
      const game = new Game({ id: 'game123' });
      game.pieceSequence = ['I', 'O', 'T'];
      
      // Test when no piece has been distributed yet
      game.currentPieceIndex = 0;
      expect(game.getCurrentPiece()).to.equal('I');
      
      // Test after pieces have been distributed
      game.currentPieceIndex = 2;
      expect(game.getCurrentPiece()).to.equal('O');
      
      // Test edge cases
      game.currentPieceIndex = 4;
      expect(game.getCurrentPiece()).to.be.null;
    });

    it('should handle legacy getNextPiece method', () => {
      const game = new Game({ id: 'game123' });
      game.pieceSequence = ['I', 'O', 'T'];
      
      game.currentPieceIndex = 0;
      expect(game.getNextPiece()).to.equal('I');
      
      game.currentPieceIndex = 2;
      expect(game.getNextPiece()).to.equal('T');
      
      game.currentPieceIndex = 3;
      expect(game.getNextPiece()).to.be.null;
    });

    it('should get piece at specific index', () => {
      const game = new Game({ id: 'game123' });
      game.pieceSequence = ['I', 'O', 'T', 'S'];
      
      expect(game.getPieceAt(0)).to.equal('I');
      expect(game.getPieceAt(2)).to.equal('T');
      expect(game.getPieceAt(3)).to.equal('S');
      expect(game.getPieceAt(4)).to.be.null;
      expect(game.getPieceAt(-1)).to.be.null;
    });

    it('should handle legacy distributeNextPiece method', () => {
      const game = new Game({ id: 'game123' });
      game.pieceSequence = ['I', 'O', 'T'];
      game.currentPieceIndex = 0;
      
      const piece1 = game.distributeNextPiece();
      expect(piece1).to.equal('I');
      expect(game.currentPieceIndex).to.equal(1);
      
      const piece2 = game.distributeNextPiece();
      expect(piece2).to.equal('O');
      expect(game.currentPieceIndex).to.equal(2);
      
      const piece3 = game.distributeNextPiece();
      expect(piece3).to.equal('T');
      expect(game.currentPieceIndex).to.equal(3);
      
      const piece4 = game.distributeNextPiece();
      expect(piece4).to.be.null;
    });
  });

  describe('Piece Model', () => {
    it('should create a piece with required properties', () => {
      const piece = new Piece({ type: 'I', position: [0, 4] });
      
      expect(piece.type).to.equal('I');
      expect(piece.position).to.deep.equal([0, 4]);
      expect(piece.rotation).to.equal(0);
    });

    it('should create a piece with optional properties', () => {
      const piece = new Piece({ 
        type: 'T', 
        position: [5, 3], 
        rotation: 2 
      });
      
      expect(piece.type).to.equal('T');
      expect(piece.position).to.deep.equal([5, 3]);
      expect(piece.rotation).to.equal(2);
    });

    it('should throw error for missing required properties', () => {
      expect(() => new Piece({ position: [0, 4] })).to.throw('Piece requires a type');
      expect(() => new Piece({})).to.throw('Piece requires a type');
    });

    it('should validate piece type', () => {
      // Our implementation accepts any truthy type but rejects falsy values
      const piece1 = new Piece({ type: 'X', position: [0, 4] });
      expect(piece1.type).to.equal('X');
      
      // These should throw errors since our implementation rejects falsy types
      expect(() => new Piece({ type: '', position: [0, 4] })).to.throw('Piece requires a type');
      expect(() => new Piece({ type: null, position: [0, 4] })).to.throw('Piece requires a type');
      expect(() => new Piece({ type: undefined, position: [0, 4] })).to.throw('Piece requires a type');
    });

    it('should set position correctly', () => {
      const piece = new Piece({ type: 'I', position: [0, 4] });
      
      piece.setPosition([2, 1]);
      expect(piece.position).to.deep.equal([2, 1]);
      
      expect(() => piece.setPosition([1, 2, 3])).to.throw('Position must be an array of [row, col]');
      expect(() => piece.setPosition('invalid')).to.throw('Position must be an array of [row, col]');
    });

    it('should rotate piece correctly', () => {
      const piece = new Piece({ type: 'T', position: [0, 4] });
      
      piece.rotate();
      expect(piece.rotation).to.equal(1);
      
      piece.rotate();
      expect(piece.rotation).to.equal(2);
      
      piece.rotate();
      expect(piece.rotation).to.equal(3);
      
      piece.rotate();
      expect(piece.rotation).to.equal(0);
    });

    it('should set rotation correctly', () => {
      const piece = new Piece({ type: 'O', position: [3, 5] });
      
      piece.setRotation(2);
      expect(piece.rotation).to.equal(2);
      
      expect(() => piece.setRotation(4)).to.throw('Rotation must be a number between 0 and 3');
      expect(() => piece.setRotation(-1)).to.throw('Rotation must be a number between 0 and 3');
    });
  });
});
