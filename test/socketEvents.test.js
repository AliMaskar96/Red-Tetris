import chai from 'chai';
import { startServer } from './helpers/server';
import io from 'socket.io-client';
import params from '../params';

const expect = chai.expect;

describe('Socket Event Handlers', function() {
  let tetrisServer;
  let clientSocket;

  beforeAll(function(done) {
    startServer(params.server, function(err, server) {
      tetrisServer = server;
      done();
    });
  });

  afterAll(function(done) {
    if (clientSocket) clientSocket.disconnect();
    tetrisServer.stop(done);
  });

  it('should join a room and receive room-joined', function(done) {
    clientSocket = io(params.server.url);
    
    // Add debug logging
    clientSocket.on('connect', () => {
      console.log('Socket connected to server');
    });
    
    clientSocket.on('connect_error', (error) => {
      console.log('Socket connection error:', error);
      done(error);
    });
    
    clientSocket.on('room-joined', (data) => {
      console.log('Received room-joined event:', data);
      try {
        expect(data).to.have.property('game');
        expect(data).to.have.property('players');
        expect(data.players).to.be.an('array').with.lengthOf(1);
        done();
      } catch (err) {
        done(err);
      }
    });
    
    // Add error handler to catch join errors
    clientSocket.on('join-error', (error) => {
      console.log('Received join-error:', error);
      done(new Error(`Join failed: ${error.message}`));
    });
    
    // Wait for connection before emitting
    clientSocket.on('connect', () => {
      console.log('Emitting join-room event');
      clientSocket.emit('join-room', { roomId: 'testroom', playerName: 'Alice', isCreator: true });
    });
  });

  it('should allow the leader to start the game and receive game-started with shared seed', function(done) {
    clientSocket = io(params.server.url);
    
    clientSocket.on('connect', () => {
      console.log('Second test: Socket connected');
      clientSocket.emit('join-room', { roomId: 'testroom2', playerName: 'Alice', isCreator: true });
    });
    
    clientSocket.on('room-joined', () => {
      console.log('Second test: Room joined, starting game');
      clientSocket.emit('start-game', { gameId: 'testroom2' });
    });
    
    clientSocket.on('join-error', (error) => {
      console.log('Second test: Join error:', error);
      done(new Error(`Join failed: ${error.message}`));
    });
    
    clientSocket.on('game-started', (data) => {
      console.log('Second test: Game started event received:', data);
      try {
        expect(data).to.have.property('gameId');
        expect(data).to.have.property('sharedSeed');
        expect(data.sharedSeed).to.be.a('number');
        done();
      } catch (err) {
        done(err);
      }
    });
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
    client1.emit('join-room', { roomId: 'room2', playerName: 'A', isCreator: true });
    client2.emit('join-room', { roomId: 'room2', playerName: 'B' });
  });

  it('should update board and broadcast player-board-updated on piece-placed', function(done) {
    clientSocket = io(params.server.url);
    clientSocket.on('room-joined', () => {
      clientSocket.emit('start-game', { gameId: 'testroom3' });
    });
    clientSocket.on('game-started', () => {
      const board = Array(20).fill().map(() => Array(10).fill(0));
      clientSocket.emit('piece-placed', { playerId: 'p1', piece: 'I', newBoard: board });
    });
    clientSocket.on('player-board-updated', (data) => {
      expect(data).to.have.property('playerId');
      expect(data).to.have.property('board');
      expect(data).to.have.property('spectrum');
      done();
    });
    clientSocket.emit('join-room', { roomId: 'testroom3', playerName: 'Alice', isCreator: true });
  });

  it('should broadcast penalty-lines on lines-cleared', function(done) {
    const client1 = io(params.server.url);
    const client2 = io(params.server.url);
    let ready = 0;
    let gameStarted = false;
    let player1Id = null;
    
    function tryReady() { 
      if (++ready === 2 && !gameStarted) {
        gameStarted = true;
        console.log('Both players joined, starting game');
        client1.emit('start-game', { gameId: 'room3' });
      }
    }
    
    client1.on('room-joined', (data) => {
      // Get the real player ID from the room-joined response
      const player1 = data.players.find(p => p.name === 'A');
      if (player1) {
        player1Id = player1.id;
        console.log('Player1 ID:', player1Id);
      }
      tryReady();
    });
    
    client1.on('game-started', () => {
      console.log('Game started, emitting lines-cleared with real player ID');
      client1.emit('lines-cleared', { 
        playerId: player1Id, 
        linesCleared: 3, 
        newBoard: Array(20).fill().map(() => Array(10).fill(0)),
        newScore: 300 
      });
    });
    
    client2.on('penalty-lines', (data) => {
      console.log('Received penalty-lines:', data);
      expect(data).to.have.property('playerId');
      expect(data).to.have.property('count');
      expect(data.count).to.equal(2); // 3 lines cleared - 1 = 2 penalty lines
      client1.disconnect(); client2.disconnect();
      done();
    });
    
    client2.on('room-joined', tryReady);
    client1.emit('join-room', { roomId: 'room3', playerName: 'A', isCreator: true });
    client2.emit('join-room', { roomId: 'room3', playerName: 'B' });
  });

  it('should broadcast game-ended when only one player is alive', function(done) {
    const client1 = io(params.server.url);
    const client2 = io(params.server.url);
    let ready = 0;
    let gameStarted = false;
    let player1Id = null;
    
    function tryReady() { 
      if (++ready === 2 && !gameStarted) {
        gameStarted = true;
        console.log('Both players joined, starting game');
        client1.emit('start-game', { gameId: 'room4' });
      }
    }
    
    client1.on('room-joined', (data) => {
      // Get the real player ID
      const player1 = data.players.find(p => p.name === 'A');
      if (player1) {
        player1Id = player1.id;
        console.log('Player1 ID for game-over:', player1Id);
      }
      tryReady();
    });
    
    client1.on('game-started', () => {
      console.log('Game started, emitting game-over for player1');
      client1.emit('game-over', { playerId: player1Id });
    });
    
    client2.on('game-end', (data) => {
      console.log('Received game-end:', data);
      expect(data).to.have.property('winnerId');
      expect(data).to.have.property('winnerName');
      client1.disconnect(); client2.disconnect();
      done();
    });
    
    client2.on('room-joined', tryReady);
    client1.emit('join-room', { roomId: 'room4', playerName: 'A', isCreator: true });
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
    client1.emit('join-room', { roomId: 'room5', playerName: 'A', isCreator: true });
    client2.emit('join-room', { roomId: 'room5', playerName: 'B' });
  });
});

