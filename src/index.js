const express = require('express');
const http = require('http');
const { createWebSocketServer, getActiveLobbies } = require('./lib/websocket');
const { createPlayer, getPlayer, updatePlayer, getPlayerStats, getAvatars, getLeaderboard, updatePlayerStats } = require('./lib/players');
const authRouter = require('./lib/auth');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize WebSocket server
createWebSocketServer(server);

// View engine
app.set('view engine', 'ejs');
app.set('views', './views');

// Static files
app.use(express.static('./public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Authentication routes
app.use('/api/auth', authRouter);

// Types
/** @typedef {{ name: string, symbol: string }} Player */
/** @typedef {{ players: Player[], currentPlayer: number, board: (string|null)[][][][], activeBoard: number|null, winner: string|null, isDraw: boolean, mode: string }} Game */

// Game state (in-memory for MVP)
/** @type {Game|null} */
let game = null;

/** @returns {Game} */
function initGame(mode = 'hotseat') {
  return {
    players: [
      { name: '', symbol: 'X' },
      { name: '', symbol: 'O' }
    ],
    currentPlayer: 0,
    board: Array(9).fill(null).map(() => Array(3).fill(null).map(() => Array(3).fill(null))),
    activeBoard: null,
    winner: null,
    isDraw: false,
    mode
  };
}

/** @param {(string|null)[][]} board @returns {string|null} */
function checkBoardWin(board) {
  const lines = [
    [[0,0], [0,1], [0,2]],
    [[1,0], [1,1], [1,2]],
    [[2,0], [2,1], [2,2]],
    [[0,0], [1,0], [2,0]],
    [[0,1], [1,1], [2,1]],
    [[0,2], [1,2], [2,2]],
    [[0,0], [1,1], [2,2]],
    [[0,2], [1,1], [2,0]]
  ];

  for (const line of lines) {
    const [a, b, c] = line;
    const v = board[a[0]][a[1]];
    if (v && v === board[b[0]][b[1]] && v === board[c[0]][c[1]]) {
      return v;
    }
  }
  return null;
}

// API Routes for Online Multiplayer
app.get('/api/lobbies', (req, res) => {
  const lobbies = getActiveLobbies();
  res.json({ lobbies });
});

// Player Profile API Routes

// GET /api/avatars - Get available avatars
app.get('/api/avatars', (req, res) => {
  res.json({ avatars: getAvatars() });
});

// GET /api/players/me - Get current player profile (mock for MVP, uses playerId query param)
app.get('/api/players/me', (req, res) => {
  const playerId = req.query.playerId;
  if (!playerId) {
    return res.status(400).json({ error: 'playerId required' });
  }
  const player = getPlayer(playerId);
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }
  res.json({ player });
});

// PUT /api/players/me - Update current player profile
app.put('/api/players/me', (req, res) => {
  const playerId = req.query.playerId;
  if (!playerId) {
    return res.status(400).json({ error: 'playerId required' });
  }
  const player = updatePlayer(playerId, req.body);
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }
  res.json({ player });
});

// GET /api/players/me/stats - Get player statistics
app.get('/api/players/me/stats', (req, res) => {
  const playerId = req.query.playerId;
  if (!playerId) {
    return res.status(400).json({ error: 'playerId required' });
  }
  const stats = getPlayerStats(playerId);
  if (!stats) {
    return res.status(404).json({ error: 'Player not found' });
  }
  res.json({ stats });
});

// GET /api/players/leaderboard - Get top players by wins
app.get('/api/players/leaderboard', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const leaderboard = getLeaderboard(limit);
  res.json({ leaderboard });
});

// Routes
app.get('/', (req, res) => {
  res.render('index', { game, lobbies: [] });
});

app.post('/setup', (req, res) => {
  const { player1, player2, mode } = req.body;
  game = initGame(mode);
  game.players[0].name = player1 || 'Player 1';
  game.players[1].name = mode === 'ai' ? 'AI' : (player2 || 'Player 2');
  res.redirect('/game');
});

app.get('/game', (req, res) => {
  if (!game) {
    return res.redirect('/');
  }
  res.render('game', { game });
});

app.get('/online', (req, res) => {
  const playerId = req.query.playerId;
  if (!playerId) {
    return res.redirect('/');
  }
  res.render('online', { playerId });
});

app.post('/play', (req, res) => {
  if (!game || game.winner || game.isDraw) {
    return res.redirect('/game');
  }

  const boardIdx = parseInt(req.body.board);
  const cellIdx = parseInt(req.body.cell);
  
  // Validate move
  if (game.activeBoard !== null && boardIdx !== game.activeBoard) {
    return res.redirect('/game');
  }
  const row = Math.floor(cellIdx / 3);
  const col = cellIdx % 3;
  if (game.board[boardIdx][row][col] !== null) {
    return res.redirect('/game');
  }

  // Make move
  game.board[boardIdx][row][col] = game.players[game.currentPlayer].symbol;

  // Check for small board win
  const smallWinner = checkBoardWin(game.board[boardIdx]);
  if (smallWinner) {
    game.board[boardIdx] = Array(3).fill(null).map(() => Array(3).fill(smallWinner));
  }

  // Check for draw on small board
  if (!smallWinner && game.board[boardIdx].flat().every(c => c !== null)) {
    game.board[boardIdx] = Array(3).fill(null).map(() => Array(3).fill('D'));
  }

  // Check for big board win
  const bigWinner = checkBoardWin(game.board.map(b => {
    const center = b[0][0];
    return (center === 'X' || center === 'O') ? center : null;
  }));

  if (bigWinner) {
    game.winner = bigWinner;
  } else if (game.board.every(b => b[0][0] !== null)) {
    game.isDraw = true;
  }

  // Set next active board
  game.activeBoard = smallWinner ? null : cellIdx;

  // Switch player
  game.currentPlayer = 1 - game.currentPlayer;

  res.redirect('/game');
});

app.get('/restart', (req, res) => {
  const mode = game?.mode || 'hotseat';
  const p1Name = game?.players[0].name || '';
  const p2Name = game?.players[1].name || '';
  game = initGame(mode);
  game.players[0].name = p1Name;
  game.players[1].name = p2Name;
  res.redirect('/game');
});

// Start server
app.listen(PORT, () => {
  console.log(`Super Tic Tac Toe running at http://localhost:${PORT}`);
  console.log(`WebSocket server running at ws://localhost:${PORT}/ws`);
});