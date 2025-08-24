import chai from 'chai';
import { startServer } from './helpers/server';
import io from 'socket.io-client';
import params from '../params';

const expect = chai.expect;

describe('Socket Event Handlers', function() {
  let tetrisServer;
  let clientSocket;

  before(function(done) {
    startServer(params.server, function(err, server) {
      tetrisServer = server;
      done();
    });
  });

  after(function(done) {
    if (clientSocket) clientSocket.disconnect();
    tetrisServer.stop(done);
  });

  it('should join a room and receive room-joined', function(done) {
    clientSocket = io(params.server.url);
    clientSocket.on('room-joined', (data) => {
      expect(data).to.have.property('game');
      expect(data).to.have.property('players');
      expect(data.players).to.be.an('array').with.lengthOf(1);
      done();
    });
    clientSocket.emit('join-room', { roomId: 'testroom', playerName: 'Alice' });
  });

  it('should allow the leader to start the game and receive game-started and next-piece', function(done) {
    clientSocket = io(params.server.url);
    clientSocket.on('room-joined', () => {
      clientSocket.emit('start-game', { gameId: 'testroom' });
    });
    let gotGameStarted = false;
    let gotNextPiece = false;
    clientSocket.on('game-started', (data) => {
      expect(data).to.have.property('gameId');
      gotGameStarted = true;
      if (gotGameStarted && gotNextPiece) done();
    });
    clientSocket.on('next-piece', (data) => {
      expect(data).to.have.property('piece');
      gotNextPiece = true;
      if (gotGameStarted && gotNextPiece) done();
    });
    clientSocket.emit('join-room', { roomId: 'testroom', playerName: 'Alice' });
  });

  it('should broadcast player-move to other players', function(done) {
    const client1 = io(params.server.url);
    const client2 = io(params.server.url);
    let ready = 0;
    function tryReady() { if (++ready === 2) {
      client1.emit('player-move', { playerId: 'p1', move: 'left' });
    }}
    client2.on('player-move', (data) => {
      expect(data).to.have.property('playerId');
      expect(data).to.have.property('move');
      client1.disconnect(); client2.disconnect();
      done();
    });
    client1.on('room-joined', tryReady);
    client2.on('room-joined', tryReady);
    client1.emit('join-room', { roomId: 'room2', playerName: 'A' });
    client2.emit('join-room', { roomId: 'room2', playerName: 'B' });
  });

  it('should update board and broadcast next-piece and player-board-updated on piece-placed', function(done) {
    clientSocket = io(params.server.url);
    clientSocket.on('room-joined', () => {
      clientSocket.emit('start-game', { gameId: 'testroom' });
    });
    clientSocket.on('game-started', () => {
      const board = Array(20).fill().map(() => Array(10).fill(0));
      clientSocket.emit('piece-placed', { playerId: 'p1', piece: 'I', newBoard: board });
    });
    let gotNextPiece = false, gotBoardUpdated = false;
    clientSocket.on('next-piece', (data) => {
      expect(data).to.have.property('piece');
      gotNextPiece = true;
      if (gotNextPiece && gotBoardUpdated) done();
    });
    clientSocket.on('player-board-updated', (data) => {
      expect(data).to.have.property('playerId');
      expect(data).to.have.property('board');
      expect(data).to.have.property('spectrum');
      gotBoardUpdated = true;
      if (gotNextPiece && gotBoardUpdated) done();
    });
    clientSocket.emit('join-room', { roomId: 'testroom', playerName: 'Alice' });
  });

  it('should broadcast penalty-lines on lines-cleared', function(done) {
    const client1 = io(params.server.url);
    const client2 = io(params.server.url);
    let ready = 0;
    function tryReady() { if (++ready === 2) {
      client1.emit('lines-cleared', { playerId: 'p1', linesCount: 3 });
    }}
    client2.on('penalty-lines', (data) => {
      expect(data).to.have.property('playerId');
      expect(data).to.have.property('count');
      client1.disconnect(); client2.disconnect();
      done();
    });
    client1.on('room-joined', tryReady);
    client2.on('room-joined', tryReady);
    client1.emit('join-room', { roomId: 'room3', playerName: 'A' });
    client2.emit('join-room', { roomId: 'room3', playerName: 'B' });
  });

  it('should broadcast game-ended when only one player is alive', function(done) {
    const client1 = io(params.server.url);
    const client2 = io(params.server.url);
    let ready = 0;
    function tryReady() { if (++ready === 2) {
      client1.emit('game-over', { playerId: 'p1' });
    }}
    client2.on('game-ended', (data) => {
      expect(data).to.have.property('winner');
      client1.disconnect(); client2.disconnect();
      done();
    });
    client1.on('room-joined', tryReady);
    client2.on('room-joined', tryReady);
    client1.emit('join-room', { roomId: 'room4', playerName: 'A' });
    client2.emit('join-room', { roomId: 'room4', playerName: 'B' });
  });

  it('should handle disconnect and broadcast player-disconnected', function(done) {
    const client1 = io(params.server.url);
    const client2 = io(params.server.url);
    let ready = 0;
    function tryReady() { if (++ready === 2) {
      client1.disconnect();
    }}
    client2.on('player-disconnected', (data) => {
      expect(data).to.have.property('playerId');
      client2.disconnect();
      done();
    });
    client1.on('room-joined', tryReady);
    client2.on('room-joined', tryReady);
    client1.emit('join-room', { roomId: 'room5', playerName: 'A' });
    client2.emit('join-room', { roomId: 'room5', playerName: 'B' });
  });
});