// --- Additional tests for edge cases and improved logic ---

describe('Socket Event Handlers - Edge Cases', function() {
  let tetrisServer;
  let client1, client2, client3;

  beforeAll((done) => {
    const timeout = setTimeout(() => {
      done(new Error('Server startup timeout'));
    }, 10000);
    
    startServer(params.server, function(err, server) {
      clearTimeout(timeout);
      if (err) {
        console.error('Server startup error:', err);
        done(err);
        return;
      }
      tetrisServer = server;
      console.log('Server started successfully for edge case tests');
      done();
    });
  }, 15000);

  afterEach(function() {
    if (client1) client1.disconnect();
    if (client2) client2.disconnect();
    if (client3) client3.disconnect();
  });

  afterAll((done) => {
    if (tetrisServer && tetrisServer.stop) {
      tetrisServer.stop(done);
    } else {
      done();
    }
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
    client1.emit('join-room', { roomId: 'roomEdge1', playerName: 'Alice', isCreator: true });
  });

  it('should deny joining if room is full', function(done) {
    const clients = [];
    let joinedCount = 0;
    
    // Create 6 clients to fill the room (max capacity)
    for (let i = 0; i < 6; i++) {
      clients[i] = io(params.server.url);
    }
    
    // Add the 7th client that should be rejected
    const rejectedClient = io(params.server.url);
    
    function onPlayerJoined(data) {
      joinedCount++;
      console.log(`Player ${joinedCount} joined. Room now has ${data.players.length} players`);
      
      if (joinedCount === 6) {
        console.log('Room is full with 6 players, trying to add 7th player after delay');
        // Room is now full, try to add the 7th player after a longer delay
        setTimeout(() => {
          rejectedClient.on('join-error', (data) => {
            console.log('SUCCESS: Received join-error:', data);
            expect(data).to.have.property('message').that.includes('Room is full');
            // Cleanup all clients
            clients.forEach(c => c.disconnect());
            rejectedClient.disconnect();
            done();
          });
          
          rejectedClient.on('room-joined', () => {
            console.log('ERROR: 7th player was allowed to join!');
            done(new Error('7th player should have been rejected'));
          });
          
          console.log('Attempting to join 7th player...');
          rejectedClient.emit('join-room', { roomId: 'roomEdge2', playerName: 'Rejected' });
        }, 500); // Longer delay to ensure room state is fully updated
      } else if (joinedCount < 6) {
        // Continue adding players sequentially
        const nextIndex = joinedCount;
        if (nextIndex < 6) {
          setTimeout(() => {
            console.log(`Adding player ${nextIndex + 1}`);
            clients[nextIndex].emit('join-room', { roomId: 'roomEdge2', playerName: `Player${nextIndex + 1}` });
          }, 100);
        }
      }
    }
    
    // Set up room-joined listeners for all 6 clients
    clients.forEach((client, index) => {
      client.on('room-joined', onPlayerJoined);
    });
    
    // Start the process by adding the first player
    console.log('Adding player 1 (creator)');
    clients[0].emit('join-room', { roomId: 'roomEdge2', playerName: 'Player1', isCreator: true });
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
    client1.emit('join-room', { roomId: 'roomEdge3', playerName: 'Alice', isCreator: true });
  });

  it('should emit game-ended with winner when one player remains', function(done) {
    client1 = io(params.server.url);
    client2 = io(params.server.url);
    let ready = 0;
    let gameStarted = false;
    let player1Id = null;
    
    function tryReady() { 
      if (++ready === 2 && !gameStarted) {
        gameStarted = true;
        console.log('Both players joined, starting game');
        client1.emit('start-game', { gameId: 'roomEdge4' });
      }
    }
    
    client1.on('room-joined', (data) => {
      // Get the real player ID
      const player1 = data.players.find(p => p.name === 'A');
      if (player1) {
        player1Id = player1.id;
        console.log('Player1 ID for elimination:', player1Id);
      }
      tryReady();
    });
    
    client1.on('game-started', () => {
      console.log('Game started, emitting game-over for player1');
      client1.emit('game-over', { playerId: player1Id });
    });
    
    client2.on('game-end', (data) => {
      console.log('Received game-end:', data);
      expect(data).to.have.property('winnerId');
      expect(data).to.have.property('winnerName').that.equals('B');
      expect(data).to.have.property('gameResult').that.equals('victory');
      client1.disconnect(); client2.disconnect();
      done();
    });
    
    client2.on('room-joined', tryReady);
    client1.emit('join-room', { roomId: 'roomEdge4', playerName: 'A', isCreator: true });
    client2.emit('join-room', { roomId: 'roomEdge4', playerName: 'B' });
  });

  it('should emit game-ended with null winner if all eliminated', function(done) {
    client1 = io(params.server.url);
    let playerId = null;
    
    client1.on('room-joined', (data) => {
      // Get the real player ID and start the game first
      const player = data.players.find(p => p.name === 'Solo');
      if (player) {
        playerId = player.id;
        console.log('Solo player ID:', playerId);
        // Start the game first (required for game-over logic)
        client1.emit('start-game', { gameId: 'roomEdge5' });
      }
    });
    
    client1.on('game-started', () => {
      console.log('Game started, emitting game-over for solo player');
      client1.emit('game-over', { playerId: playerId });
    });
    
    client1.on('game-end', (data) => {
      console.log('Received game-end:', data);
      // When all players are eliminated with no scores, expect null winner
      expect(data).to.have.property('winnerId').that.is.null;
      expect(data).to.have.property('winnerName').that.is.null;
      expect(data).to.have.property('gameResult').that.equals('draw');
      client1.disconnect();
      done();
    });
    
    client1.emit('join-room', { roomId: 'roomEdge5', playerName: 'Solo', isCreator: true });
  });

  it('should only emit game-ended once per game', function(done) {
    client1 = io(params.server.url);
    client2 = io(params.server.url);
    let gameEndedCount = 0;
    let playersJoined = 0;
    let gameStarted = false;
    let player1Id = null;
    let player2Id = null;
    
    function onPlayerJoined(data) {
      playersJoined++;
      console.log(`Player ${playersJoined} joined`);
      
      // Store player IDs
      if (data.players.length === 1) {
        player1Id = data.players[0].id;
        console.log('Player1 ID:', player1Id);
      } else if (data.players.length === 2) {
        player2Id = data.players.find(p => p.name === 'B').id;
        console.log('Player2 ID:', player2Id);
        
        if (!gameStarted) {
          gameStarted = true;
          console.log('Starting game...');
          client1.emit('start-game', { gameId: 'roomEdge6' });
        }
      }
    }
    
    client1.on('room-joined', onPlayerJoined);
    client2.on('room-joined', onPlayerJoined);
    
    client1.on('game-started', () => {
      console.log('Game started, emitting game-over for both players simultaneously');
      // Emit game-over for both players simultaneously to test the "once per game" logic
      client1.emit('game-over', { playerId: player1Id });
      client2.emit('game-over', { playerId: player2Id });
    });
    
    // Only client2 listens for game-end events to test "once per game"
    let gameEndReceived = false;
    
    client2.on('game-end', (data) => {
      console.log('Game-end event received by client2:', data);
      
      if (gameEndReceived) {
        done(new Error('Game-end event received multiple times by same client'));
        return;
      }
      
      gameEndReceived = true;
      
      // Wait a bit to see if any duplicate events arrive
      setTimeout(() => {
        console.log('Test passed: Only one game-end event received per client');
        expect(gameEndReceived).to.be.true;
        client1.disconnect(); client2.disconnect();
        done();
      }, 300);
    });
    
    client1.emit('join-room', { roomId: 'roomEdge6', playerName: 'A', isCreator: true });
    client2.emit('join-room', { roomId: 'roomEdge6', playerName: 'B' });
  });
}); 