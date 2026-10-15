import React, { useEffect, useState } from "react";
import { readPreferences, savePreferences } from "./settings/preferences";
import Desktop from "./components/Desktop";
import DesktopIcon from "./components/DesktopIcon";
import Window from "./components/Window";
import roadmapIcon from "./assets/roadmap.svg";
import notesIcon from "./assets/notes.svg";
import snakeIcon from "./assets/snake.svg";
import minesweeperIcon from "./assets/minesweeper.svg";
import digdugIcon from "./assets/digdug.svg";
import pomodoroIcon from "./assets/pomodoro.svg";
import aboutIcon from "./assets/buzz-character.png";
import todoIcon from "./assets/todo.svg";
import Taskbar from "./components/Taskbar";
import AboutMe from "./components/AboutMe";
import Todo from "./components/Todo";
import Notebook from "./components/Notebook";
import Roadmap from "./components/Roadmap";
import Updates from "./components/Updates";
import MusicPlayer from "./components/MusicPlayer";
import updatesIcon from "./assets/updates.svg";
import musicIcon from "./assets/music.svg";


// APPLICATIONS
import Pomodoro from "./components/Pomodoro";
import Snake from "./components/Snake";
import Minesweeper from "./components/Minesweeper";
import DigDug from "./components/DigDug";

const APPLICATIONS = [
  { id: 'roadmap', label: 'Roadmap', title: 'BuzzOS Roadmap', description: 'See what’s coming next', icon: roadmapIcon, Component: Roadmap, options: { baseWidth: 400, baseHeight: 440 } },
  { id: 'notes', label: 'Notebook', title: 'Notebook', description: 'A place for your thoughts', icon: notesIcon, Component: Notebook, options: { baseWidth: 400, baseHeight: 440 } },
  { id: 'snake', label: 'Snake', title: 'Snake', description: 'One more snack, one more turn', icon: snakeIcon, Component: Snake, options: { aspectRatio: 4 / 3, baseWidth: 500 } },
  { id: 'minesweeper', label: 'Minesweeper', title: 'Minesweeper', description: 'Clear a little minefield', icon: minesweeperIcon, Component: Minesweeper, options: { baseWidth: 400, baseHeight: 560, contentClassName: 'window-content-game' } },
  { id: 'digdug', label: 'Dig Dug', title: 'Dig Dug · Tunnel Trouble', description: 'Dig, pump, and dodge', icon: digdugIcon, Component: DigDug, options: { baseWidth: 760, baseHeight: 900, contentClassName: 'window-content-game' } },
  { id: 'music', label: 'CD Player', title: 'CD Player', description: 'Mellow jazz for your desktop', icon: musicIcon, Component: MusicPlayer, options: { baseWidth: 340, baseHeight: 510 } },
  { id: 'updates', label: 'Updates', title: 'BuzzOS Updates', description: 'The latest from BuzzOS', icon: updatesIcon, Component: Updates, options: { baseWidth: 420, baseHeight: 460 } },
  { id: 'pomodoro', label: 'Pomodoro', title: 'Pomodoro Timer', description: 'A little time to focus', icon: pomodoroIcon, Component: Pomodoro, options: { aspectRatio: 320 / 220, baseWidth: 320 } },
  { id: 'about', label: 'Meet Buzz', title: 'Meet Buzz', description: 'The story behind the desktop', icon: aboutIcon, Component: AboutMe, options: { baseWidth: 440, baseHeight: 500 } },
  { id: 'todo', label: 'Todo', title: 'Todo List', description: 'Small steps, checked off', icon: todoIcon, Component: Todo, options: { baseWidth: 360 } },
];

