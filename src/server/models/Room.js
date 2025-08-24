// Room model
class Room {
  constructor({ id, name, game = null, players = [], leaderId = null }) {
    if (!id || !name) {
      throw new Error('Room requires id and name');
    }
    this.id = id;
    this.name = name;
    this.players = players; // Array of Player instances
    this.game = game; // Game instance
    this.leaderId = leaderId; // Player id
  }

  addPlayer(player) {
    if (!player || typeof player !== 'object' || typeof player.id === 'undefined') {
      throw new Error('addPlayer requires a valid Player instance');
    }
    this.players.push(player);
    if (this.players.length === 1) {
      this.leaderId = player.id;
    }
  }

  removePlayer(playerId) {
    const idx = this.players.findIndex(p => p.id === playerId);
    if (idx === -1) {
      throw new Error('Player to remove not found in room');
    }
    this.players.splice(idx, 1);
    if (this.leaderId === playerId) {
      this.leaderId = this.players.length > 0 ? this.players[0].id : null;
    }
  }

  setLeader(playerId) {
    if (this.players.some(p => p.id === playerId)) {
      this.leaderId = playerId;
    } else {
      throw new Error('Player not found in room');
    }
  }

  isEmpty() {
    return this.players.length === 0;
  }

  isFull(maxPlayers = 6) {
    return this.players.length >= maxPlayers;
  }
}

export default Room; 