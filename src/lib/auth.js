/**
 * Player Authentication Module - Registration, Login, JWT Auth
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

// In-memory storage (replace with database in production)
// @type {Map<string, {id, email, username, passwordHash, displayName, avatarId, createdAt, lastLogin, isActive}>}
const players = new Map();

// @type {Map<string, string>} username -> id lookup
const usernameIndex = new Map();

// @type {Map<string, string>} email -> id lookup
const emailIndex = new Map();

const router = express.Router();

// Validation helpers
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,50}$/;

function normalizeEmail(email) {
  return email.toLowerCase().trim();
}

function sanitizeUsername(username) {
  return username.trim().toLowerCase();
}

/**
 * POST /register - Create new player account
 * Body: { email, username, password }
 */
router.post('/register', async (req, res) => {
  const { email, username, password } = req.body;

  // Validate required fields
  if (!email || !username || !password) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      details: 'email, username, and password are required'
    });
  }

  // Validate email format
  const normalizedEmail = normalizeEmail(email);
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return res.status(400).json({ 
      error: 'Invalid email format'
    });
  }

  // Validate username format
  const sanitizedUsername = sanitizeUsername(username);
  if (!USERNAME_REGEX.test(sanitizedUsername)) {
    return res.status(400).json({ 
      error: 'Invalid username',
      details: 'Username must be 3-50 characters, alphanumeric and underscores only'
    });
  }

  // Validate password strength
  if (password.length < 6) {
    return res.status(400).json({ 
      error: 'Password too short',
      details: 'Password must be at least 6 characters'
    });
  }

  // Check for existing username
  if (usernameIndex.has(sanitizedUsername)) {
    return res.status(400).json({ 
      error: 'Username already taken'
    });
  }

  // Check for existing email
  if (emailIndex.has(normalizedEmail)) {
    return res.status(400).json({ 
      error: 'Email already registered'
    });
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create player
  const id = uuidv4();
  const player = {
    id,
    email: normalizedEmail,
    username: sanitizedUsername,
    passwordHash,
    displayName: username, // Keep original case
    avatarId: 'default',
    createdAt: new Date().toISOString(),
    lastLogin: null,
    isActive: true
  };

  // Store
  players.set(id, player);
  usernameIndex.set(sanitizedUsername, id);
  emailIndex.set(normalizedEmail, id);

  // Generate token
  const token = jwt.sign({ playerId: id }, JWT_SECRET, { expiresIn: JWT_EXPIRY });

  res.status(201).json({
    message: 'Registration successful',
    token,
    player: {
      id: player.id,
      username: player.displayName,
      email: player.email,
      avatarId: player.avatarId,
      createdAt: player.createdAt
    }
  });
});

/**
 * POST /login - Authenticate and get JWT
 * Body: { emailOrUsername, password }
 */
router.post('/login', async (req, res) => {
  const { emailOrUsername, password } = req.body;

  if (!emailOrUsername || !password) {
    return res.status(400).json({ 
      error: 'Missing credentials',
      details: 'emailOrUsername and password are required'
    });
  }

  // Normalize input
  const input = emailOrUsername.toLowerCase().trim();
  const isEmail = input.includes('@');
  
  // Find player
  let playerId;
  if (isEmail && emailIndex.has(input)) {
    playerId = emailIndex.get(input);
  } else if (usernameIndex.has(input)) {
    playerId = usernameIndex.get(input);
  }

  if (!playerId) {
    // Generic error to prevent info leakage
    return res.status(401).json({ 
      error: 'Invalid credentials'
    });
  }

  const player = players.get(playerId);

  // Verify password
  const valid = await bcrypt.compare(password, player.passwordHash);
  if (!valid) {
    return res.status(401).json({ 
      error: 'Invalid credentials'
    });
  }

  // Check active status
  if (!player.isActive) {
    return res.status(403).json({ 
      error: 'Account is disabled'
    });
  }

  // Update last login
  player.lastLogin = new Date().toISOString();

  // Generate token
  const token = jwt.sign({ playerId: player.id }, JWT_SECRET, { expiresIn: JWT_EXPIRY });

  res.json({
    message: 'Login successful',
    token,
    player: {
      id: player.id,
      username: player.displayName,
      email: player.email,
      avatarId: player.avatarId,
      createdAt: player.createdAt,
      lastLogin: player.lastLogin
    }
  });
});

/**
 * POST /logout - Invalidate session (client should discard token)
 */
router.post('/logout', (req, res) => {
  // In JWT-based auth, logout is handled client-side
  // For refresh tokens, we'd invalidate them here
  res.json({ message: 'Logged out successfully' });
});

/**
 * GET /me - Get current player profile
 * Header: Authorization: Bearer <token>
 */
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.slice(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const player = players.get(decoded.playerId);
    
    if (!player || !player.isActive) {
      return res.status(401).json({ error: 'Player not found or disabled' });
    }

    res.json({
      player: {
        id: player.id,
        username: player.displayName,
        email: player.email,
        avatarId: player.avatarId,
        createdAt: player.createdAt,
        lastLogin: player.lastLogin
      }
    });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

/**
 * PUT /me - Update profile info
 * Header: Authorization: Bearer <token>
 * Body: { displayName?, avatarId? }
 */
router.put('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.slice(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const player = players.get(decoded.playerId);
    
    if (!player || !player.isActive) {
      return res.status(401).json({ error: 'Player not found or disabled' });
    }

    const { displayName, avatarId } = req.body;

    // Update display name
    if (displayName) {
      // Sanitize (no HTML, max 100 chars)
      player.displayName = displayName.replace(/</g, '&lt;').replace(/>/g, '&gt;').substring(0, 100);
    }

    // Update avatar (validate against allowed avatars)
    const VALID_AVATARS = [
      'default', 'robot', 'alien', 'ghost', 'dragon', 
      'ninja', 'wizard', 'pirate', 'astronaut', 
      'king', 'queen', 'cat'
    ];
    if (avatarId && VALID_AVATARS.includes(avatarId)) {
      player.avatarId = avatarId;
    }

    res.json({
      message: 'Profile updated',
      player: {
        id: player.id,
        username: player.displayName,
        email: player.email,
        avatarId: player.avatarId
      }
    });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// Export for use in main app
module.exports = router;
module.exports.players = players;
module.exports.usernameIndex = usernameIndex;
module.exports.emailIndex = emailIndex;