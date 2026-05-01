# Super Tic Tac Toe - Project Documentation

## Project Overview

**Super Tic Tac Toe** (also known as Ultimate Tic Tac Toe) is a web-based game where players compete on a 3×3 grid of 3×3 Tic Tac Toe boards.

### Rules
1. Each small board is a standard 3×3 Tic Tac Toe
2. Winning a small board claims that cell in the big 3×3 board
3. **Special Rule**: Next player must play in the board matching their move position (e.g., if you play in cell (1,2), next player plays in board #2)
4. If target board is won/drawn, player can play anywhere

### MVP Features
- Player name input
- Hot seat mode (2 players)
- AI opponent mode
- Win/draw detection (small + big boards)
- Won board display
- Restart button

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Express.js (Node.js) |
| Frontend | EJS templates + vanilla HTML/CSS/JS |
| No framework | Keep it simple for MVP |

### Dependencies
```json
{
  "express": "^4.18.2",
  "ejs": "^3.1.9"
}
```

---

## Repository Structure

```
/data/workspace-dev/repositories/super-tic-tac-toe/
├── index.js          # Express server (main entry)
├── package.json    # Dependencies
├── views/           # EJS templates
│   ├── index.ejs   # Setup form
│   └── game.ejs    # Game board
└── public/          # Static files
    └── style.css   # Styling
```

---

## Task Dependency Order

| Order | Task ID | Task Name | Depends On |
|-------|--------|----------|-----------|
| 1 | TASK-32 | Initialize project structure | - (first) |
| 2 | TASK-33 | Render game board | TASK-32 |
| 3 | TASK-34 | Player creation | TASK-33 |
| 4 | TASK-35 | Game mode selection | TASK-34 |
| 5 | TASK-36 | Move enforcement | TASK-33 |
| 6 | TASK-37 | Win/draw detection | TASK-36 |
| 7 | TASK-38 | Won board display | TASK-37 |
| 8 | TASK-39 | Restart button | TASK-37 |
| 9 | TASK-40 | AI opponent | TASK-35, TASK-36 |

---

## Task Details

### TASK-32: Initialize Project Structure
**Status:** ✅ Complete

**Description:** Set up Express + EJS server with routing.

**Files:**
- `index.js`
- `package.json`
- `views/index.ejs`
- `views/game.ejs`
- `public/style.css`

**Libraries:** express, ejs (installed via npm install)

---

### TASK-33: Render Game Board
**Status:** ✅ Done (in initial commit)

**Order:** 2 | **Depends On:** TASK-32

**Description:** Render a 3×3 grid of 3×3 boards in the browser with CSS grid.

**Tech:**
- Express.js with EJS templates
- CSS Grid for layout
- No additional libraries

**Implementation:**
1. Edit `views/game.ejs` - loop through 9 small boards, each with 9 cells
2. Edit `public/style.css` - CSS grid for `.super-board` (3×3), `.small-board` (3×3 cells each)
3. Mark active board with `.active` class

**Files Changed:**
- `views/game.ejs`
- `public/style.css`

**Test Checklist:**
- [ ] All 81 cells visible
- [ ] Active board highlighted
- [ ] Clicking cells triggers /play route

**Branch:** `git checkout -b agent/task-render-board`

---

### TASK-34: Player Creation
**Order:** 3 | **Depends On:** TASK-33

**Description:** Allow players to enter names at game start.

**Tech:**
- Express.js body-parser (built-in with `express.urlencoded`)
- EJS form inputs

**Implementation:**
1. Add input fields in `views/index.ejs` for player1 and player2 names
2. Add route `/setup` that reads `req.body.player1`, `req.body.player2`
3. Store names in `game.players[].name`
4. Pass to `game.ejs` via render

**Files Changed:**
- `views/index.ejs`
- `src/index.js`

**Test Checklist:**
- [ ] Form accepts two player names
- [ ] Names display on game page during play

**Branch:** `git checkout -b agent/task-player-creation`

---

### TASK-35: Game Mode Selection
**Order:** 3 | **Depends On:** TASK-34

**Description:** Select between Hot Seat (2 players) or vs AI mode.

**Tech:**
- Same stack as TASK-34

**Implementation:**
1. Add `<select name="mode">` in `views/index.ejs`
2. Options: `hotseat`, `ai`
3. In `/setup`, read `req.body.mode`
4. Store in `game.mode`
5. If mode === 'ai', set player2 name to "AI"

**Files Changed:**
- `views/index.ejs`
- `src/index.js`

**Branch:** `git checkout -b agent/task-game-mode`

---

### TASK-36: Move Enforcement
**Order:** 5 | **Depends On:** TASK-33

**Description:** Enforce special rule - next player plays in board matching their move position.

**Tech:**
- Express.js game state management

**Implementation:**
1. Track `activeBoard` in game state (initially `null`)
2. On each move at `cellIndex`, set `activeBoard = cellIndex`
3. In `/play` route, validate:
   ```javascript
   if (game.activeBoard !== null && board !== game.activeBoard) {
     // reject move
   }
   ```
4. If target board is won/drawn, allow any board (`activeBoard = null`)

**Files Changed:**
- `src/index.js`

**Test Checklist:**
- [ ] After playing (1,2), next player restricted to board 2
- [ ] After small board won, can play anywhere

**Branch:** `git checkout -b agent/task-move-enforcement`

---

### TASK-37: Win/Draw Detection
**Order:** 6 | **Depends On:** TASK-36

**Description:** Detect wins on small boards and big board.

**Tech:**
- JavaScript array manipulation
- Win detection algorithm

**Implementation:**
1. Create function `checkBoardWin(board)` checking all 8 lines:
   - 3 rows: [0,0]-[0,1]-[0,2], [1,*], [2,*]
   - 3 cols: [*0],[*1],[*2]
   - 2 diagonals: [0,0]-[1,1]-[2,2], [0,2]-[1,1]-[2,0]
2. After each move, check small board for win
3. If small board won, fill entire board with winner symbol
4. Check big board (center cell of each small board = winner indicator)

**Files Changed:**
- `src/index.js`

**Test Checklist:**
- [ ] X wins small board at (0,0),(0,1),(0,2)
- [ ] Big board shows winner after 3 small board wins

**Branch:** `git checkout -b agent/task-win-detection`

---

### TASK-38: Won Board Display
**Order:** 7 | **Depends On:** TASK-37

**Description:** Display large X/O when small board is won.

**Tech:**
- EJS conditionals

**Implementation:**
1. In `game.ejs`, check if cell === 'X' or 'O' (won board)
2. Display large X/O instead of empty cells
3. Add CSS class `.won-x`, `.won-o` for styling

**Files Changed:**
- `views/game.ejs`
- `public/style.css`

**Test Checklist:**
- [ ] After X wins small board, show big X in that cell

**Branch:** `git checkout -b agent/task-won-display`

---

### TASK-39: Restart Button
**Order:** 8 | **Depends On:** TASK-37

**Description:** Reset game but keep players and mode.

**Tech:**
- Express.js route

**Implementation:**
1. Add route `/restart`
2. Copy player names and mode to temp
3. Call `initGame(mode)`
4. Restore names
5. Link in `game.ejs`

**Files Changed:**
- `src/index.js`
- `views/game.ejs`

**Test Checklist:**
- [ ] Click restart, board resets
- [ ] Player names stay

**Branch:** `git checkout -b agent/task-restart`

---

### TASK-40: AI Opponent
**Order:** 9 | **Depends On:** TASK-35, TASK-36

**Description:** Computer plays against human player.

**Tech:**
- JavaScript AI logic (simple)

**Implementation (Basic AI):**
1. After human moves, if `game.mode === 'ai'`, computer moves
2. Find valid moves (empty cells in active board)
3. Pick random valid move

**Implementation (Better AI):**
1. Check if AI can win → take winning move
2. Check if opponent can win → block
3. Otherwise, random

**Files Changed:**
- `src/index.js`

**Test Checklist:**
- [ ] Select "vs AI" mode
- [ ] Computer makes valid moves
- [ ] Computer tries to win/block

**Branch:** `git checkout -b agent/task-ai-opponent`

---

## Git Workflow

```bash
# 1. Create branch
git checkout -b agent/[task-id]-[description]

# 2. Make changes
# ... edit files ...

# 3. Commit
git add -A
git commit -m "TASK-[id]: Description"

# 4. Push
git push -u origin agent/[task-id]-[description]

# 5. Open PR (NOT push to main!)
```

---

## Running Locally

```bash
cd /data/workspace-dev/repositories/super-tic-tac-toe
npm install
PORT=3001 node index.js
# Visit http://localhost:3001
```

---

## Links

- **Repo:** https://github.com/Pammi-world/super-tic-tac-toe
- **Notion Project:** See Notion database
- **Express Docs:** https://expressjs.com/
- **EJS Docs:** https://ejs.co/
- **CSS Grid Guide:** https://css-tricks.com/snippets/css/complete-guide-grid/