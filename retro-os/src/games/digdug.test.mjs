import test from 'node:test';
import assert from 'node:assert/strict';
import { COLS, ROWS, cellIndex, createGame, stepGame } from './digdug.js';

const DT = 1 / 60;
function play(game, seconds, input = {}) {
  for (let i = 0; i < Math.round(seconds / DT); i++) game = stepGame(game, input, DT);
  return game;
}
function fixture() {
  const game = { ...createGame(), status: 'playing' };
  game.player = { x: 5, y: 5, facing: 'right', moveClock: 1, protectedFor: 0 };
  game.rocks = [];
  game.dirt.fill(true);
  // A distant survivor keeps tests from accidentally advancing the level.
  game.enemies = [{ x: 18, y: 16, spawn: { x: 18, y: 16 }, id: 9, inflation: 0, sincePumped: 0, moveClock: 0 }];
  game.dirt[cellIndex(5, 5)] = false;
  return game;
}
function bug(x, y, id = 0) {
  return { x, y, id, spawn: { x, y }, inflation: 0, sincePumped: 0, moveClock: 0 };
}

test('starting enemy pockets have no open route to the main shaft at any level', () => {
  for (const level of [1, 2, 3, 4, 5, 6, 20]) {
    const game = createGame(level);
    const reachable = new Set([cellIndex(game.player.x, game.player.y)]);
    const queue = [{ x: game.player.x, y: game.player.y }];
    for (let head = 0; head < queue.length; head++) {
      const { x, y } = queue[head];
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
        const index = cellIndex(nx, ny);
        if (game.dirt[index] || reachable.has(index)) continue;
        reachable.add(index);
        queue.push({ x: nx, y: ny });
      }
    }
    for (const enemy of game.enemies) {
      assert.equal(game.dirt[cellIndex(enemy.x, enemy.y)], false);
      assert.equal(reachable.has(cellIndex(enemy.x, enemy.y)), false, `Level ${level}, bug ${enemy.id}`);
    }
  }
});

test('digging opens dirt, scores once, and preserves the previous state', () => {
  const before = fixture();
  const after = stepGame(before, { direction: 'right' }, DT);
  assert.equal(after.player.x, 6);
  assert.equal(after.dirt[cellIndex(6, 5)], false);
  assert.equal(after.score, 10);
  assert.equal(before.player.x, 5);
  assert.equal(before.dirt[cellIndex(6, 5)], true);
  const returned = play(after, 0.2, { direction: 'left' });
  assert.equal(returned.score, 10);
});

test('the player cannot leave the grid or move through rocks', () => {
  for (const [x, y, direction] of [[0, 5, 'left'], [COLS - 1, 5, 'right'], [5, 1, 'up'], [5, ROWS - 1, 'down']]) {
    const game = fixture();
    Object.assign(game.player, { x, y });
    const next = stepGame(game, { direction }, DT);
    assert.equal(next.player.x, x);
    assert.equal(next.player.y, y);
  }
  const game = fixture();
  game.rocks = [{ x: 6, y: 5, state: 'supported', clock: 0 }];
  assert.equal(stepGame(game, { direction: 'right' }, DT).player.x, 5);
});

test('enemies follow a turning tunnel and cannot dig toward the player', () => {
  const game = fixture();
  game.enemies = [bug(8, 7)];
  for (const [x, y] of [[8, 7], [8, 6], [8, 5], [7, 5], [6, 5]]) game.dirt[cellIndex(x, y)] = false;
  const next = play(game, 0.8);
  assert.equal(next.enemies[0].x, 8);
  assert.equal(next.enemies[0].y, 6);
  const isolated = fixture();
  isolated.enemies = [bug(7, 5)];
  isolated.dirt[cellIndex(7, 5)] = false;
  assert.equal(play(isolated, 1).enemies[0].x, 7);
  assert.equal(play(isolated, 1).dirt[cellIndex(6, 5)], true);
});

test('holding the pump immobilizes and pops a nearby enemy', () => {
  const game = fixture();
  game.enemies.unshift(bug(7, 5));
  game.dirt[cellIndex(6, 5)] = false;
  game.dirt[cellIndex(7, 5)] = false;
  const inflated = play(game, 0.5, { pump: true });
  assert.ok(inflated.enemies[0].inflation > 0.4);
  assert.equal(inflated.enemies[0].x, 7);
  assert.equal(inflated.player.x, 5);
  const popped = play(inflated, 0.8, { pump: true });
  assert.equal(popped.enemies.length, 1);
  assert.equal(popped.score, 200);
});

