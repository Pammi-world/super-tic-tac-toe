/**
 * Tests for small board winner detection
 */
const { checkSmallBoardWinner } = require('./game');

function runTests() {
  let passed = 0;
  let failed = 0;

  const test = (name, fn) => {
    try {
      fn();
      console.log(`✓ ${name}`);
      passed++;
    } catch (e) {
      console.log(`✗ ${name}: ${e.message}`);
      failed++;
    }
  };

  const assertEquals = (actual, expected, msg) => {
    if (actual !== expected) {
      throw new Error(`${msg}: expected ${expected}, got ${actual}`);
    }
  };

  // Test 1: X wins horizontally
  test('returns X when X wins top row', () => {
    const board = [
      ['X', 'X', 'X'],
      [null, null, null],
      [null, null, null]
    ];
    assertEquals(checkSmallBoardWinner(board), 'X', 'X should win');
  });

  // Test 2: O wins vertically
  test('returns O when O wins middle column', () => {
    const board = [
      [null, 'O', null],
      [null, 'O', null],
      [null, 'O', null]
    ];
    assertEquals(checkSmallBoardWinner(board), 'O', 'O should win');
  });

  // Test 3: X wins diagonally
  test('returns X when X wins diagonal TL-BR', () => {
    const board = [
      ['X', null, null],
      [null, 'X', null],
      [null, null, 'X']
    ];
    assertEquals(checkSmallBoardWinner(board), 'X', 'X should win');
  });

  // Test 4: O wins other diagonal
  test('returns O when O wins diagonal TR-BL', () => {
    const board = [
      [null, null, 'O'],
      [null, 'O', null],
      ['O', null, null]
    ];
    assertEquals(checkSmallBoardWinner(board), 'O', 'O should win');
  });

  // Test 5: Draw when board is full
  test('returns draw when board is full with no winner', () => {
    const board = [
      ['X', 'O', 'X'],
      ['X', 'O', 'O'],
      ['O', 'X', 'X']
    ];
    assertEquals(checkSmallBoardWinner(board), 'draw', 'should be draw');
  });

  // Test 6: Active game returns null
  test('returns null when game is still in progress', () => {
    const board = [
      ['X', 'X', null],
      [null, null, null],
      [null, null, null]
    ];
    assertEquals(checkSmallBoardWinner(board), null, 'should be null');
  });

  // Test 7: Empty board returns null
  test('returns null for empty board', () => {
    const board = [
      [null, null, null],
      [null, null, null],
      [null, null, null]
    ];
    assertEquals(checkSmallBoardWinner(board), null, 'should be null');
  });

  // Test 8: O wins bottom row
  test('returns O when O wins bottom row', () => {
    const board = [
      [null, null, null],
      [null, null, null],
      ['O', 'O', 'O']
    ];
    assertEquals(checkSmallBoardWinner(board), 'O', 'O should win');
  });

  // Test 9: Invalid board returns null
  test('returns null for invalid board (null)', () => {
    assertEquals(checkSmallBoardWinner(null), null, 'should be null');
  });

  // Test 10: Invalid board returns null (wrong dimensions)
  test('returns null for invalid board (2x3)', () => {
    const board = [
      ['X', 'O', 'X'],
      ['O', 'X', 'O']
    ];
    assertEquals(checkSmallBoardWinner(board), null, 'should be null');
  });

  console.log(`\n${passed}/${passed + failed} tests passed`);
  return failed === 0;
}

// Run tests if executed directly
if (require.main === module) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runTests };