function App() {
  // defined hooks
  const [windows, setWindows] = useState([]);
  const [activeWindowId, setActiveWindowId] = useState(null);
  const [startOpen, setStartOpen] = useState(false);
  const [preferences, setPreferences] = useState(readPreferences);

  useEffect(() => { savePreferences(preferences); }, [preferences]);

  // constants
  const BASE_WIDTH = 300;
  const BASE_HEIGHT = 220;
  const MAX_SCALE = 2;


  // TASKBAR ACTIONS
  function handleTaskBarClick(id) {
    const window = windows.find(w => w.id === id);
    if (!window) return;

    // case 1: minimized -> restore and focus
    if (window.minimized) {
      restoreWindow(id);
      activateWindow(id);
      return;
    }

    // case 2: active -> minimize
    if (activeWindowId === id) {
      minimizeWindow(id)
      return;
    }

    // case 3: inactive -> bring to fron and focus
    activateWindow(id);
  }

  // WINDOW FUNCTIONS
  function openWindow(id, title, content, options = {}) {
    // If already open, do nothing (later we bring to front)
    if (windows.some(w => w.id === id)) {
      restoreWindow(id);
      return;
    }
    const baseWidth = options.baseWidth ?? 300;
    const aspectRatio = options?.aspectRatio ?? null;
    const TITLEBAR_HEIGHT = 32;

    let width = Math.min(baseWidth, window.innerWidth - 24);
    const availableHeight = window.innerHeight - 64;
    if (aspectRatio) width = Math.min(width, (availableHeight - TITLEBAR_HEIGHT) * aspectRatio);
    const height = aspectRatio
      ? Math.round(width / aspectRatio) + TITLEBAR_HEIGHT
      : Math.min(options.baseHeight ?? 200, availableHeight);

    const TASKBAR_HEIGHT = 40;
    const x = Math.round((window.innerWidth - width) / 2);
    const y = Math.round((window.innerHeight - TASKBAR_HEIGHT - height) / 2);

    setWindows(prev => {
      const maxZ = Math.max(...prev.map(w => w.zIndex), 0);
      return [
        ...prev,
        {
          id,
          title,
          content,
          position: { x, y },
          size: { width, height },
          zIndex: maxZ + 1,
          minimized: false,
          maximized: false,
          prevMaximizePosition: null,
          prevMinimizePosition: null,
          aspectRatio: options.aspectRatio ?? null,
          contentClassName: options.contentClassName ?? ""
        }
      ];
    });
    activateWindow(id)
  }

  function activateWindow(id) {
    setActiveWindowId(id);

    setWindows(prev => {
      const maxZ = Math.max(...prev.map(w => w.zIndex), 0);

      return prev.map(w=>
        w.id === id? { ...w, zIndex: maxZ + 1} // this window goes on top
        : w
      );
    });
  }

  function updateWindowSize(id, newSize) {
    setWindows(prev => 
      prev.map(w=>
        w.id === id ? { ...w, size: newSize} : w
      )
    );
  }

  function updateWindowPosition(id, newPos) {
    setWindows(prev =>
      prev.map(w =>
        w.id === id ? {...w, position: newPos } : w
      )
    );
  }

  function toggleMaximize(id) {
    setWindows(prev =>
      prev.map(w => {
        if (w.id !== id) return w;
        
        // have the correct window id and maximize is false
        if (!w.maximized) {
          // maximize
          return {
            ...w,
            maximized: true,
            prevMaximizePosition: w.position,
            position: {x: 0, y: 0}
          };
        } else {
          // restore pre maximized version
          return {
            ...w,
            maximized:false,
            position: w.prevMaximizePosition,
            prevMaximizePosition: null
          };
        }
      })
    );
  }

  function minimizeWindow(id) {
    setWindows(prev =>
      prev.map(w =>
        w.id === id ? {...w, minimized: true, prevMinimizePosition: w.position} : w
      )
    );
  }
  
  function restoreWindow(id) {
    setWindows(prev =>
      prev.map(w =>
        w.id === id 
          ? {
              ... w, 
              minimized: false,
              position: w.prevMinimizePosition ?? w.position,
              prevMinimizePosition: null
            } 
          : w
      )
    );
    activateWindow(id);
  }



  function closeWindow(id) {
    setWindows(prev => prev.filter(w => w.id !== id));
    if (activeWindowId === id) {
      setActiveWindowId(null);
    }
  }

 


  function launchApp(id) {
    const app = APPLICATIONS.find(item => item.id === id);
    if (!app) return;
    setStartOpen(false);
    const Component = app.Component;
    openWindow(app.id, app.title, <Component />, app.options);
  }

  function showDesktop() {
    setWindows(current => current.map(item => ({ ...item, minimized: true, prevMinimizePosition: item.position })));
    setActiveWindowId(null);
    setStartOpen(false);
  }

  // what we return, actual rendering occurs
  return (
    <Desktop wallpaper={preferences.wallpaper}>
      {/* TASKBAR */}
      <Taskbar  
        windows={windows}
        activeWindowId={activeWindowId}
        onClickWindow={handleTaskBarClick}
        apps={APPLICATIONS}
        startOpen={startOpen}
        onStartChange={setStartOpen}
        onLaunch={launchApp}
        onShowDesktop={showDesktop}
        preferences={preferences}
        onPreferencesChange={setPreferences}
      />

      {/* The desktop and Start menu share the same application catalog. */}
      {preferences.showIcons && <div className="desktop-icons">
        {APPLICATIONS.map(app => (
          <DesktopIcon key={app.id} icon={app.icon} label={app.label} onDoubleClick={() => launchApp(app.id)} />
        ))}
      </div>}

      {/* WINDOWS */}
      {windows.map(window => {
        const windowMetrics = {
        width: window.size.width,
        height: window.size.height,
        scale: Math.min(
          window.size.width / BASE_WIDTH,
          window.size.height / BASE_HEIGHT,
          MAX_SCALE
        )
      };
      
      return (
        <Window
          key={window.id}
          id ={window.id}
          title={window.title}
          position={window.position}
          size={window.size}
          zIndex={window.zIndex}
          minimized={window.minimized}
          maximized={window.maximized}
          isActive={activeWindowId === window.id && !startOpen}
          onFocus={() => activateWindow(window.id)}
          onClose={() => closeWindow(window.id)}
          onMinimize={() => minimizeWindow(window.id)}
          onMaximize={() => toggleMaximize(window.id)}
          onMove={(pos) => updateWindowPosition(window.id, pos)}
          aspectRatio={window.aspectRatio}
          contentClassName={window.contentClassName}
          onResize={(newSize) => updateWindowSize(window.id, newSize)}
        >
          {React.isValidElement(window.content)
            ? React.cloneElement(window.content, {
                windowMetrics,
                isActive: activeWindowId === window.id && !startOpen,
                minimized: window.minimized,
              })
            : window.content}
        </Window>
      );
    })}

    </Desktop>
  );
}

export default App;