test('pump respects facing, range, dirt, and rocks', () => {
  for (const condition of ['dirt', 'rock', 'range', 'behind']) {
    const game = fixture();
    const x = condition === 'range' ? 9 : condition === 'behind' ? 4 : 7;
    game.enemies.unshift(bug(x, 5));
    for (let col = 4; col <= 9; col++) game.dirt[cellIndex(col, 5)] = false;
    if (condition === 'dirt') game.dirt[cellIndex(6, 5)] = true;
    if (condition === 'rock') game.rocks.push({ x: 6, y: 5, state: 'supported', clock: 0 });
    const next = stepGame(game, { pump: true }, DT);
    assert.equal(next.enemies[0].inflation, 0, condition);
  }
});

test('partially pumped enemies deflate and eventually move again', () => {
  const game = fixture();
  game.enemies.unshift(bug(7, 5));
  game.dirt[cellIndex(6, 5)] = false;
  game.dirt[cellIndex(7, 5)] = false;
  const inflated = play(game, 0.4, { pump: true });
  const next = play(inflated, 2.05);
  assert.equal(next.enemies[0].inflation, 0);
  assert.equal(next.enemies[0].x, 6);
});

test('contact costs one life, resets survivors, and grants temporary protection', () => {
  const game = fixture();
  game.enemies.unshift(bug(5, 5));
  const next = stepGame(game, {}, DT);
  assert.equal(next.lives, 2);
  assert.equal(next.player.x, 10);
  assert.ok(next.player.protectedFor > 2);
  next.enemies[0].x = next.player.x;
  next.enemies[0].y = next.player.y;
  assert.equal(stepGame(next, {}, DT).lives, 2);
  const lastLife = fixture();
  lastLife.lives = 1;
  lastLife.enemies.unshift(bug(5, 5));
  const over = stepGame(lastLife, {}, DT);
  assert.equal(over.status, 'over');
  assert.equal(over.lives, 0);
  assert.equal(stepGame(over, { direction: 'right' }, DT), over);
});

test('rocks wait for digging below, warn, then crush enemies and settle', () => {
  const game = fixture();
  game.rocks = [{ x: 7, y: 4, state: 'supported', clock: 0 }];
  assert.equal(play(game, 1).rocks[0].state, 'supported');
  game.dirt[cellIndex(7, 5)] = false;
  game.enemies.unshift({ ...bug(7, 5), inflation: 1, sincePumped: -10 });
  const warned = stepGame(game, {}, DT);
  assert.equal(warned.rocks[0].state, 'shaking');
  assert.equal(play(warned, 0.5).rocks[0].y, 4);
  const fallen = play(warned, 1.5);
  assert.equal(fallen.rocks[0].y, 5);
  assert.equal(fallen.rocks[0].state, 'settled');
  assert.equal(fallen.enemies.length, 1);
  assert.equal(fallen.score, 500);
});

test('falling rocks can cost a life and stacked rocks do not overlap', () => {
  const game = fixture();
  game.rocks = [{ x: 5, y: 4, state: 'falling', clock: 0 }];
  assert.equal(stepGame(game, {}, DT).lives, 2);
  const stacked = fixture();
  stacked.rocks = [
    { x: 7, y: 4, state: 'falling', clock: 0 },
    { x: 7, y: 5, state: 'falling', clock: 0 },
  ];
  stacked.dirt[cellIndex(7, 6)] = false;
  stacked.dirt[cellIndex(7, 5)] = false;
  const next = stepGame(stacked, {}, DT);
  assert.deepEqual(next.rocks.map(rock => rock.y), [5, 6]);
});

test('clearing all enemies advances the level while keeping score and lives', () => {
  const game = fixture();
  game.enemies = [];
  game.score = 500;
  game.lives = 2;
  const cleared = stepGame(game, {}, DT);
  assert.equal(cleared.status, 'cleared');
  const next = play(cleared, 2);
  assert.equal(next.status, 'playing');
  assert.equal(next.level, 2);
  assert.equal(next.enemies.length, 4);
  assert.equal(next.score, 500);
  assert.equal(next.lives, 2);
});

