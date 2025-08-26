// Game board dimensions
export const ROWS = 20;
export const COLS = 10;

// Piece generation
export const SEQUENCE_LENGTH = 500; // Arbitrary large enough value for a game
export const SEED = undefined; // Optionally set for deterministic multiplayer

// LocalStorage keys
export const STORAGE_KEYS = {
  LAST_USERNAME: 'tetris_last_username',
  HIGH_SCORES: 'tetris_high_scores',
  GAME_STATS: 'tetris_game_stats',
  SELECTED_MODE: 'tetris_selected_mode'
};

// Game modes
export const GAME_MODES = {
  CLASSIC: 'classic',
  GRAVITY: 'gravity',
  INVISIBLE: 'invisible'
};

// Default values
export const DEFAULT_VALUES = {
  HIGH_SCORES: [0, 0, 0, 0, 0],
  GAME_STATS: {
    gamesPlayed: 0,
    totalScore: 0,
    totalLines: 0,
    multiplayerWins: 0,
    multiplayerGames: 0
  },
  SELECTED_MODE: GAME_MODES.CLASSIC
};

// Game timing
export const GAME_TIMING = {
  PIECE_DROP_INTERVAL: 500,
  GRAVITY_FAST_DROP: 20,
  GRAVITY_DELAY: 2000,
  INVISIBLE_FLASH_DURATION: 2000,
  PENALTY_NOTIFICATION_DURATION: 2000
};

// URL hash format regex
export const URL_HASH_REGEX = /^([A-Z0-9]+)(?:\[([^\]]+)\])?$/;
