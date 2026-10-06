// Coordinates are grid cells. Time is measured in seconds, independent of drawing.
export const COLS = 20;
export const ROWS = 18;
export const TILE = 24;
export const DIRECTIONS = {
  up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
  left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
};
const PLAYER_PERIOD = 0.2;
const PUMP_RANGE = 3;
const POP_AT = 1.2;
const SPAWN = { x: 10, y: 2 };

export const cellIndex = (x, y) => y * COLS + x;
const inside = (x, y) => x >= 0 && x < COLS && y >= 1 && y < ROWS;
const sameCell = (a, b) => a.x === b.x && a.y === b.y;
const rockAt = (game, x, y) => game.rocks.some(rock => rock.x === x && rock.y === y);
const tunnelAt = (game, x, y) => inside(x, y) && !game.dirt[cellIndex(x, y)] && !rockAt(game, x, y);

export function createGame(level = 1, score = 0, lives = 3) {
  const dirt = Array(COLS * ROWS).fill(true);
  const dig = (x, y) => { dirt[cellIndex(x, y)] = false; };
  for (let x = 0; x < COLS; x++) { dig(x, 0); dig(x, 1); }
  for (let y = 2; y < ROWS - 1; y++) dig(SPAWN.x, y);
  const nests = [
    { x: 3, y: 6 }, { x: 16, y: 10 }, { x: 4, y: 14 },
    { x: 17, y: 6 }, { x: 3, y: 10 }, { x: 16, y: 14 },
    { x: 5, y: 16 }, { x: 15, y: 16 },
  ];
  const enemies = nests.slice(0, Math.min(3 + level - 1, nests.length)).map((nest, id) => {
    // Each nest is a short pocket surrounded by dirt, separate from the main shaft.
    for (let x = nest.x - 1; x <= nest.x + 1; x++) dig(x, nest.y);
    return {
      ...nest, spawn: { ...nest }, id, inflation: 0, sincePumped: 0, moveClock: 0, facing: 'left',
      phasing: false, phaseTime: 0, phaseCooldown: 6 + id * 1.5, blockedFor: 0,
    };
  });
  return {
    level, score, lives, dirt, enemies,
    player: { ...SPAWN, facing: 'down', moveClock: PLAYER_PERIOD, protectedFor: 2 },
    rocks: [{ x: 6, y: 4 }, { x: 14, y: 8 }, { x: 8, y: 12 }].map((rock, id) => ({
      ...rock, id, state: 'supported', clock: 0,
    })),
    status: 'ready', time: 0, nextPhaseAt: 0, transition: 0, hose: null, message: '', messageFor: 0,
  };
}

// Solid bugs follow tunnels; ghosts can cross dirt without changing the map.
function distancesFromPlayer(game, throughDirt = false) {
  const distances = Array(COLS * ROWS).fill(Infinity);
  const queue = [{ x: game.player.x, y: game.player.y }];
  distances[cellIndex(game.player.x, game.player.y)] = 0;
  for (let head = 0; head < queue.length; head++) {
    const point = queue[head];
    for (const direction of Object.values(DIRECTIONS)) {
      const x = point.x + direction.x;
      const y = point.y + direction.y;
      if (throughDirt ? !inside(x, y) || rockAt(game, x, y) : !tunnelAt(game, x, y)) continue;
      const index = cellIndex(x, y);
      if (distances[index] !== Infinity) continue;
      distances[index] = distances[cellIndex(point.x, point.y)] + 1;
      queue.push({ x, y });
    }
  }
  return distances;
}

function damagePlayer(game) {
  if (game.player.protectedFor > 0) return;
  game.lives -= 1;
  game.hose = null;
  if (game.lives === 0) {
    game.status = 'over';
    return;
  }
  // Keep dug tunnels, rocks and score; reset surviving enemies to their nests.
  game.player = { ...SPAWN, facing: 'down', moveClock: 0, protectedFor: 2.5 };
  game.enemies.forEach(enemy => {
    Object.assign(enemy, enemy.spawn, {
      inflation: 0, sincePumped: 0, moveClock: 0,
      phasing: false, phaseTime: 0, phaseCooldown: 6 + enemy.id * 1.5, blockedFor: 0,
    });
  });
  game.message = 'Ouch! Back to the surface.';
  game.messageFor = 2;
}

function pump(game, dt) {
  const direction = DIRECTIONS[game.player.facing];
  let target = null;
  let end = { x: game.player.x, y: game.player.y };
  for (let distance = 1; distance <= PUMP_RANGE; distance++) {
    const x = game.player.x + direction.x * distance;
    const y = game.player.y + direction.y * distance;
    if (!tunnelAt(game, x, y)) break;
    end = { x, y };
    target = game.enemies.find(enemy => !enemy.phasing && enemy.x === x && enemy.y === y);
    if (target) break;
  }
  game.hose = { ...end, targetId: target?.id };
  if (!target) return;
  target.inflation += dt;
  target.sincePumped = 0;
  if (target.inflation >= POP_AT) {
    game.enemies = game.enemies.filter(enemy => enemy.id !== target.id);
    game.score += 200 * game.level;
    game.message = '+ ' + 200 * game.level + ' — popped!';
    game.messageFor = 1;
  }
}