test('ready and paused games freeze; movement speed is independent of tick frequency', () => {
  const ready = createGame();
  assert.equal(stepGame(ready, { direction: 'down' }, DT), ready);
  const paused = { ...fixture(), status: 'paused' };
  assert.equal(stepGame(paused, {}, DT), paused);
  let slow = fixture();
  let fast = fixture();
  for (let i = 0; i < 30; i++) slow = stepGame(slow, { direction: 'down' }, 1 / 30);
  for (let i = 0; i < 60; i++) fast = stepGame(fast, { direction: 'down' }, 1 / 60);
  assert.equal(slow.player.y, fast.player.y);
});

test('a trapped bug fades through dirt without digging and becomes solid in a tunnel', () => {
  const game = fixture();
  game.enemies.unshift(bug(8, 5));
  game.dirt[cellIndex(8, 5)] = false;
  game.dirt[cellIndex(6, 5)] = false;
  const dirtBefore = [...game.dirt];
  const ghost = play(game, 2.2);
  assert.equal(ghost.enemies[0].phasing, true);
  assert.equal(ghost.enemies[0].x, 7);
  assert.equal(ghost.dirt[cellIndex(7, 5)], true);
  const emerged = play(ghost, 0.8);
  assert.equal(emerged.enemies[0].x, 6);
  assert.equal(emerged.enemies[0].phasing, false);
  assert.deepEqual(emerged.dirt, dirtBefore);
  assert.equal(emerged.lives, 3);
});

test('ghosts cannot be pumped, and inflated bugs do not start phasing', () => {
  const game = fixture();
  game.dirt[cellIndex(6, 5)] = false;
  game.dirt[cellIndex(7, 5)] = false;
  game.enemies.unshift({ ...bug(7, 5), phasing: true, phaseTime: 0 });
  const ghost = play(game, 0.3, { pump: true });
  assert.equal(ghost.enemies[0].inflation, 0);
  assert.equal(ghost.enemies[0].phasing, true);
  game.enemies[0] = { ...bug(7, 5), inflation: 0.4, phaseCooldown: 0 };
  const inflated = play(game, 0.3, { pump: true });
  assert.equal(inflated.enemies[0].phasing, undefined);
  assert.ok(inflated.enemies[0].inflation > 0.6);
});

test('a connected bug occasionally phases and ghosts still cannot enter rocks', () => {
  const game = fixture();
  for (const x of [6, 7, 8]) game.dirt[cellIndex(x, 5)] = false;
  game.enemies.unshift({ ...bug(8, 5), phaseCooldown: 0 });
  assert.equal(stepGame(game, {}, DT).enemies[0].phasing, true);
  game.enemies[0] = { ...bug(7, 5), phasing: true, phaseTime: 0, moveClock: 0.65 };
  game.rocks = [{ x: 6, y: 5, state: 'supported', clock: 0 }];
  const ghost = stepGame(game, {}, DT).enemies[0];
  assert.notEqual(`${ghost.x},${ghost.y}`, '6,5');
});

test('isolated starting enemies phase at least 1.5 seconds apart on early and later levels', () => {
  for (const level of [1, 6]) {
    let game = { ...createGame(level), status: 'playing' };
    game.player.protectedFor = 100;
    const firstPhases = new Map();
    for (let frame = 0; frame < 25 * 60; frame++) {
      game = stepGame(game, {}, DT);
      for (const enemy of game.enemies) {
        if (enemy.phasing && !firstPhases.has(enemy.id)) firstPhases.set(enemy.id, game.time);
      }
    }
    assert.equal(firstPhases.size, game.enemies.length);
    const times = [...firstPhases.values()];
    for (let i = 1; i < times.length; i++) {
      assert.ok(times[i] - times[i - 1] >= 1.5 - DT, `Level ${level}: ${times}`);
    }
  }
});

test('simultaneously expired phase timers still start one ghost at a time', () => {
  const game = fixture();
  game.player.protectedFor = 100;
  game.enemies = [bug(7, 5, 0), bug(8, 5, 1), bug(9, 5, 2)];
  game.enemies.forEach(enemy => { enemy.phaseCooldown = 0; });
  const first = stepGame(game, {}, DT);
  assert.equal(first.enemies.filter(enemy => enemy.phasing).length, 1);
  const waiting = play(first, 1);
  assert.equal(waiting.enemies.filter(enemy => enemy.phasing).length, 1);
  assert.equal(waiting.enemies[1].phasing, undefined);
  const second = play(waiting, 0.6);
  assert.equal(second.enemies[1].phasing, true);
  assert.equal(second.enemies[2].phasing, undefined);
  assert.ok(second.nextPhaseAt >= 3);
});
