import React, { useState } from "react";
import Desktop from "./components/Desktop";
import DesktopIcon from "./components/DesktopIcon";
import Window from "./components/Window";
import roadmapIcon from "./assets/roadmap.svg";
import notesIcon from "./assets/notes.svg";
import snakeIcon from "./assets/snake.svg";
import minesweeperIcon from "./assets/minesweeper.svg";
import digdugIcon from "./assets/digdug.svg";
import pomodoroIcon from "./assets/pomodoro.svg";
import aboutIcon from "./assets/about.svg";
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


function App() {
  // defined hooks
  const [windows, setWindows] = useState([]);
  const [activeWindowId, setActiveWindowId] = useState(null);

  // constants
  const POMODORO_BASE_WIDTH = 320;
  const POMODORO_BASE_HEIGHT = 220;

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
      activateWindow(id);
      return;
    }
    const baseWidth = options.baseWidth ?? 300;
    const aspectRatio = options?.aspectRatio ?? null;
    const TITLEBAR_HEIGHT = 32;

    const width = baseWidth;
    const height = aspectRatio
      ? Math.round(baseWidth / aspectRatio) + TITLEBAR_HEIGHT
      : options.baseHeight ?? 200;

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

 


  // what we return, actual rendering occurs
  return (
    <Desktop>
      {/* TASKBAR */}
      <Taskbar  
        windows={windows}
        activeWindowId={activeWindowId}
        onClickWindow={handleTaskBarClick}
      />

      {/* ICONS */}
      <div className="desktop-icons">
      <DesktopIcon
        icon={roadmapIcon}
        label="Roadmap"
        onDoubleClick={() => openWindow("roadmap", "BuzzOS Roadmap", <Roadmap />,
          { baseWidth: 400, baseHeight: 440 })}
      />

      <DesktopIcon
        icon={notesIcon}
        label="Notebook"
        onDoubleClick={() => openWindow("notes", "Notebook", <Notebook />, { baseWidth: 400, baseHeight: 440 })}
      />

      <DesktopIcon
        icon={snakeIcon}
        label="Snake"
        onDoubleClick={() =>
          openWindow(
            "snake",
            "Snake",
            <Snake />,
            { aspectRatio: 4 / 3, baseWidth: 500 }
          )
        }
      />
      <DesktopIcon
        icon={minesweeperIcon}
        label="Minesweeper"
        onDoubleClick={() => openWindow("minesweeper", "Minesweeper", <Minesweeper />,
          { baseWidth: Math.min(380, window.innerWidth - 24), baseHeight: Math.min(490, window.innerHeight - 64) })}
      />
      <DesktopIcon
        icon={digdugIcon}
        label="Dig Dug"
        onDoubleClick={() => openWindow("digdug", "Dig Dug · Tunnel Trouble", <DigDug />,
          {
            baseWidth: Math.min(760, window.innerWidth - 24),
            baseHeight: Math.min(900, window.innerHeight - 64),
            contentClassName: "window-content-game"
          })}
      />
      <DesktopIcon
        icon={musicIcon}
        label="CD Player"
        onDoubleClick={() =>
          openWindow(
            "music",
            "CD Player",
            <MusicPlayer />,
            { baseWidth: 340, baseHeight: 470 }
          )
        }
      />

      <DesktopIcon
        icon={updatesIcon}
        label="Updates"
        onDoubleClick={() => openWindow("updates", "BuzzOS Updates", <Updates />,
          { baseWidth: 420, baseHeight: 460 })}
      />

      <DesktopIcon
        icon={pomodoroIcon}
        label="Pomodoro"
        onDoubleClick={() =>
          openWindow(
            "pomodoro",
            "Pomodoro Timer",
            <Pomodoro/>,
            {aspectRatio: POMODORO_BASE_WIDTH / POMODORO_BASE_HEIGHT,
              baseWidth: 320
            }
            
          )
        }
      />
      <DesktopIcon
        icon={aboutIcon}
        label="Meet Buzz"
        onDoubleClick={() =>
          openWindow(
            "about",
            "Meet Buzz",
            <AboutMe />,
            { baseWidth: 440, baseHeight: 500 }
          )
        }
      />
      <DesktopIcon
        icon={todoIcon}
        label="Todo"
        onDoubleClick={() =>
          openWindow(
            "todo",
            "Todo List",
            <Todo />,
            { baseWidth: 360 }
          )
        }
      />
      </div>

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
          isActive={activeWindowId === window.id}
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
                isActive: activeWindowId === window.id,
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
