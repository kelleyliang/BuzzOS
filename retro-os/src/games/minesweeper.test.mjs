import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, neighbors, newGame, reveal, toggleFlag } from './minesweeper.js';

test('every difficulty has the exact mine count and a safe first opening', () => {
  for (const level of Object.keys(LEVELS)) {
    for (const first of [0, Math.floor(LEVELS[level].rows * LEVELS[level].cols / 2)]) {
      const game = reveal(newGame(level), first, () => 0.37);
      assert.equal(game.cells.filter(cell => cell.mine).length, game.mines);
      assert.equal(game.cells[first].count, 0);
      assert.ok(game.cells[first].revealed);
      for (const cellIndex of neighbors(first, game.rows, game.cols)) {
        assert.equal(game.cells[cellIndex].mine, false);
      }
      game.cells.forEach((cell, index) => {
        assert.equal(cell.count, neighbors(index, game.rows, game.cols).filter(i => game.cells[i].mine).length);
      });
    }
  }
});

test('flags block revealing and actions do not mutate the previous board', () => {
  const original = newGame('beginner');
  const flagged = toggleFlag(original, 0);
  assert.equal(original.cells[0].flagged, false);
  assert.equal(reveal(flagged, 0), flagged);
  assert.equal(toggleFlag(flagged, 0).cells[0].flagged, false);
});

function smallBoard() {
  return {
    rows: 2, cols: 2, mines: 1, status: 'playing',
    cells: Array.from({ length: 4 }, (_, index) => ({
      mine: index === 0, count: index === 0 ? 0 : 1, revealed: false, flagged: false,
    })),
  };
}

test('hitting a mine loses and terminal games cannot change', () => {
  const lost = reveal(smallBoard(), 0);
  assert.equal(lost.status, 'lost');
  assert.ok(lost.cells[0].exploded);
  assert.equal(reveal(lost, 1), lost);
  assert.equal(toggleFlag(lost, 1), lost);
});

test('revealing all safe cells wins and flags the remaining mines', () => {
  let game = smallBoard();
  for (const index of [1, 2, 3]) game = reveal(game, index);
  assert.equal(game.status, 'won');
  assert.ok(game.cells[0].flagged);
});

test('matching flags clear neighbors; incorrect matching flags can lose', () => {
  const opened = reveal(smallBoard(), 3);
  assert.equal(reveal(opened, 3), opened);
  assert.equal(reveal(toggleFlag(opened, 0), 3).status, 'won');
  assert.equal(reveal(toggleFlag(opened, 1), 3).status, 'lost');
});
