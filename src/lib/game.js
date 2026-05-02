/**
 * Tic-tac-toe game logic utilities
 */

/**
 * Check for a winner on a single 3x3 tic-tac-toe board
 * @param {(string|null)[][]} board - 3x3 array of cell values
 * @returns {'X' | 'O' | 'draw' | null} - Winner, 'draw', or null if still active
 */
function checkSmallBoardWinner(board) {
  if (!board || board.length !== 3 || !board[0] || board[0].length !== 3) {
    return null;
  }

  // All 8 possible win patterns for tic-tac-toe
  const winPatterns = [
    [[0, 0], [0, 1], [0, 2]], // Top row
    [[1, 0], [1, 1], [1, 2]], // Middle row
    [[2, 0], [2, 1], [2, 2]], // Bottom row
    [[0, 0], [1, 0], [2, 0]], // Left column
    [[0, 1], [1, 1], [2, 1]], // Middle column
    [[0, 2], [1, 2], [2, 2]], // Right column
    [[0, 0], [1, 1], [2, 2]], // Diagonal top-left to bottom-right
    [[0, 2], [1, 1], [2, 0]]  // Diagonal top-right to bottom-left
  ];

  // Check for a winner
  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    const aVal = board[a[0]][a[1]];
    const bVal = board[b[0]][b[1]];
    const cVal = board[c[0]][c[1]];

    if (aVal && aVal === bVal && aVal === cVal) {
      return aVal; // Returns 'X' or 'O'
    }
  }

  // Check if board is full (draw)
  const isFull = board.every(row => row.every(cell => cell !== null));
  if (isFull) {
    return 'draw';
  }

  // Game still in progress
  return null;
}

/**
 * Check for a winner on any 2D array board (legacy function)
 * @param {(string|null)[][]} board - 2D array of cell values
 * @returns {string|null} - Winner symbol or null
 */
function checkBoardWin(board) {
  if (!board || board.length === 0) {
    return null;
  }

  const rows = board.length;
  const cols = board[0]?.length || 0;
  if (rows < 3 || cols < 3) {
    return null;
  }

  // Build list of valid win lines based on board dimensions
  const lines = [];

  // Horizontal lines
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c <= cols - 3; c++) {
      lines.push([[r, c], [r, c + 1], [r, c + 2]]);
    }
  }

  // Vertical lines
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r <= rows - 3; r++) {
      lines.push([[r, c], [r + 1, c], [r + 2, c]]);
    }
  }

  // Diagonal lines (top-left to bottom-right)
  for (let r = 0; r <= rows - 3; r++) {
    for (let c = 0; c <= cols - 3; c++) {
      lines.push([[r, c], [r + 1, c + 1], [r + 2, c + 2]]);
    }
  }

  // Diagonal lines (top-right to bottom-left)
  for (let r = 0; r <= rows - 3; r++) {
    for (let c = 2; c < cols; c++) {
      lines.push([[r, c], [r + 1, c - 1], [r + 2, c - 2]]);
    }
  }

  // Check each line for a winner
  for (const line of lines) {
    const [a, b, c] = line;
    const aVal = board[a[0]][a[1]];
    const bVal = board[b[0]][b[1]];
    const cVal = board[c[0]][c[1]];

    if (aVal && aVal === bVal && aVal === cVal) {
      return aVal;
    }
  }

  return null;
}

module.exports = {
  checkSmallBoardWinner,
  checkBoardWin
};