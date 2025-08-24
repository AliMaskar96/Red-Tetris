# Red Tetris - Project Requirements

## Overview
Develop a networked multiplayer Tetris game using Full Stack JavaScript with real-time communication between players.

## Core Game Requirements

### Game Mechanics
- **Grid**: 10 columns × 20 rows playing field
- **Pieces**: Standard Tetris tetrominos with rotation mechanics
- **Movement**: Left/Right arrows (horizontal), Up arrow (rotation), Down arrow (soft drop), Spacebar (hard drop)
- **Line Clearing**: When lines are completed, they disappear
- **Penalty System**: When a player clears n lines, other players receive n-1 indestructible penalty lines at the bottom
- **Win Condition**: Last player standing wins
- **Piece Sequence**: All players in the same game receive identical piece sequences
- **Piece Physics**: Pieces fall at constant speed, stick to pile on next step after contact (allows position adjustment)

### Multiplayer Features
- **Room-based Games**: Players join games via URL hash format
- **Game Lobby**: Players can observe opponents' names and field spectra
- **Spectral View**: Show height of each column for opponents (first occupied line per column)
- **Real-time Updates**: All changes broadcast to all players immediately
- **Game States**: Waiting, Playing, Game Over
- **Solo Play**: Must support single-player mode

## Technical Architecture Requirements

### Technology Stack
- **Language**: JavaScript (latest version)
- **Server**: Node.js with Socket.io
- **Client**: Browser-based Single Page Application
- **Communication**: HTTP + Socket.io for real-time bidirectional events
- **No Persistence**: No database required

### Server Requirements (Node.js)
- **Programming Style**: Object-oriented (prototypes)
- **Required Classes**: Player, Piece, Game (minimum)
- **Responsibilities**: 
  - Game and player management
  - Piece distribution (same sequence for all players)
  - Spectrum broadcasting
  - Room management
- **Architecture**: Asynchronous event loop
- **HTTP Service**: Serve index.html, bundle.js, and static resources

### Client Requirements (Browser)
- **Programming Style**: Functional (NO "this" keyword except for Error subclasses)
- **Framework**: React (with functional components and Hooks)
- **State Management**: Redux
- **Architecture**: Single Page Application
- **Bundle**: All client code in bundle.js
- **Layout**: CSS Grid or Flexbox (NO tables, Canvas, SVG)
- **Pure Functions**: Game logic (heap and piece handling) must be pure functions

### URL Structure
```
http://<server>:<port>/#<room>[<player_name>]
```
- `room`: Game room name
- `player_name`: Player identifier

### Game Management
- **Room Leader**: First player to join becomes leader
- **Leader Powers**: Can start game, restart game
- **Join Restrictions**: Players cannot join during active games
- **Leadership Transfer**: If leader leaves during game, role transfers to remaining player
- **Multiple Games**: Server supports concurrent games

## Prohibited Technologies
- jQuery or DOM manipulation libraries
- Canvas API
- SVG (Scalable Vector Graphics)
- HTML `<table>` elements

## Testing Requirements
- **Coverage Targets**:
  - Statements: ≥70%
  - Functions: ≥70% 
  - Lines: ≥70%
  - Branches: ≥50%
- **Framework**: Unit tests with coverage reporting
- **Purpose**: Ensure reliability and reduce time-to-market

## Recommended Libraries
- **Functional**: lodash, ramda (optional - ES6+ has built-in alternatives)
- **Immutability**: Immutable.js (optional - ES6+ spread syntax available)
- **Async Redux**: redux-thunk or redux-promise
- **Socket Communication**: socket.io

## Security Requirements
- **Credentials**: Store in .env file, git-ignored
- **No Public Credentials**: Any exposed credentials = project failure

## Performance Requirements
- **Real-time Communication**: Minimal latency for multiplayer experience
- **Smooth Animation**: Consistent piece movement and game updates
- **Browser Compatibility**: Modern evergreen browsers

## UI/UX Requirements
- **Responsive Design**: Adapt to different screen sizes
- **Visual Elements**:
  - Own playing field
  - Opponent list with names
  - Opponent field spectra (column heights)
  - Next piece preview
  - Game status indicators
- **Controls**: Keyboard-based piece movement
- **Real-time Updates**: Immediate visual feedback for all actions

## Functional Requirements Summary

### Must Have (Mandatory)
1. Multiplayer Tetris with penalty system
2. Real-time communication via Socket.io
3. Room-based game management
4. Functional client code (no "this")
5. Object-oriented server code
6. React + Redux architecture
7. 70%+ test coverage
8. URL-based room joining
9. Opponent spectrum visualization
10. Solo play capability

### Bonus Features (Optional)
1. Scoring system with persistence
2. Multiple game modes (invisible pieces, increased gravity)
3. Alternative FRP implementation with flyd
4. Enhanced UI/UX features

## Development Workflow
1. Use provided boilerplate for initial setup
2. Implement server-side game logic first
3. Build client-side UI and state management
4. Integrate real-time communication
5. Add comprehensive testing
6. Optimize and polish