export const LEVELS = {
  beginner: { label: 'Beginner', rows: 9, cols: 9, mines: 10 },
  intermediate: { label: 'Intermediate', rows: 16, cols: 16, mines: 40 },
  expert: { label: 'Expert', rows: 16, cols: 30, mines: 99 },
};

export function neighbors(index, rows, cols) {
  const row = Math.floor(index / cols);
  const col = index % cols;
  const result = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const y = row + dy;
      const x = col + dx;
      if ((dx || dy) && y >= 0 && y < rows && x >= 0 && x < cols) {
        result.push(y * cols + x);
      }
    }
  }
  return result;
}

export function newGame(level) {
  return {
    ...LEVELS[level],
    status: 'ready',
    cells: Array.from({ length: LEVELS[level].rows * LEVELS[level].cols }, () => ({
      mine: false, count: 0, revealed: false, flagged: false,
    })),
  };
}

export function toggleFlag(game, index) {
  if (!['ready', 'playing'].includes(game.status) || game.cells[index].revealed) return game;
  const cells = game.cells.map(cell => ({ ...cell }));
  cells[index].flagged = !cells[index].flagged;
  return { ...game, cells };
}

export function reveal(game, index, random = Math.random) {
  if (!['ready', 'playing'].includes(game.status) || game.cells[index].flagged) return game;
  const cells = game.cells.map(cell => ({ ...cell }));
  if (game.status === 'ready') {
    const safe = new Set([index, ...neighbors(index, game.rows, game.cols)]);
    const candidates = cells.map((_, i) => i).filter(i => !safe.has(i));
    for (let i = 0; i < game.mines; i++) {
      const pick = i + Math.floor(random() * (candidates.length - i));
      [candidates[i], candidates[pick]] = [candidates[pick], candidates[i]];
      cells[candidates[i]].mine = true;
    }
    cells.forEach((cell, i) => {
      cell.count = neighbors(i, game.rows, game.cols).filter(n => cells[n].mine).length;
    });
  }

  let pending = [index];
  // Clicking an open number clears its neighbors when the flag count matches.
  if (cells[index].revealed) {
    const adjacent = neighbors(index, game.rows, game.cols);
    if (!cells[index].count || adjacent.filter(i => cells[i].flagged).length !== cells[index].count) return game;
    pending = adjacent;
  }
  let lost = false;
  while (pending.length) {
    const current = pending.pop();
    const cell = cells[current];
    if (cell.revealed || cell.flagged) continue;
    cell.revealed = true;
    if (cell.mine) {
      cell.exploded = true;
      lost = true;
    } else if (cell.count === 0) {
      pending.push(...neighbors(current, game.rows, game.cols));
    }
  }
  const won = !lost && cells.every(cell => cell.mine || cell.revealed);
  if (won) cells.forEach(cell => { if (cell.mine) cell.flagged = true; });
  return { ...game, cells, status: lost ? 'lost' : won ? 'won' : 'playing' };
}
