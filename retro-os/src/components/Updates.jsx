import "./Updates.css";

// Add new milestones here, newest first.
const updates = [
  {
    date: "2026-10-06",
    title: "Dig, pump, and dodge",
    items: [
      "Added Dig Dug · Tunnel Trouble, a Dig Dug-style game with original pixel characters and a custom desktop icon.",
      "Dig with arrow keys or WASD, hold Space to inflate enemies, and drop rocks for bonus points. Includes three lives, scoring, and successive levels.",
      "Enemies start in isolated tunnel pockets and can fade through dirt without digging. Staggered ghost timing keeps them from all phasing at once.",
      "Gave the game a larger window, slower movement, and a longer warning before rocks fall.",
      "Added pause and restart controls, with automatic pausing when switching windows, minimizing, or leaving the browser.",
    ],
  },
  {
    date: "2026-10-05",
    title: "A new minefield to explore",
    items: [
      "Added Minesweeper with a custom desktop icon and classic retro styling.",
      "Choose Beginner, Intermediate, or Expert difficulty, with a safe first move and an elapsed-time counter.",
      "Flag squares with a right-click, the F key, or the flag-mode toggle for touch controls.",
      "Clear neighboring squares by clicking an open number when its flag count matches, and start a fresh board with the smiley button.",
    ],
  },
  {
    date: "2026-10-04",
    title: "A desktop with more personality",
    items: [
      "Added an Updates icon with a dated history of BuzzOS milestones.",
      "Replaced Square Demo with a CD player: local audio, play/pause, restart, seeking, volume, and a spinning CD during playback.",
      "Replaced generic folder icons with custom SVG artwork for every app, including a tomato for Pomodoro.",
      "Turned Notes into Notebook with lined paper and automatic saving in this browser.",
      "Renamed About to Meet Buzz, with Buzz’s artwork and a clearer layout for the story behind the project.",
      "Renamed the old To Do page to Roadmap and organized future ideas separately from the Todo list.",
      "Updated app window sizes to give the new layouts room to breathe.",
    ],
  },
  { date: "2026-07-26", title: "Play & focus", items: ["Added Snake.", "Fixed clock formatting and Pomodoro behavior when minimized or resized.", "Restyled the taskbar, arranged desktop icons, and centered new windows."] },
  { date: "2026-07-23", title: "Keeping track", items: ["Added the Todo app."] },
  { date: "2026-01-22", title: "Hello, internet", items: ["Published BuzzOS to GitHub Pages and updated window titles."] },
  { date: "2026-01-08", title: "Making room", items: ["Added the desktop clock.", "Improved window focus and resizing with fixed aspect ratios."] },
  { date: "2026-01-05", title: "Windows that work", items: ["Added resizing, maximizing, and taskbar controls.", "Fixed window layering, sizing, and taskbar overlap."] },
  { date: "2026-01-04", title: "BuzzOS begins", items: ["Created the desktop and initial window system."] },
];

export default function Updates() {
  return (
    <div className="updates-log">
      <header><span className="updates-eyebrow">THE BUZZOS JOURNAL</span><h2>Small steps, new things.</h2><p>A running log of what’s changed.</p></header>
      {updates.map(update => (
        <article key={update.date}>
          <time dateTime={update.date}>{new Date(`${update.date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</time>
          <h3>{update.title}</h3>
          <ul>{update.items.map(item => <li key={item}>{item}</li>)}</ul>
        </article>
      ))}
    </div>
  );
}
