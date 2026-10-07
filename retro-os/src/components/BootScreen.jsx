import { useEffect, useState } from 'react';
import buzz from '../assets/buzz-character.png';
import wallpaper from '../assets/wallpaper-hd.png';
import roadmap from '../assets/roadmap.svg';
import notes from '../assets/notes.svg';
import snake from '../assets/snake.svg';
import minesweeper from '../assets/minesweeper.svg';
import digdug from '../assets/digdug.svg';
import music from '../assets/music.svg';
import updates from '../assets/updates.svg';
import pomodoro from '../assets/pomodoro.svg';
import todo from '../assets/todo.svg';
import './BootScreen.css';

const ASSETS = [buzz, wallpaper, roadmap, notes, snake, minesweeper, digdug, music, updates, pomodoro, todo];

export default function BootScreen({ children }) {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let loaded = 0;
    let displayed = 0;
    let finishTimer;
    const loaders = ASSETS.map(src => {
      const image = new Image();
      let settled = false;
      let timeout;
      function finish() {
        if (settled) return;
        settled = true;
        loaded += 1;
        clearTimeout(timeout);
        image.onload = null;
        image.onerror = null;
      }
      image.onload = finish;
      image.onerror = finish;
      // An unavailable image should not prevent access to the desktop.
      timeout = setTimeout(finish, 8000);
      image.src = src;
      return { image, timeout };
    });

    // Ease toward actual completed loads, keeping the boot screen readable.
    const animation = setInterval(() => {
      const target = Math.floor(loaded / ASSETS.length * 100);
      displayed = Math.min(target, displayed + 2);
      setProgress(displayed);
      if (displayed === 100) {
        clearInterval(animation);
        finishTimer = setTimeout(() => setReady(true), 600);
      }
    }, 70);

    return () => {
      clearInterval(animation);
      clearTimeout(finishTimer);
      loaders.forEach(({ image, timeout }) => {
        clearTimeout(timeout);
        image.onload = null;
        image.onerror = null;
      });
    };
  }, []);

  if (ready) return children;

  const message = progress === 100 ? 'Ready. Welcome home!' : progress < 35 ? 'Getting things ready…' : progress < 75 ? 'Loading your desktop…' : 'Putting everything in place…';

  return (
    <main className="boot-screen" aria-busy="true">
      <div className="boot-card">
        <div className="boot-titlebar"><span>BuzzOS</span><span>Starting up…</span></div>
        <span className="boot-eyebrow">A LITTLE WORLD BY KELLEY</span>
        <img className="boot-buzz" src={buzz} alt="Buzz, your desktop companion" />
        <h1>Buzz<span>OS</span></h1>
        <p className="boot-tagline">Small steps. A world of possibilities.</p>
        <div className="boot-progress-label"><span>Starting BuzzOS</span><span>{progress}%</span></div>
        <div
          className="boot-progress"
          role="progressbar"
          aria-label="Loading BuzzOS desktop"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div className="boot-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="boot-status" role="status">{message}</p>
        <span className="boot-footer">Made with curiosity. Powered by Buzz.</span>
      </div>
    </main>
  );
}
