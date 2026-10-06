import { useEffect, useState } from 'react';
import { LEVELS, newGame, reveal, toggleFlag } from '../games/minesweeper';
import './Minesweeper.css';

export default function Minesweeper() {
  const [level, setLevel] = useState('beginner');
  const [game, setGame] = useState(() => newGame('beginner'));
  const [seconds, setSeconds] = useState(0);
  const [flagMode, setFlagMode] = useState(false);

  useEffect(() => {
    if (game.status !== 'playing') return;
    const started = Date.now();
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 250);
    return () => clearInterval(timer);
  }, [game.status]);

  function restart(nextLevel = level) {
    setLevel(nextLevel);
    setGame(newGame(nextLevel));
    setSeconds(0);
    setFlagMode(false);
  }

  const flags = game.cells.filter(cell => cell.flagged).length;
  const finished = game.status === 'lost' || game.status === 'won';
  const message = {
    ready: 'Choose a square. Your first move is safe.',
    playing: 'Clear every safe square. Watch the numbers!',
    lost: 'Boom! Try again with a new board.',
    won: 'You cleared the minefield! Nice work.',
  }[game.status];

  return (
    <div className="minesweeper">
      <div className="minesweeper-toolbar">
        <label>
          Difficulty{' '}
          <select value={level} onChange={event => restart(event.target.value)}>
            {Object.entries(LEVELS).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
          </select>
        </label>
        <button type="button" aria-pressed={flagMode} onClick={() => setFlagMode(value => !value)}>
          ⚑ Flag mode {flagMode ? 'on' : 'off'}
        </button>
      </div>
      <div className="minesweeper-dashboard">
        <output aria-label={`${game.mines - flags} mines remaining`} className="minesweeper-counter">
          {String(game.mines - flags).padStart(3, '0')}
        </output>
        <button type="button" className="minesweeper-reset" aria-label="Start a new game" onClick={() => restart()}>
          {game.status === 'lost' ? '☹' : game.status === 'won' ? '😎' : '☺'}
        </button>
        <output aria-label={`${seconds} seconds elapsed`} className="minesweeper-counter">
          {String(Math.min(seconds, 999)).padStart(3, '0')}
        </output>
      </div>
      <p className="minesweeper-status" role="status">{message}</p>
      <div className="minesweeper-board-scroll">
        <div className="minesweeper-board" style={{ gridTemplateColumns: `repeat(${game.cols}, 28px)` }} role="group" aria-label="Minefield">
          {game.cells.map((cell, index) => {
            const showMine = cell.mine && (cell.revealed || finished);
            const wrongFlag = game.status === 'lost' && cell.flagged && !cell.mine;
            const content = wrongFlag ? '✕' : cell.flagged ? '⚑' : showMine ? '✹' : cell.revealed && cell.count ? cell.count : '';
            const description = wrongFlag ? 'Incorrect flag' : cell.flagged ? 'Flagged' : showMine ? 'Mine' : cell.revealed ? `${cell.count} adjacent mines` : 'Covered';
            return (
              <button
                type="button"
                key={index}
                className={`minesweeper-cell ${cell.revealed || showMine ? 'revealed' : ''} ${cell.exploded ? 'exploded' : ''} ${cell.flagged ? 'flagged' : ''}`}
                data-count={cell.count}
                aria-label={`Row ${Math.floor(index / game.cols) + 1}, column ${index % game.cols + 1}: ${description}`}
                disabled={finished}
                onClick={() => setGame(current => flagMode ? toggleFlag(current, index) : reveal(current, index))}
                onContextMenu={event => {
                  event.preventDefault();
                  setGame(current => toggleFlag(current, index));
                }}
                onKeyDown={event => {
                  if (event.key.toLowerCase() === 'f') {
                    event.preventDefault();
                    setGame(current => toggleFlag(current, index));
                  }
                }}
              >{content}</button>
            );
          })}
        </div>
      </div>
      <p className="minesweeper-help">Click to reveal · Right-click or F to flag<br />Click an open number to clear neighbors when its flags match.</p>
    </div>
  );
}
