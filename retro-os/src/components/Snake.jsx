import { useEffect, useRef, useState } from "react";
import "./Snake.css";

const COLS = 20;
const ROWS = 15;
const TICK_MS = 180;

const DIRECTIONS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

const SNACK_COLORS = ["#ff3333", "#ff9900", "#ff66cc", "#ffcc00", "#66ffcc", "#ff6633"];

function randomFood(snake) {
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  return pos;
}

function randomColor() {
  return SNACK_COLORS[Math.floor(Math.random() * SNACK_COLORS.length)];
}

export default function Snake() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const gameLoop = useRef(null);
  const dirRef = useRef({ x: 1, y: 0 });
  const nextDirRef = useRef({ x: 1, y: 0 });
  const scoreRef = useRef(0);
  const gameStateRef = useRef("loading");
  const snakeRef = useRef([{ x: 3, y: 7 }, { x: 2, y: 7 }, { x: 1, y: 7 }]);
  const foodRef = useRef(randomFood(snakeRef.current));
  const snackColorRef = useRef(randomColor());
  const canvasSizeRef = useRef({ width: 0, height: 0 });

  const [gameState, setGameState] = useState("loading");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("buzzos-snake-high");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  function updateGameState(state) {
    gameStateRef.current = state;
    setGameState(state);
  }

  function draw() {
    const ctx = canvasRef.current?.getContext("2d");
    const size = canvasSizeRef.current;
    if (!ctx || size.width === 0) return;

    const cellSize = size.width / COLS;

    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, size.width, size.height);

    // draw snack
    const fx = foodRef.current.x * cellSize + cellSize / 2;
    const fy = foodRef.current.y * cellSize + cellSize / 2;
    ctx.beginPath();
    ctx.arc(fx, fy, cellSize / 2 - 3, 0, Math.PI * 2);
    ctx.fillStyle = snackColorRef.current;
    ctx.fill();

    // snake body
    snakeRef.current.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? "#00ff00" : "#00cc00";
      ctx.fillRect(
        seg.x * cellSize + 1,
        seg.y * cellSize + 1,
        cellSize - 2,
        cellSize - 2
      );
    });
  }

  function tick() {
    if (gameStateRef.current !== "playing") return;

    dirRef.current = nextDirRef.current;
    const snake = snakeRef.current;
    const head = snake[0];
    const newHead = {
      x: head.x + dirRef.current.x,
      y: head.y + dirRef.current.y,
    };

    // wall or self collision — game over
    if (
      newHead.x < 0 || newHead.x >= COLS ||
      newHead.y < 0 || newHead.y >= ROWS ||
      snake.some(s => s.x === newHead.x && s.y === newHead.y)
    ) {
      clearInterval(gameLoop.current);
      updateGameState("over");
      setHighScore(prev => {
        const newHigh = Math.max(prev, scoreRef.current);
        localStorage.setItem("buzzos-snake-high", String(newHigh));
        return newHigh;
      });
      draw();
      return;
    }

    const newSnake = [newHead, ...snake];

    // eat snack
    if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
      foodRef.current = randomFood(newSnake);
      snackColorRef.current = randomColor();
      scoreRef.current += 1;
      setScore(scoreRef.current);
    } else {
      newSnake.pop();
    }

    snakeRef.current = newSnake;
    draw();
  }

  function startGame() {
    snakeRef.current = [{ x: 3, y: 7 }, { x: 2, y: 7 }, { x: 1, y: 7 }];
    foodRef.current = randomFood(snakeRef.current);
    snackColorRef.current = randomColor();
    dirRef.current = { x: 1, y: 0 };
    nextDirRef.current = { x: 1, y: 0 };
    scoreRef.current = 0;
    setScore(0);
    updateGameState("playing");
    draw();

    clearInterval(gameLoop.current);
    gameLoop.current = setInterval(tick, TICK_MS);
  }

  // loading screen timer
  useEffect(() => {
    const timer = setTimeout(() => updateGameState("idle"), 1500);
    return () => clearTimeout(timer);
  }, []);

  // resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function measure() {
      const rect = container.getBoundingClientRect();
      const headerHeight = 28;
      const padding = 12;
      const availW = rect.width - padding * 2;
      const availH = rect.height - headerHeight - padding;

      const cellFromW = Math.floor(availW / COLS);
      const cellFromH = Math.floor(availH / ROWS);
      const cell = Math.max(8, Math.min(cellFromW, cellFromH));

      const newSize = { width: cell * COLS, height: cell * ROWS };
      canvasSizeRef.current = newSize;
      setCanvasSize(newSize);
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [gameState]);

  // redraw on resize
  useEffect(() => {
    if (gameState !== "loading") draw();
  }, [canvasSize]);

  // keyboard
  useEffect(() => {
    function handleKey(e) {
      const state = gameStateRef.current;
      if (state === "idle" || state === "over") {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          startGame();
        }
        return;
      }

      const newDir = DIRECTIONS[e.key];
      if (!newDir) return;

      e.preventDefault();
      if (newDir.x + dirRef.current.x === 0 && newDir.y + dirRef.current.y === 0) return;
      nextDirRef.current = newDir;
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // cleanup
  useEffect(() => {
    return () => clearInterval(gameLoop.current);
  }, []);

  if (gameState === "loading") {
    return (
      <div className="snake snake-loading" ref={containerRef}>
        <div className="snake-loading-text">Snake</div>
        <div className="snake-loading-sub">loading...</div>
      </div>
    );
  }

  return (
    <div className="snake" ref={containerRef}>
      <div className="snake-header">
        <span>Score: {score}</span>
        <span>Best: {highScore}</span>
      </div>
      <div className="snake-board-wrapper">
        <canvas
          ref={canvasRef}
          className="snake-canvas"
          width={canvasSize.width}
          height={canvasSize.height}
        />
        {gameState !== "playing" && (
          <div className="snake-overlay">
            <div className="snake-overlay-title">
              {gameState === "over" ? "Game Over" : "Snake"}
            </div>
            {gameState === "over" && (
              <div className="snake-overlay-score">Score: {score}</div>
            )}
            <div className="snake-overlay-sub">
              Press Space to {gameState === "over" ? "restart" : "start"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
