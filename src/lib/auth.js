// Authentication module for player registration and login
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// In-memory storage (replace with database in production)
const players = new Map();

// JWT secrets
const JWT_SECRET = process.env.JWT_SECRET || 'super-tic-tac-toe-secret-key-change-in-production';
const JWT_EXPIRY = '7d';

// Validation helpers
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validateUsername(username) {
  return /^[a-zA-Z0-9_]{3,50}$/.test(username);
}

function validatePassword(password) {
  return password && password.length >= 6;
}

// Generate unique player ID
function generatePlayerId() {
  return crypto.randomUUID();
}

// Register new player
async function register(email, username, password) {
  if (!validateEmail(email)) {
    throw new Error('Invalid email format');
  }
  if (!validateUsername(username)) {
    throw new Error('Username must be 3-50 alphanumeric characters');
  }
  if (!validatePassword(password)) {
    throw new Error('Password must be at least 6 characters');
  }
  
  // Check duplicates
  for (const player of players.values()) {
    if (player.email === email) {
      throw new Error('Email already registered');
    }
    if (player.username === username) {
      throw new Error('Username already taken');
    }
  }
  
  const id = generatePlayerId();
  const passwordHash = await bcrypt.hash(password, 12);
  
  const player = {
    id,
    email,
    username,
    passwordHash,
    displayName: username,
    avatarId: 'default',
    createdAt: new Date().toISOString(),
    lastLogin: null,
    stats: { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, winStreak: 0 }
  };
  
  players.set(id, player);
  return { id, email, username };
}

// Login player
function login(emailOrUsername, password) {
  let player = null;
  
  for (const p of players.values()) {
    if (p.email === emailOrUsername || p.username === emailOrUsername) {
      player = p;
      break;
    }
  }
  
  if (!player) {
    throw new Error('Invalid credentials');
  }
  
  const valid = bcrypt.compareSync(password, player.passwordHash);
  if (!valid) {
    throw new Error('Invalid credentials');
  }
  
  player.lastLogin = new Date().toISOString();
  players.set(player.id, player);
  
  const token = jwt.sign({ playerId: player.id }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  return { token, player: { id: player.id, username: player.username, displayName: player.displayName } };
}

// Verify JWT token
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.playerId;
  } catch (err) {
    return null;
  }
}

// Get player by ID
function getPlayer(playerId) {
  const player = players.get(playerId);
  if (!player) return null;
  
  return {
    id: player.id,
    email: player.email,
    username: player.username,
    displayName: player.displayName,
    avatarId: player.avatarId,
    createdAt: player.createdAt,
    lastLogin: player.lastLogin,
    stats: player.stats
  };
}

// Update player profile
function updatePlayer(playerId, updates) {
  const player = players.get(playerId);
  if (!player) {
    throw new Error('Player not found');
  }
  
  if (updates.displayName) {
    player.displayName = updates.displayName.slice(0, 100);
  }
  if (updates.avatarId) {
    player.avatarId = updates.avatarId;
  }
  
  players.set(playerId, player);
  return getPlayer(playerId);
}

module.exports = {
  register,
  login,
  verifyToken,
  getPlayer,
  updatePlayer,
  players
};
