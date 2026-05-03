/**
 * Player database model with customization support
 */

// In-memory player storage for MVP (in production, use a real database)
const players = new Map();

// Pre-defined avatars (emoji-based)
const AVATARS = [
  { id: 'default', emoji: '🎮', name: 'Gamer' },
  { id: 'robot', emoji: '🤖', name: 'Robot' },
  { id: 'alien', emoji: '👽', name: 'Alien' },
  { id: 'ghost', emoji: '👻', name: 'Ghost' },
  { id: 'dragon', emoji: '🐉', name: 'Dragon' },
  { id: 'ninja', emoji: '🥷', name: 'Ninja' },
  { id: 'wizard', emoji: '🧙', name: 'Wizard' },
  { id: 'pirate', emoji: '🏴‍☠️', name: 'Pirate' },
  { id: 'astronaut', emoji: '🚀', name: 'Astronaut' },
  { id: 'king', emoji: '🤴', name: 'King' },
  { id: 'queen', emoji: '👸', name: 'Queen' },
  { id: 'cat', emoji: '🐱', name: 'Cat' }
];

/**
 * Create a new player
 * @param {string} username 
 * @returns {object} Created player
 */
function createPlayer(username) {
  const id = require('uuid').v4();
  const player = {
    id,
    username,
    displayName: username, // Defaults to username
    avatarId: 'default',
    stats: {
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      winStreak: 0,
      bestWinStreak: 0
    },
    createdAt: new Date().toISOString()
  };
  players.set(id, player);
  return player;
}

/**
 * Get player by ID
 * @param {string} id 
 * @returns {object|null}
 */
function getPlayer(id) {
  return players.get(id) || null;
}

/**
 * Get player by username
 * @param {string} username 
 * @returns {object|null}
 */
function getPlayerByUsername(username) {
  for (const player of players.values()) {
    if (player.username === username) {
      return player;
    }
  }
  return null;
}

/**
 * Update player profile
 * @param {string} id 
 * @param {object} updates 
 * @returns {object|null}
 */
function updatePlayer(id, updates) {
  const player = players.get(id);
  if (!player) return null;

  if (updates.displayName !== undefined) {
    // Sanitize display name (max 100 chars, no HTML)
    const sanitize = (str) => str.replace(/</g, '&lt;').replace(/>/g, '&gt;').substring(0, 100);
    player.displayName = sanitize(updates.displayName) || player.username;
  }

  if (updates.avatarId !== undefined && AVATARS.some(a => a.id === updates.avatarId)) {
    player.avatarId = updates.avatarId;
  }

  return player;
}

/**
 * Get player stats
 * @param {string} id 
 * @returns {object|null}
 */
function getPlayerStats(id) {
  const player = players.get(id);
  if (!player) return null;

  const { gamesPlayed, gamesWon, gamesLost, winStreak, bestWinStreak } = player.stats;
  const winRate = gamesPlayed > 0 ? ((gamesWon / gamesPlayed) * 100).toFixed(1) : '0.0';

  return {
    gamesPlayed,
    gamesWon,
    gamesLost,
    winStreak,
    bestWinStreak,
    winRate: parseFloat(winRate)
  };
}

/**
 * Update player stats after a game
 * @param {string} id 
 * @param {boolean} won 
 */
function updatePlayerStats(id, won) {
  const player = players.get(id);
  if (!player) return;

  player.stats.gamesPlayed++;
  if (won) {
    player.stats.gamesWon++;
    player.stats.winStreak++;
    player.stats.bestWinStreak = Math.max(player.stats.bestWinStreak, player.stats.winStreak);
  } else {
    player.stats.gamesLost++;
    player.stats.winStreak = 0;
  }
}

/**
 * Get available avatars
 * @returns {array}
 */
function getAvatars() {
  return AVATARS;
}

/**
 * Get leaderboard
 * @param {number} limit 
 * @returns {array}
 */
function getLeaderboard(limit = 10) {
  return Array.from(players.values())
    .sort((a, b) => b.stats.gamesWon - a.stats.gamesWon)
    .slice(0, limit)
    .map(p => ({
      id: p.id,
      displayName: p.displayName,
      avatarId: p.avatarId,
      gamesWon: p.stats.gamesWon,
      winRate: p.stats.gamesPlayed > 0 
        ? parseFloat(((p.stats.gamesWon / p.stats.gamesPlayed) * 100).toFixed(1))
        : 0
    }));
}

module.exports = {
  createPlayer,
  getPlayer,
  getPlayerByUsername,
  updatePlayer,
  getPlayerStats,
  updatePlayerStats,
  getAvatars,
  getLeaderboard,
  AVATARS
};