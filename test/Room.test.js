import chai from 'chai';
import Room from '../src/server/models/Room.js';

const expect = chai.expect;

describe('Room Model', () => {
  
  describe('constructor', () => {
    it('should create a room with required properties', () => {
      const room = new Room({ id: 'room1', name: 'Test Room' });
      
      expect(room.id).to.equal('room1');
      expect(room.name).to.equal('Test Room');
      expect(room.players).to.be.an('array').with.lengthOf(0);
      expect(room.game).to.be.null;
      expect(room.leaderId).to.be.null;
    });

    it('should create a room with optional properties', () => {
      const mockGame = { id: 'game1' };
      const mockPlayers = [{ id: 'player1', name: 'Alice' }];
      
      const room = new Room({ 
        id: 'room1', 
        name: 'Test Room',
        game: mockGame,
        players: mockPlayers,
        leaderId: 'player1'
      });
      
      expect(room.id).to.equal('room1');
      expect(room.name).to.equal('Test Room');
      expect(room.players).to.equal(mockPlayers);
      expect(room.game).to.equal(mockGame);
      expect(room.leaderId).to.equal('player1');
    });

    it('should throw error for missing id', () => {
      expect(() => new Room({ name: 'Test Room' })).to.throw('Room requires id and name');
    });

    it('should throw error for missing name', () => {
      expect(() => new Room({ id: 'room1' })).to.throw('Room requires id and name');
    });

    it('should throw error for missing both id and name', () => {
      expect(() => new Room({})).to.throw('Room requires id and name');
    });
  });

  describe('addPlayer', () => {
    let room;
    
    beforeEach(() => {
      room = new Room({ id: 'room1', name: 'Test Room' });
    });

    it('should add a player to the room', () => {
      const player = { id: 'player1', name: 'Alice' };
      
      room.addPlayer(player);
      
      expect(room.players).to.have.lengthOf(1);
      expect(room.players[0]).to.equal(player);
    });

    it('should set first player as leader', () => {
      const player = { id: 'player1', name: 'Alice' };
      
      room.addPlayer(player);
      
      expect(room.leaderId).to.equal('player1');
    });

    it('should not change leader when adding second player', () => {
      const player1 = { id: 'player1', name: 'Alice' };
      const player2 = { id: 'player2', name: 'Bob' };
      
      room.addPlayer(player1);
      room.addPlayer(player2);
      
      expect(room.players).to.have.lengthOf(2);
      expect(room.leaderId).to.equal('player1');
    });

    it('should throw error for null player', () => {
      expect(() => room.addPlayer(null)).to.throw('addPlayer requires a valid Player instance');
    });

    it('should throw error for undefined player', () => {
      expect(() => room.addPlayer(undefined)).to.throw('addPlayer requires a valid Player instance');
    });

    it('should throw error for player without id', () => {
      expect(() => room.addPlayer({ name: 'Alice' })).to.throw('addPlayer requires a valid Player instance');
    });

    it('should throw error for non-object player', () => {
      expect(() => room.addPlayer('not an object')).to.throw('addPlayer requires a valid Player instance');
    });
  });

  describe('removePlayer', () => {
    let room;
    
    beforeEach(() => {
      room = new Room({ id: 'room1', name: 'Test Room' });
    });

    it('should remove a player from the room', () => {
      const player1 = { id: 'player1', name: 'Alice' };
      const player2 = { id: 'player2', name: 'Bob' };
      
      room.addPlayer(player1);
      room.addPlayer(player2);
      room.removePlayer('player2');
      
      expect(room.players).to.have.lengthOf(1);
      expect(room.players[0]).to.equal(player1);
    });

    it('should transfer leadership when leader is removed', () => {
      const player1 = { id: 'player1', name: 'Alice' };
      const player2 = { id: 'player2', name: 'Bob' };
      
      room.addPlayer(player1);
      room.addPlayer(player2);
      room.removePlayer('player1'); // Remove leader
      
      expect(room.players).to.have.lengthOf(1);
      expect(room.leaderId).to.equal('player2');
    });

    it('should set leaderId to null when last player is removed', () => {
      const player = { id: 'player1', name: 'Alice' };
      
      room.addPlayer(player);
      room.removePlayer('player1');
      
      expect(room.players).to.have.lengthOf(0);
      expect(room.leaderId).to.be.null;
    });

    it('should throw error when trying to remove non-existent player', () => {
      expect(() => room.removePlayer('nonexistent')).to.throw('Player to remove not found in room');
    });

    it('should throw error when removing from empty room', () => {
      expect(() => room.removePlayer('player1')).to.throw('Player to remove not found in room');
    });
  });

  describe('setLeader', () => {
    let room;
    
    beforeEach(() => {
      room = new Room({ id: 'room1', name: 'Test Room' });
    });

    it('should set a player as leader', () => {
      const player1 = { id: 'player1', name: 'Alice' };
      const player2 = { id: 'player2', name: 'Bob' };
      
      room.addPlayer(player1);
      room.addPlayer(player2);
      room.setLeader('player2');
      
      expect(room.leaderId).to.equal('player2');
    });

    it('should change leadership from one player to another', () => {
      const player1 = { id: 'player1', name: 'Alice' };
      const player2 = { id: 'player2', name: 'Bob' };
      
      room.addPlayer(player1); // player1 becomes leader
      room.addPlayer(player2);
      
      expect(room.leaderId).to.equal('player1');
      
      room.setLeader('player2');
      
      expect(room.leaderId).to.equal('player2');
    });

    it('should throw error when setting non-existent player as leader', () => {
      const player = { id: 'player1', name: 'Alice' };
      room.addPlayer(player);
      
      expect(() => room.setLeader('nonexistent')).to.throw('Player not found in room');
    });

    it('should throw error when setting leader in empty room', () => {
      expect(() => room.setLeader('player1')).to.throw('Player not found in room');
    });
  });

  describe('isEmpty', () => {
    let room;
    
    beforeEach(() => {
      room = new Room({ id: 'room1', name: 'Test Room' });
    });

    it('should return true for empty room', () => {
      expect(room.isEmpty()).to.be.true;
    });

    it('should return false for room with players', () => {
      const player = { id: 'player1', name: 'Alice' };
      room.addPlayer(player);
      
      expect(room.isEmpty()).to.be.false;
    });

    it('should return true after removing all players', () => {
      const player = { id: 'player1', name: 'Alice' };
      room.addPlayer(player);
      room.removePlayer('player1');
      
      expect(room.isEmpty()).to.be.true;
    });
  });

  describe('isFull', () => {
    let room;
    
    beforeEach(() => {
      room = new Room({ id: 'room1', name: 'Test Room' });
    });

    it('should return false for empty room with default max players', () => {
      expect(room.isFull()).to.be.false;
    });

    it('should return false when under default max players (6)', () => {
      for (let i = 1; i <= 5; i++) {
        room.addPlayer({ id: `player${i}`, name: `Player ${i}` });
      }
      
      expect(room.isFull()).to.be.false;
    });

    it('should return true when at default max players (6)', () => {
      for (let i = 1; i <= 6; i++) {
        room.addPlayer({ id: `player${i}`, name: `Player ${i}` });
      }
      
      expect(room.isFull()).to.be.true;
    });

    it('should return true when over default max players', () => {
      for (let i = 1; i <= 7; i++) {
        room.addPlayer({ id: `player${i}`, name: `Player ${i}` });
      }
      
      expect(room.isFull()).to.be.true;
    });

    it('should respect custom max players parameter', () => {
      for (let i = 1; i <= 3; i++) {
        room.addPlayer({ id: `player${i}`, name: `Player ${i}` });
      }
      
      expect(room.isFull(2)).to.be.true;
      expect(room.isFull(4)).to.be.false;
    });

    it('should handle max players of 1', () => {
      expect(room.isFull(1)).to.be.false;
      
      room.addPlayer({ id: 'player1', name: 'Alice' });
      
      expect(room.isFull(1)).to.be.true;
    });

    it('should handle max players of 0', () => {
      expect(room.isFull(0)).to.be.true;
    });
  });

  describe('Integration tests', () => {
    it('should handle complete room lifecycle', () => {
      const room = new Room({ id: 'room1', name: 'Test Room' });
      
      // Start empty
      expect(room.isEmpty()).to.be.true;
      expect(room.isFull()).to.be.false;
      expect(room.leaderId).to.be.null;
      
      // Add first player
      const player1 = { id: 'player1', name: 'Alice' };
      room.addPlayer(player1);
      expect(room.isEmpty()).to.be.false;
      expect(room.leaderId).to.equal('player1');
      
      // Add second player
      const player2 = { id: 'player2', name: 'Bob' };
      room.addPlayer(player2);
      expect(room.players).to.have.lengthOf(2);
      expect(room.leaderId).to.equal('player1'); // Still first player
      
      // Change leadership
      room.setLeader('player2');
      expect(room.leaderId).to.equal('player2');
      
      // Remove non-leader
      room.removePlayer('player1');
      expect(room.players).to.have.lengthOf(1);
      expect(room.leaderId).to.equal('player2'); // Leadership unchanged
      
      // Remove last player
      room.removePlayer('player2');
      expect(room.isEmpty()).to.be.true;
      expect(room.leaderId).to.be.null;
    });
  });
});