function updateRocks(game, dt) {
  // Bottom rocks move first so stacked rocks cannot overlap during a fall.
  const ordered = [...game.rocks].sort((a, b) => b.y - a.y);
  for (const rock of ordered) {
    const belowIsOpen = tunnelAt(game, rock.x, rock.y + 1);
    if (rock.state === 'supported' && belowIsOpen) {
      rock.state = 'shaking';
      rock.clock = 1.2;
    } else if (rock.state === 'shaking') {
      rock.clock -= dt;
      if (rock.clock <= 0) { rock.state = 'falling'; rock.clock = 0; }
    } else if (rock.state === 'falling') {
      rock.clock -= dt;
      if (rock.clock > 0) continue;
      if (!belowIsOpen) {
        rock.state = 'settled';
        continue;
      }
      rock.y += 1;
      rock.clock += 0.15;
      const crushed = game.enemies.filter(enemy => sameCell(enemy, rock)).length;
      game.enemies = game.enemies.filter(enemy => !sameCell(enemy, rock));
      if (crushed) {
        game.score += crushed * 500 * game.level;
        game.message = 'Rock bonus! + ' + crushed * 500 * game.level;
        game.messageFor = 1.5;
      }
      if (sameCell(game.player, rock)) damagePlayer(game);
    }
  }
}

// Return a new state so tests and React can keep the previous state intact.
export function stepGame(previous, input, dt) {
  if (!['playing', 'cleared'].includes(previous.status)) return previous;
  const game = {
    ...previous, dirt: [...previous.dirt], player: { ...previous.player },
    enemies: previous.enemies.map(enemy => ({ ...enemy })),
    rocks: previous.rocks.map(rock => ({ ...rock })),
    hose: null,
  };
  if (game.status === 'cleared') {
    game.transition -= dt;
    if (game.transition <= 0) return { ...createGame(game.level + 1, game.score, game.lives), status: 'playing' };
    return game;
  }
  game.time += dt;
  game.messageFor = Math.max(0, game.messageFor - dt);
  game.player.protectedFor = Math.max(0, game.player.protectedFor - dt);
  game.player.moveClock = Math.min(PLAYER_PERIOD, game.player.moveClock + dt);
  if (DIRECTIONS[input.direction]) {
    game.player.facing = input.direction;
    if (!input.pump && game.player.moveClock >= PLAYER_PERIOD - 1e-9) {
      const direction = DIRECTIONS[input.direction];
      const x = game.player.x + direction.x;
      const y = game.player.y + direction.y;
      game.player.moveClock = 0;
      if (inside(x, y) && !rockAt(game, x, y)) {
        if (game.dirt[cellIndex(x, y)]) game.score += 10;
        game.dirt[cellIndex(x, y)] = false;
        game.player.x = x;
        game.player.y = y;
      }
    }
  }

  // Contact before pumping prevents inflating an enemy already touching you.
  if (game.enemies.some(enemy => !enemy.inflation && sameCell(enemy, game.player))) damagePlayer(game);
  if (game.status === 'over') return game;
  if (input.pump) pump(game, dt);

  const distances = distancesFromPlayer(game);
  const ghostDistances = distancesFromPlayer(game, true);
  const enemyPeriod = Math.max(0.4, 0.75 - (game.level - 1) * 0.025);
  for (const enemy of game.enemies) {
    const pumped = game.hose?.targetId === enemy.id;
    enemy.sincePumped += dt;
    if (!pumped && enemy.sincePumped > 0.6) enemy.inflation = Math.max(0, enemy.inflation - dt * 0.65);
    if (enemy.inflation > 0) { enemy.moveClock = 0; continue; }
    enemy.phaseCooldown = (enemy.phaseCooldown ?? 6 + enemy.id * 1.5) - dt;
    enemy.blockedFor = distances[cellIndex(enemy.x, enemy.y)] === Infinity ? (enemy.blockedFor ?? 0) + dt : 0;
    // Trapped bugs have different wait times; a shared gap also prevents bursts
    // if multiple timers expire together after pumping or a route gets blocked.
    const trappedWait = 1.5 + enemy.id * 1.5;
    if (!enemy.phasing && game.time >= (game.nextPhaseAt ?? 0)
      && (enemy.phaseCooldown <= 0 || enemy.blockedFor >= trappedWait)) {
      enemy.phasing = true;
      enemy.phaseTime = 0;
      enemy.moveClock = 0;
      game.nextPhaseAt = game.time + 1.5;
    }
    if (enemy.phasing) {
      enemy.phaseTime += dt;
      // Stay ghostly in dirt; become solid again only on reaching an open tunnel.
      if (enemy.phaseTime >= 1.2 && tunnelAt(game, enemy.x, enemy.y)) {
        enemy.phasing = false;
        enemy.phaseCooldown = 7 + enemy.id * 1.5;
        enemy.blockedFor = 0;
        enemy.moveClock = 0;
      }
    }
    enemy.moveClock += dt;
    if (enemy.moveClock < (enemy.phasing ? 0.65 : enemyPeriod)) continue;
    enemy.moveClock = 0;
    const routes = enemy.phasing ? ghostDistances : distances;
    let bestDistance = routes[cellIndex(enemy.x, enemy.y)];
    let next = null;
    for (const [facing, direction] of Object.entries(DIRECTIONS)) {
      const x = enemy.x + direction.x;
      const y = enemy.y + direction.y;
      if (enemy.phasing ? !inside(x, y) || rockAt(game, x, y) : !tunnelAt(game, x, y)) continue;
      const distance = routes[cellIndex(x, y)];
      if (distance < bestDistance) { bestDistance = distance; next = { x, y, facing }; }
    }
    if (next) Object.assign(enemy, next);
  }
  if (game.enemies.some(enemy => !enemy.inflation && sameCell(enemy, game.player))) damagePlayer(game);
  if (game.status === 'over') return game;
  updateRocks(game, dt);
  if (game.status === 'over') return game;
  if (!game.enemies.length) {
    game.status = 'cleared';
    game.transition = 1.8;
    game.hose = null;
  }
  return game;
}
