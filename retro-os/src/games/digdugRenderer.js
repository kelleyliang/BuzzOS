import { COLS, ROWS, TILE, cellIndex } from './digdug';

const MINER = [
  '    yyyy    ', '   yyyyyy   ', '  yywwyyyy  ', '   sssss    ',
  '   sksks    ', '    sss     ', '  bbbbbbb   ', ' sbwwbbbs   ',
  ' sbwwbbbs   ', '   bbbb     ', '   b  b     ', '  kk  kk    ',
];
const BUG = [
  '  p    p  ', '   pppp   ', '  pppppp  ', ' pwwppwwp ',
  ' pwkppkwp ', ' pppppppp ', '  ppwwpp  ', '  pppppp  ',
  ' p pppp p ', 'p  p  p  p',
];
const GHOST = [
  '   gggg   ', '  gggggg  ', ' gggggggg ', ' gwwggwwg ',
  ' gwkggkwg ', ' gggggggg ', '  gggggg  ', '  gggggg  ',
  '  gg  gg  ', ' g      g ',
];
const PALETTE = { y: '#ffd35b', w: '#fff7d6', s: '#ffbb90', k: '#192a37', b: '#57c8dd', p: '#ee7184', g: '#c6efff' };

function sprite(ctx, pattern, x, y, scale, flip = false) {
  const width = pattern[0].length;
  pattern.forEach((row, j) => {
    [...row].forEach((pixel, i) => {
      if (!PALETTE[pixel]) return;
      ctx.fillStyle = PALETTE[pixel];
      ctx.fillRect(x + (flip ? width - 1 - i : i) * scale, y + j * scale, scale, scale);
    });
  });
}

export function drawGame(ctx, game) {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#172330';
  ctx.fillRect(0, 0, COLS * TILE, ROWS * TILE);
  const layers = ['#c78a49', '#af663a', '#86482f', '#63382d'];
  for (let y = 2; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (!game.dirt[cellIndex(x, y)]) continue;
      ctx.fillStyle = layers[Math.min(3, Math.floor((y - 2) / 4))];
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      ctx.fillStyle = '#f5c57a40';
      ctx.fillRect(x * TILE + (x * 7 + y * 3) % 19, y * TILE + 5, 2, 2);
      ctx.fillStyle = '#24182f30';
      ctx.fillRect(x * TILE + (x * 3 + y * 7) % 19, y * TILE + 17, 3, 2);
    }
  }
  ctx.fillStyle = '#254d5e';
  ctx.fillRect(0, 0, COLS * TILE, TILE);
  ctx.fillStyle = '#8bb65b';
  ctx.fillRect(0, TILE - 4, COLS * TILE, 4);
  for (let x = 6; x < COLS * TILE; x += 19) {
    ctx.fillRect(x, TILE - 7, 2, 4);
  }

  // Draw the hose beneath the characters so its endpoint is easy to see.
  if (game.hose) {
    const startX = (game.player.x + 0.5) * TILE;
    const startY = (game.player.y + 0.5) * TILE;
    const endX = (game.hose.x + 0.5) * TILE;
    const endY = (game.hose.y + 0.5) * TILE;
    ctx.strokeStyle = '#ffd35b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.fillStyle = '#fff7d6';
    ctx.fillRect(endX - 3, endY - 3, 6, 6);
  }

  game.enemies.forEach(enemy => {
    const scale = 2 + enemy.inflation * 1.1;
    const bob = enemy.inflation ? 0 : Math.sin(game.time * 9 + enemy.id) * 1.5;
    const x = (enemy.x + 0.5) * TILE - 5 * scale;
    const y = (enemy.y + 0.5) * TILE - 5 * scale + bob;
    ctx.save();
    if (enemy.phasing) ctx.globalAlpha = 0.35 + (Math.sin(game.time * 5 + enemy.id) + 1) * 0.15;
    sprite(ctx, enemy.phasing ? GHOST : BUG, x, y, scale, enemy.facing === 'right');
    ctx.restore();
    if (enemy.inflation > 0) {
      ctx.fillStyle = '#18222b';
      ctx.fillRect(enemy.x * TILE + 2, enemy.y * TILE - 5, 20, 3);
      ctx.fillStyle = '#ffd35b';
      ctx.fillRect(enemy.x * TILE + 2, enemy.y * TILE - 5, 20 * Math.min(1, enemy.inflation / 1.2), 3);
    }
  });

  game.rocks.forEach(rock => {
    const shake = rock.state === 'shaking' ? Math.sin(game.time * 65) * 2 : 0;
    const x = rock.x * TILE + shake;
    const y = rock.y * TILE;
    ctx.fillStyle = rock.state === 'shaking' ? '#e0bc75' : '#9dafa9';
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 2);
    ctx.lineTo(x + 18, y + 2);
    ctx.lineTo(x + 23, y + 10);
    ctx.lineTo(x + 19, y + 23);
    ctx.lineTo(x + 3, y + 23);
    ctx.lineTo(x + 1, y + 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d9e3d0';
    ctx.fillRect(x + 6, y + 5, 10, 3);
    ctx.fillStyle = '#536d69';
    ctx.fillRect(x + 4, y + 18, 15, 3);
    if (rock.state === 'shaking') {
      ctx.fillStyle = '#ffd35b';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('!', x + 8, y - 3);
    }
  });

  if (game.status !== 'over' && !(game.player.protectedFor > 0 && Math.floor(game.time * 9) % 2)) {
    sprite(ctx, MINER, game.player.x * TILE, game.player.y * TILE, 2, game.player.facing === 'left');
    const offset = { up: [10, -2], down: [10, 20], left: [-2, 10], right: [20, 10] }[game.player.facing];
    ctx.fillStyle = '#fff7d6';
    ctx.fillRect(game.player.x * TILE + offset[0], game.player.y * TILE + offset[1], 5, 5);
  }
}
