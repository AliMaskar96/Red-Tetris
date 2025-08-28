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
      expect(player.pieceIndex).to.equal(0);
      expect(player.currentPiece).to.be.null;
      expect(player.nextPiece).to.be.null;
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

    it('should manage piece index', () => {
      const player = new Player({
        id: 'player1',
        name: 'Alice',
        socketId: 'socket123'
      });
      
      player.setPieceIndex(5);
      expect(player.pieceIndex).to.equal(5);
    });

    it('should set current and next pieces', () => {
      const player = new Player({
        id: 'player1',
        name: 'Alice',
        socketId: 'socket123'
      });
      
      player.setCurrentPiece('I');
      expect(player.currentPiece).to.equal('I');
      
      player.setNextPiece('O');
      expect(player.nextPiece).to.equal('O');
    });

    it('should advance pieces correctly', () => {
      const player = new Player({
        id: 'player1',
        name: 'Alice',
        socketId: 'socket123'
      });
      
      const pieceSequence = ['I', 'O', 'T', 'S', 'Z'];
      player.pieceIndex = 0;
      
      const piece1 = player.advancePiece(pieceSequence);
      expect(piece1).to.equal('I');
      expect(player.currentPiece).to.equal('I');
      expect(player.nextPiece).to.equal('O');
      expect(player.pieceIndex).to.equal(1);
      
      const piece2 = player.advancePiece(pieceSequence);
      expect(piece2).to.equal('O');
      expect(player.currentPiece).to.equal('O');
      expect(player.nextPiece).to.equal('T');
      expect(player.pieceIndex).to.equal(2);
    });

    it('should return null when advancing past sequence end', () => {
      const player = new Player({
        id: 'player1',
        name: 'Alice',
        socketId: 'socket123'
      });
      
      const pieceSequence = ['I', 'O'];
      player.pieceIndex = 2; // Past the end
      
      const piece = player.advancePiece(pieceSequence);
      expect(piece).to.be.null;
    });

    it('should initialize pieces correctly', () => {
      const player = new Player({
        id: 'player1',
        name: 'Alice',
        socketId: 'socket123'
      });
      
      const pieceSequence = ['I', 'O', 'T', 'S'];
      player.initializePieces(pieceSequence);
      
      expect(player.currentPiece).to.equal('I');
      expect(player.nextPiece).to.equal('O');
      expect(player.pieceIndex).to.equal(1);
    });

    it('should handle empty piece sequence initialization', () => {
      const player = new Player({
        id: 'player1',
        name: 'Alice',
        socketId: 'socket123'
      });
      
      const pieceSequence = [];
      player.initializePieces(pieceSequence);
      
      expect(player.currentPiece).to.be.undefined;
      expect(player.nextPiece).to.be.null;
      expect(player.pieceIndex).to.equal(1);
    });

    it('should handle single piece sequence initialization', () => {
      const player = new Player({
        id: 'player1',
        name: 'Alice',
        socketId: 'socket123'
      });
      
      const pieceSequence = ['I'];
      player.initializePieces(pieceSequence);
      
      expect(player.currentPiece).to.equal('I');
      expect(player.nextPiece).to.be.null;
      expect(player.pieceIndex).to.equal(1);
    });
  });

  describe('Game Model', () => {
    it('should create a game with required properties', () => {
      const game = new Game({ id: 'game123' });
      
      expect(game.id).to.equal('game123');
      expect(game.players).to.be.an('array').with.lengthOf(0);
      expect(game.status).to.equal('waiting');
      expect(game.pieceSequence).to.be.an('array').with.lengthOf(0);
      expect(game.currentPieceIndex).to.equal(0);
      expect(game.winner).to.be.null;
      expect(game.roomId).to.be.null;
      expect(game.initialBatchSize).to.equal(50);
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
          return { generatePieceBatch: () => ['I', 'O', 'T'] };
        }
        return originalRequire.apply(this, arguments);
      };
      
      game.startGame('room123');
      
      expect(game.status).to.equal('playing');
      expect(game.roomId).to.equal('room123');
      expect(game.winner).to.be.null;
      expect(game.pieceSequence).to.be.an('array').with.lengthOf(3);
      
      // Restore require
      require = originalRequire;
    });

    it('should start game with provided initial pieces', () => {
      const game = new Game({ id: 'game123' });
      const player1 = new Player({ id: 'player1', name: 'Alice', socketId: 'socket1' });
      game.addPlayer(player1);
      
      const initialPieces = ['S', 'Z', 'J', 'L'];
      game.startGame('room123', initialPieces);
      
      expect(game.status).to.equal('playing');
      expect(game.roomId).to.equal('room123');
      expect(game.pieceSequence).to.deep.equal(initialPieces);
      expect(player1.currentPiece).to.equal('S');
      expect(player1.nextPiece).to.equal('Z');
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

    it('should get current piece for player', () => {
      const game = new Game({ id: 'game123' });
      const player1 = new Player({ id: 'player1', name: 'Alice', socketId: 'socket1' });
      player1.setCurrentPiece('I');
      game.addPlayer(player1);
      
      expect(game.getCurrentPieceForPlayer('player1')).to.equal('I');
      expect(game.getCurrentPieceForPlayer('nonexistent')).to.be.null;
    });

    it('should get next piece for player', () => {
      const game = new Game({ id: 'game123' });
      const player1 = new Player({ id: 'player1', name: 'Alice', socketId: 'socket1' });
      player1.setNextPiece('O');
      game.addPlayer(player1);
      
      expect(game.getNextPieceForPlayer('player1')).to.equal('O');
      expect(game.getNextPieceForPlayer('nonexistent')).to.be.null;
    });

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
      const piece = new Piece({ type: 'I', x: 4, y: 0 });
      
      expect(piece.type).to.equal('I');
      expect(piece.x).to.equal(4);
      expect(piece.y).to.equal(0);
      expect(piece.rotation).to.equal(0);
    });

    it('should create a piece with optional properties', () => {
      const piece = new Piece({ 
        type: 'T', 
        x: 3, 
        y: 5, 
        rotation: 2 
      });
      
      expect(piece.type).to.equal('T');
      expect(piece.x).to.equal(3);
      expect(piece.y).to.equal(5);
      expect(piece.rotation).to.equal(2);
    });

    it('should throw error for missing required properties', () => {
      expect(() => new Piece({ x: 4, y: 0 })).to.throw('Piece requires type, x, and y');
      expect(() => new Piece({ type: 'I', y: 0 })).to.throw('Piece requires type, x, and y');
      expect(() => new Piece({ type: 'I', x: 4 })).to.throw('Piece requires type, x, and y');
      expect(() => new Piece({})).to.throw('Piece requires type, x, and y');
    });

    it('should validate piece type', () => {
      expect(() => new Piece({ type: 'X', x: 4, y: 0 })).to.throw('Invalid piece type');
      expect(() => new Piece({ type: '', x: 4, y: 0 })).to.throw('Invalid piece type');
      expect(() => new Piece({ type: null, x: 4, y: 0 })).to.throw('Invalid piece type');
    });

    it('should move piece correctly', () => {
      const piece = new Piece({ type: 'I', x: 4, y: 0 });
      
      piece.move(1, 2);
      expect(piece.x).to.equal(5);
      expect(piece.y).to.equal(2);
      
      piece.move(-2, -1);
      expect(piece.x).to.equal(3);
      expect(piece.y).to.equal(1);
    });

    it('should rotate piece correctly', () => {
      const piece = new Piece({ type: 'T', x: 4, y: 0 });
      
      piece.rotate();
      expect(piece.rotation).to.equal(1);
      
      piece.rotate();
      expect(piece.rotation).to.equal(2);
      
      piece.rotate();
      expect(piece.rotation).to.equal(3);
      
      piece.rotate();
      expect(piece.rotation).to.equal(0);
    });

    it('should get position correctly', () => {
      const piece = new Piece({ type: 'O', x: 5, y: 3 });
      const position = piece.getPosition();
      
      expect(position).to.deep.equal({ x: 5, y: 3 });
    });
  });
});
