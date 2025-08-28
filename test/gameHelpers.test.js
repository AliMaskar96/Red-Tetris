import chai from 'chai';
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
  resetOpponentsData,
  formatGameStats
} from '../src/client/utils/gameHelpers.js';

const expect = chai.expect;

describe('Game Helpers', () => {
  
  describe('generateRoomId', () => {
    it('should generate a string room ID', () => {
      const roomId = generateRoomId();
      expect(roomId).to.be.a('string');
    });

    it('should generate 6-character room ID', () => {
      const roomId = generateRoomId();
      expect(roomId).to.have.lengthOf(6);
    });

    it('should generate uppercase room ID', () => {
      const roomId = generateRoomId();
      expect(roomId).to.equal(roomId.toUpperCase());
    });

    it('should generate alphanumeric room ID', () => {
      const roomId = generateRoomId();
      expect(roomId).to.match(/^[A-Z0-9]{6}$/);
    });

    it('should generate different room IDs on subsequent calls', () => {
      const roomIds = new Set();
      for (let i = 0; i < 10; i++) {
        roomIds.add(generateRoomId());
      }
      expect(roomIds.size).to.be.greaterThan(1);
    });
  });

  describe('parseHashUrl', () => {
    it('should parse valid room ID with player name', () => {
      const result = parseHashUrl('ROOM123[Alice]');
      expect(result).to.deep.equal({
        roomId: 'ROOM123',
        playerName: 'Alice'
      });
    });

    it('should parse valid room ID without player name', () => {
      const result = parseHashUrl('ROOM123');
      expect(result).to.deep.equal({
        roomId: 'ROOM123',
        playerName: undefined
      });
    });

    it('should handle empty hash', () => {
      const result = parseHashUrl('');
      expect(result).to.be.null;
    });

    it('should handle null hash', () => {
      const result = parseHashUrl(null);
      expect(result).to.be.null;
    });

    it('should handle undefined hash', () => {
      const result = parseHashUrl(undefined);
      expect(result).to.be.null;
    });

    it('should handle player names with special characters', () => {
      const result = parseHashUrl('ROOM123[Player-With_Numbers123]');
      expect(result).to.deep.equal({
        roomId: 'ROOM123',
        playerName: 'Player-With_Numbers123'
      });
    });

    it('should handle lowercase room IDs', () => {
      const result = parseHashUrl('room123[alice]');
      expect(result).to.deep.equal({
        roomId: 'room123',
        playerName: 'alice'
      });
    });
  });

  describe('createUrlHash', () => {
    it('should create hash with room ID and player name', () => {
      const hash = createUrlHash('ROOM123', 'Alice');
      expect(hash).to.equal('#ROOM123[Alice]');
    });

    it('should handle empty player name', () => {
      const hash = createUrlHash('ROOM123', '');
      expect(hash).to.equal('');
    });

    it('should handle null player name', () => {
      const hash = createUrlHash('ROOM123', null);
      expect(hash).to.equal('');
    });

    it('should handle empty room ID', () => {
      const hash = createUrlHash('', 'Alice');
      expect(hash).to.equal('');
    });

    it('should handle null room ID', () => {
      const hash = createUrlHash(null, 'Alice');
      expect(hash).to.equal('');
    });
  });

  describe('validateUsername', () => {
    it('should validate correct usernames', () => {
      const result = validateUsername('Alice');
      expect(result.isValid).to.be.true;
      expect(result.error).to.be.null;
    });

    it('should reject empty username', () => {
      const result = validateUsername('');
      expect(result.isValid).to.be.false;
      expect(result.error).to.be.a('string');
    });

    it('should reject username with only spaces', () => {
      const result = validateUsername('   ');
      expect(result.isValid).to.be.false;
      expect(result.error).to.be.a('string');
    });

    it('should reject already taken username', () => {
      const existingUsers = ['Alice', 'Bob'];
      const result = validateUsername('Alice', existingUsers);
      expect(result.isValid).to.be.false;
      expect(result.error).to.be.a('string');
    });

    it('should accept username not in existing users', () => {
      const existingUsers = ['Alice', 'Bob'];
      const result = validateUsername('Charlie', existingUsers);
      expect(result.isValid).to.be.true;
      expect(result.error).to.be.null;
    });

    it('should trim username before validation', () => {
      const result = validateUsername('  Alice  ');
      expect(result.isValid).to.be.true;
      expect(result.error).to.be.null;
    });
  });

  describe('validateRoomId', () => {
    it('should validate correct room ID', () => {
      const result = validateRoomId('ROOM123');
      expect(result.isValid).to.be.true;
      expect(result.error).to.be.null;
    });

    it('should reject empty room ID', () => {
      const result = validateRoomId('');
      expect(result.isValid).to.be.false;
      expect(result.error).to.be.a('string');
    });

    it('should reject room ID with only spaces', () => {
      const result = validateRoomId('   ');
      expect(result.isValid).to.be.false;
      expect(result.error).to.be.a('string');
    });

    it('should trim room ID before validation', () => {
      const result = validateRoomId('  ROOM123  ');
      expect(result.isValid).to.be.true;
      expect(result.error).to.be.null;
    });
  });

  describe('findCurrentPlayer', () => {
    const players = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
      { id: '3', name: 'Charlie' }
    ];

    it('should find player by currentPlayerName', () => {
      const player = findCurrentPlayer(players, 'Alice', null, null, []);
      expect(player).to.deep.equal({ id: '1', name: 'Alice' });
    });

    it('should find player by joinUsername when currentPlayerName not found', () => {
      const player = findCurrentPlayer(players, 'NotFound', 'Bob', null, []);
      expect(player).to.deep.equal({ id: '2', name: 'Bob' });
    });

    it('should find player by username when others not found', () => {
      const player = findCurrentPlayer(players, null, null, 'Charlie', []);
      expect(player).to.deep.equal({ id: '3', name: 'Charlie' });
    });

    it('should find player by userList when others not found', () => {
      const player = findCurrentPlayer(players, null, null, null, ['Bob', 'NotFound']);
      expect(player).to.deep.equal({ id: '2', name: 'Bob' });
    });

    it('should return null when no player found', () => {
      const player = findCurrentPlayer(players, 'NotFound', 'AlsoNotFound', 'StillNotFound', ['NoOne']);
      expect(player).to.be.null;
    });

    it('should trim usernames before comparison', () => {
      const player = findCurrentPlayer(players, null, '  Bob  ', null, []);
      expect(player).to.deep.equal({ id: '2', name: 'Bob' });
    });

    it('should handle empty players array', () => {
      const player = findCurrentPlayer([], 'Alice', null, null, []);
      expect(player).to.be.null;
    });
  });

  describe('initializeOpponentsScores', () => {
    const players = [
      { id: '1', name: 'Alice', score: 100 },
      { id: '2', name: 'Bob', score: 200 },
      { id: '3', name: 'Charlie' }, // No score
      { id: '4', name: 'David', score: 0 }
    ];

    it('should initialize scores for players with score property', () => {
      const scores = initializeOpponentsScores(players, '1');
      expect(scores).to.deep.equal({
        '2': 200,
        '4': 0
      });
    });

    it('should exclude current player', () => {
      const scores = initializeOpponentsScores(players, '2');
      expect(scores).to.not.have.property('2');
      expect(scores).to.have.property('1');
      expect(scores).to.have.property('4');
    });

    it('should exclude players without score property', () => {
      const scores = initializeOpponentsScores(players, '1');
      expect(scores).to.not.have.property('3');
    });

    it('should handle empty players array', () => {
      const scores = initializeOpponentsScores([], '1');
      expect(scores).to.deep.equal({});
    });
  });

  describe('resetOpponentsData', () => {
    const opponentsData = {
      '1': 100,
      '2': 200,
      '3': 300
    };

    it('should reset all values to specified reset value', () => {
      const reset = resetOpponentsData(opponentsData, 0);
      expect(reset).to.deep.equal({
        '1': 0,
        '2': 0,
        '3': 0
      });
    });

    it('should handle different reset values', () => {
      const reset = resetOpponentsData(opponentsData, null);
      expect(reset).to.deep.equal({
        '1': null,
        '2': null,
        '3': null
      });
    });

    it('should handle empty opponents data', () => {
      const reset = resetOpponentsData({}, 0);
      expect(reset).to.deep.equal({});
    });
  });

  describe('formatGameStats', () => {
    it('should calculate averages correctly', () => {
      const stats = {
        gamesPlayed: 3,
        totalScore: 300,
        totalLines: 30,
        multiplayerGames: 2,
        multiplayerWins: 1
      };

      const formatted = formatGameStats(stats);
      
      expect(formatted.averageScore).to.equal(100);
      expect(formatted.averageLines).to.equal(10);
      expect(formatted.winRate).to.equal(50);
    });

    it('should handle zero games played', () => {
      const stats = {
        gamesPlayed: 0,
        totalScore: 0,
        totalLines: 0,
        multiplayerGames: 0,
        multiplayerWins: 0
      };

      const formatted = formatGameStats(stats);
      
      expect(formatted.averageScore).to.equal(0);
      expect(formatted.averageLines).to.equal(0);
      expect(formatted.winRate).to.equal(0);
    });

    it('should round averages', () => {
      const stats = {
        gamesPlayed: 3,
        totalScore: 250,
        totalLines: 25,
        multiplayerGames: 3,
        multiplayerWins: 1
      };

      const formatted = formatGameStats(stats);
      
      expect(formatted.averageScore).to.equal(83); // 250/3 = 83.33... -> 83
      expect(formatted.averageLines).to.equal(8);  // 25/3 = 8.33... -> 8
      expect(formatted.winRate).to.equal(33);      // 1/3 = 33.33... -> 33
    });

    it('should preserve original stats properties', () => {
      const stats = {
        gamesPlayed: 2,
        totalScore: 200,
        totalLines: 20,
        multiplayerGames: 1,
        multiplayerWins: 1,
        customProperty: 'test'
      };

      const formatted = formatGameStats(stats);
      
      expect(formatted.gamesPlayed).to.equal(2);
      expect(formatted.totalScore).to.equal(200);
      expect(formatted.totalLines).to.equal(20);
      expect(formatted.multiplayerGames).to.equal(1);
      expect(formatted.multiplayerWins).to.equal(1);
      expect(formatted.customProperty).to.equal('test');
    });
  });

  describe('Integration tests', () => {
    it('should handle complete URL workflow', () => {
      const roomId = generateRoomId();
      const playerName = 'TestPlayer';
      
      // Create URL hash
      const hash = createUrlHash(roomId, playerName);
      expect(hash).to.include(roomId);
      expect(hash).to.include(playerName);
      
      // Parse URL hash (remove # character)
      const parsed = parseHashUrl(hash.substring(1));
      expect(parsed.roomId).to.equal(roomId);
      expect(parsed.playerName).to.equal(playerName);
    });

    it('should validate generated room IDs', () => {
      for (let i = 0; i < 10; i++) {
        const roomId = generateRoomId();
        const validation = validateRoomId(roomId);
        expect(validation.isValid).to.be.true;
      }
    });

    it('should handle player management workflow', () => {
      const players = [
        { id: '1', name: 'Alice', score: 100 },
        { id: '2', name: 'Bob', score: 200 }
      ];
      
      // Find current player
      const currentPlayer = findCurrentPlayer(players, 'Alice', null, null, []);
      expect(currentPlayer).to.not.be.null;
      
      // Initialize opponents scores
      const opponentsScores = initializeOpponentsScores(players, currentPlayer.id);
      expect(opponentsScores).to.have.property('2');
      expect(opponentsScores).to.not.have.property('1');
      
      // Reset opponents data
      const resetScores = resetOpponentsData(opponentsScores, 0);
      expect(resetScores['2']).to.equal(0);
    });
  });
});