// --- Additional tests for edge cases and improved logic ---

describe('Socket Event Handlers - Edge Cases', function() {
  let tetrisServer;
  let client1, client2, client3;

  before(function(done) {
    startServer(params.server, function(err, server) {
      tetrisServer = server;
      done();
    });
  });

  afterEach(function() {
    if (client1) client1.disconnect();
    if (client2) client2.disconnect();
    if (client3) client3.disconnect();
  });

  after(function(done) {
    tetrisServer.stop(done);
  });

  it('should deny joining if game is in progress', function(done) {
    client1 = io(params.server.url);
    client1.on('room-joined', () => {
      client1.emit('start-game', { gameId: 'roomEdge1' });
    });
    client1.on('game-started', () => {
      client2 = io(params.server.url);
      client2.on('join-error', (data) => {
        expect(data).to.have.property('message').that.includes('Game already in progress');
        done();
      });
      client2.emit('join-room', { roomId: 'roomEdge1', playerName: 'Bob' });
    });
    client1.emit('join-room', { roomId: 'roomEdge1', playerName: 'Alice' });
  });

  it('should deny joining if room is full', function(done) {
    client1 = io(params.server.url);
    client2 = io(params.server.url);
    client3 = io(params.server.url);
    let ready = 0;
    function tryReady() { if (++ready === 2) {
      client3.on('join-error', (data) => {
        expect(data).to.have.property('message').that.includes('Room is full');
        done();
      });
      // Fill room (max 2 for this test)
      client3.emit('join-room', { roomId: 'roomEdge2', playerName: 'Charlie' });
    }}
    client1.on('room-joined', tryReady);
    client2.on('room-joined', tryReady);
    client1.emit('join-room', { roomId: 'roomEdge2', playerName: 'Alice' });
    client2.emit('join-room', { roomId: 'roomEdge2', playerName: 'Bob' });
  });

  it('should transfer leadership on disconnect and update isLeader', function(done) {
    client1 = io(params.server.url);
    client2 = io(params.server.url);
    let gotFirstJoin = false;
    client1.on('room-joined', (data) => {
      if (!gotFirstJoin) {
        gotFirstJoin = true;
        client2.emit('join-room', { roomId: 'roomEdge3', playerName: 'Bob' });
      } else {
        // After disconnect, client2 should be leader
        client1.disconnect();
      }
    });
    client2.on('room-joined', (data) => {
      if (data.players.length === 2) {
        // Both joined, now disconnect client1
        client1.disconnect();
      } else if (data.players.length === 1) {
        // Only client2 left, should be leader
        expect(data.players[0].isLeader).to.be.true;
        done();
      }
    });
    client1.emit('join-room', { roomId: 'roomEdge3', playerName: 'Alice' });
  });

  it('should emit game-ended with winner when one player remains', function(done) {
    client1 = io(params.server.url);
    client2 = io(params.server.url);
    let ready = 0;
    function tryReady() { if (++ready === 2) {
      client1.emit('game-over', { playerId: 'p1' });
    }}
    client2.on('game-ended', (data) => {
      expect(data).to.have.property('winner');
      expect(data.winner).to.be.an('object');
      done();
    });
    client1.on('room-joined', tryReady);
    client2.on('room-joined', tryReady);
    client1.emit('join-room', { roomId: 'roomEdge4', playerName: 'A' });
    client2.emit('join-room', { roomId: 'roomEdge4', playerName: 'B' });
  });

  it('should emit game-ended with null winner if all eliminated', function(done) {
    client1 = io(params.server.url);
    client1.on('room-joined', () => {
      client1.emit('game-over', { playerId: 'p1' });
    });
    client1.on('game-ended', (data) => {
      expect(data).to.have.property('winner').that.is.null;
      done();
    });
    client1.emit('join-room', { roomId: 'roomEdge5', playerName: 'Solo' });
  });

  it('should only emit game-ended once per game', function(done) {
    client1 = io(params.server.url);
    client2 = io(params.server.url);
    let endedCount = 0;
    function tryReady() { if (++endedCount === 2) {
      // Both game-over, but only one game-ended should be received
      setTimeout(() => {
        expect(endedCount).to.equal(1);
        done();
      }, 100);
    }}
    client2.on('game-ended', () => {
      endedCount++;
    });
    client1.on('room-joined', () => {
      client2.emit('join-room', { roomId: 'roomEdge6', playerName: 'B' });
    });
    client2.on('room-joined', () => {
      client1.emit('game-over', { playerId: 'p1' });
      client2.emit('game-over', { playerId: 'p2' });
    });
    client1.emit('join-room', { roomId: 'roomEdge6', playerName: 'A' });
  });
}); 