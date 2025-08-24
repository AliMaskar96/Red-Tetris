# Red Tetris Socket Events Documentation

This document details the implementation of all core socket.io events for the Red Tetris multiplayer game.

---

## Event List

### 1. `join-room`
- **Direction:** Client → Server
- **Payload:** `{ roomId: string, playerName: string }`
- **Description:**
  - Client requests to join a game room. Server creates the room/game if it doesn't exist, creates a Player, assigns leader if first, and adds the player to the room.
  - Server responds with `room-joined` to all clients in the room.

### 2. `room-joined`
- **Direction:** Server → Clients (room)
- **Payload:** `{ game: { id, status }, players: [{ id, name, isLeader }] }`
- **Description:**
  - Broadcasts the current room and player list to all clients in the room after a join.

### 3. `start-game`
- **Direction:** Client (leader) → Server
- **Payload:** `{ gameId: string }`
- **Description:**
  - Only the room leader can start the game. Server generates a deterministic piece sequence, sets all players to alive, and updates game state.
  - Server responds with `game-started` and `next-piece`.

### 4. `game-started`
- **Direction:** Server → Clients (room)
- **Payload:** `{ gameId: string, firstPiece: string }`
- **Description:**
  - Notifies all players that the game has started and provides the first piece.

### 5. `next-piece`
- **Direction:** Server → Clients (room)
- **Payload:** `{ piece: string }`
- **Description:**
  - Broadcasts the next piece in the sequence to all players.

### 6. `player-move`
- **Direction:** Client → Server → Other Clients (room)
- **Payload:** `{ playerId: string, move: 'left'|'right'|'rotate'|'down'|'drop' }`
- **Description:**
  - Client notifies the server of a move. Server broadcasts the move to other players in the room for animation/spectra updates.

### 7. `piece-placed`
- **Direction:** Client → Server
- **Payload:** `{ playerId: string, piece: string, newBoard: number[][] }`
- **Description:**
  - Client notifies the server that a piece has been placed. Server updates the player's board, generates the next piece, updates the spectrum, and broadcasts `player-board-updated` and `next-piece`.

### 8. `player-board-updated`
- **Direction:** Server → Clients (room)
- **Payload:** `{ playerId: string, board: number[][], spectrum: number[] }`
- **Description:**
  - Broadcasts the updated board and spectrum for a player to all clients in the room.

### 9. `lines-cleared`
- **Direction:** Client → Server
- **Payload:** `{ playerId: string, linesCount: number }`
- **Description:**
  - Client notifies the server of lines cleared. Server distributes penalty lines to other players and broadcasts `penalty-lines`.

### 10. `penalty-lines`
- **Direction:** Server → Clients (room)
- **Payload:** `{ playerId: string, count: number }`
- **Description:**
  - Notifies a player to add penalty lines to their board.

### 11. `game-over`
- **Direction:** Client → Server
- **Payload:** `{ playerId: string }`
- **Description:**
  - Client notifies the server that the player is out. Server marks the player as not alive, checks for a winner, and broadcasts `game-ended` if only one player remains.

### 12. `game-ended`
- **Direction:** Server → Clients (room)
- **Payload:** `{ winner: { id: string, name: string } }`
- **Description:**
  - Announces the winner to all players in the room.

### 13. `player-disconnected`
- **Direction:** Server → Clients (room)
- **Payload:** `{ playerId: string }`
- **Description:**
  - Notifies all clients in the room that a player has disconnected or is out.

---

## Event Flow Example
1. Players join a room (`join-room` → `room-joined`).
2. Leader starts the game (`start-game` → `game-started`, `next-piece`).
3. Players move and place pieces (`player-move`, `piece-placed` → `player-board-updated`, `next-piece`).
4. When lines are cleared, penalty lines are distributed (`lines-cleared` → `penalty-lines`).
5. When a player is out, server checks for winner (`game-over` → `game-ended`).
6. Disconnections are handled (`player-disconnected`).

---

## Notes
- All events are real-time and use Socket.io rooms for efficient broadcasting.
- The server maintains in-memory state for rooms, games, and players.
- Piece sequences are deterministic for fairness in multiplayer. 