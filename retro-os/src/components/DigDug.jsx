import { useEffect, useRef, useState } from 'react';
import { COLS, ROWS, TILE, createGame, stepGame } from '../games/digdug';
import { drawGame } from '../games/digdugRenderer';
import './DigDug.css';

const KEY_DIRECTIONS = {
  ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down',
  ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right',
};
const summarize = game => ({
  status: game.status, score: game.score, lives: game.lives, level: game.level,
  enemies: game.enemies.length, message: game.messageFor > 0 ? game.message : '',
});

export default function DigDug({ isActive = true, minimized = false }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const inputRef = useRef({ directions: [], pump: false });
  const commandRef = useRef(null);
  const [hud, setHud] = useState(() => summarize(createGame()));
  const [browserActive, setBrowserActive] = useState(() => !document.hidden && document.hasFocus());
  const autoPaused = !isActive || minimized || !browserActive;

  useEffect(() => {
    const onBlur = () => setBrowserActive(false);
    const onFocus = () => setBrowserActive(!document.hidden);
    const onVisibility = () => setBrowserActive(!document.hidden && document.hasFocus());
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (!gameRef.current) gameRef.current = createGame();
    inputRef.current = { directions: [], pump: false };
    let lastTime = null;
    let accumulator = 0;
    let animation;
    let lastSummary = '';

    function onKeyDown(event) {
      if (autoPaused || event.target.closest?.('button, input, textarea, select')) return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const direction = KEY_DIRECTIONS[key];
      if (!direction && ![' ', 'Enter', 'p', 'Escape'].includes(key)) return;
      event.preventDefault();
      // Capture controls before another open game's global listeners receive them.
      event.stopImmediatePropagation();
      if (direction) {
        const directions = inputRef.current.directions;
        if (!directions.includes(key)) directions.push(key);
      } else if (key === ' ') {
        inputRef.current.pump = true;
      } else if (!event.repeat) {
        if (key === 'Enter') commandRef.current = 'primary';
        else if (['playing', 'paused', 'cleared'].includes(gameRef.current.status)) commandRef.current = 'pause';
      }
    }
    function onKeyUp(event) {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      inputRef.current.directions = inputRef.current.directions.filter(held => held !== key);
      if (key === ' ') inputRef.current.pump = false;
      if (!autoPaused && (KEY_DIRECTIONS[key] || key === ' ')) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }

    function frame(now) {
      let game = gameRef.current;
      if (commandRef.current && !autoPaused) {
        const command = commandRef.current;
        if (command === 'restart' || (command === 'primary' && game.status === 'over')) {
          game = { ...createGame(), status: 'playing' };
        } else if (command === 'primary' && game.status === 'ready') {
          game = { ...game, status: 'playing' };
        } else if (game.status === 'paused') {
          game = { ...game, status: game.resumeStatus };
        } else if (['playing', 'cleared'].includes(game.status)) {
          game = { ...game, status: 'paused', resumeStatus: game.status, hose: null };
        }
        commandRef.current = null;
        inputRef.current = { directions: [], pump: false };
        accumulator = 0;
      }
      const elapsed = lastTime === null ? 0 : Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      if (!autoPaused && ['playing', 'cleared'].includes(game.status)) {
        accumulator += elapsed;
        while (accumulator >= 1 / 60) {
          const held = inputRef.current.directions;
          game = stepGame(game, {
            direction: KEY_DIRECTIONS[held[held.length - 1]],
            pump: inputRef.current.pump,
          }, 1 / 60);
          accumulator -= 1 / 60;
        }
      } else accumulator = 0;
      gameRef.current = game;
      drawGame(ctx, game);
      const summary = summarize(game);
      const signature = JSON.stringify(summary);
      if (signature !== lastSummary) { setHud(summary); lastSummary = signature; }
      animation = requestAnimationFrame(frame);
    }
    // Keyboard input belongs only to this active window.
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    animation = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(animation);
      inputRef.current = { directions: [], pump: false };
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
    };
  }, [autoPaused]);

  function command(action) {
    commandRef.current = action;
    canvasRef.current?.focus({ preventScroll: true });
  }

  const paused = hud.status === 'paused' || (autoPaused && ['playing', 'cleared'].includes(hud.status));
  const overlay = paused || ['ready', 'over', 'cleared'].includes(hud.status);
  const title = paused ? 'Taking a breather' : hud.status === 'over' ? 'Out of lives' : hud.status === 'cleared' ? 'Mine cleared!' : 'Tunnel Trouble';

  return (
    <div className="digdug">
      <header className="digdug-heading">
        <div><span className="digdug-eyebrow">BUZZOS ARCADE</span><h2>Dig Dug <span>· Tunnel Trouble</span></h2></div>
        <div className="digdug-actions">
          <button type="button" disabled={hud.status === 'ready' || hud.status === 'over'} onClick={() => command('pause')}>
            {hud.status === 'paused' ? 'Resume' : 'Pause'}
          </button>
          <button type="button" onClick={() => command('restart')}>Restart</button>
        </div>
      </header>
      <div className="digdug-hud">
        <span>SCORE <strong>{String(hud.score).padStart(6, '0')}</strong></span>
        <span>LEVEL <strong>{String(hud.level).padStart(2, '0')}</strong></span>
        <span>LIVES <strong aria-label={`${hud.lives} lives`}>{'♥'.repeat(hud.lives) || '—'}</strong></span>
        <span>BUGS <strong>{hud.enemies}</strong></span>
      </div>
      <div className="digdug-stage">
        <canvas
          ref={canvasRef}
          width={COLS * TILE}
          height={ROWS * TILE}
          tabIndex={0}
          aria-label="Tunnel Trouble game. Arrow keys or WASD to dig; hold Space to pump; P to pause."
          aria-describedby="digdug-instructions"
        />
        {overlay && (
          <div className="digdug-overlay">
            <div className="digdug-overlay-card">
              <span className="digdug-eyebrow">{hud.status === 'over' ? `FINAL SCORE ${hud.score}` : 'DIG · PUMP · DODGE'}</span>
              <h3>{title}</h3>
              <p>{paused ? (autoPaused ? 'Click back into this window to continue.' : 'Your tunnels will be here when you return.') : hud.status === 'over' ? 'A fresh minefield is waiting for you.' : hud.status === 'cleared' ? `On to level ${hud.level + 1}…` : 'Dig your own escape routes. Pump the tunnel bugs. Let gravity do the rest.'}</p>
              {!autoPaused && hud.status !== 'cleared' && (
                <button type="button" onClick={() => command('primary')}>
                  {paused ? 'Resume digging' : hud.status === 'over' ? 'Try again' : 'Start digging'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="digdug-feedback" role="status">
        {hud.message || (paused ? 'Paused' : hud.status === 'over' ? 'Game over' : hud.status === 'cleared' ? 'Every bug cleared. Next level!' : 'Dig beneath a rock, then get out of its way!')}
      </div>
      <footer className="digdug-instructions" id="digdug-instructions">
        <p><kbd>↑ ↓ ← →</kbd> / <kbd>WASD</kbd> Dig & aim · Hold <kbd>Space</kbd> Pump · <kbd>P</kbd> Pause</p>
        <details>
          <summary>How to play</summary>
          <p>Hold Space to pump up to 3 tunnel squares ahead. Bugs deflate if you stop early. Faded ghosts pass through dirt without digging; pump them once they become solid again. Shaking rocks give you a warning before falling.</p>
          <span>Original characters · A Dig Dug-style game</span>
        </details>
      </footer>
    </div>
  );
}
