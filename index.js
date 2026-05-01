const express = require('express');

const app = express();
const PORT = process.env.PORT || 3001;

// View engine
app.set('view engine', 'ejs');
app.set('views', './views');

// Static files
app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));

// Game state (in-memory for MVP)
let game = null;

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

// Routes
app.get('/', (req, res) => {
  res.render('index', { game });
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

app.get('/restart', (req, res) => {
  const mode = game?.mode || 'hotseat';
  const p1Name = game?.players[0].name || '';
  const p2Name = game?.players[1].name || '';
  game = initGame(mode);
  game.players[0].name = p1Name;
  game.players[1].name = p2Name;
  res.redirect('/game');
});

app.listen(PORT, () => {
  console.log(`Super Tic Tac Toe running at http://localhost:${PORT}`);
});