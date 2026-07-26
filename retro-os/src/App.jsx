import React, { useState } from "react";
import Desktop from "./components/Desktop";
import DesktopIcon from "./components/DesktopIcon";
import Window from "./components/Window";
import folderIcon from "./assets/folder.png";
import Taskbar from "./components/Taskbar";
import AboutMe from "./components/AboutMe";
import Todo from "./components/Todo";


// APPLICATIONS
import Pomodoro from "./components/Pomodoro";
import Snake from "./components/Snake";


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

    const width = aspectRatio
      ? baseWidth
      : 300;
    const height = aspectRatio
      ? Math.round(baseWidth / aspectRatio) + TITLEBAR_HEIGHT
      : 200;

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
          aspectRatio: options.aspectRatio ?? null
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
        icon={folderIcon}
        label="To Do"
        onDoubleClick={() => openWindow("to do", "Work in progress",
          <ul>
            <li>MVP
              <ul>
                <li>Fix bugs</li>
                <li>One game</li>
              </ul>
            </li>

            <li>Bugs
              <ul>
                <li>Fix time when its :0#</li>
                <li>Dynamic sizing, fixed ratios, proper initial render</li>
                <li>pomodoro timer resets when minimzed</li>
              </ul>
            </li>
            
            <li>Add different APPLICATIONS
              <ul>
                <li>tic tac toe</li>
                <li>snake</li>
                <li>notes</li>
                <li>paint</li>
              </ul>
            </li>

            <li>Additional
              <ul>
                <li>Buzz loading page</li>
                <li>Menu</li>
                <li>buzz errors</li>
                <li>different pomo options</li>
              </ul>
            </li>
        
            
            <li>Graphics
              <ul>
                <li>buzz</li>
                <li>give image credits</li>

              </ul>
            </li>

          </ul>
          )}
      />

      <DesktopIcon
        icon={folderIcon}
        label="Notes"
        onDoubleClick={() => openWindow("notes", "Notes", <p>Notes go here.</p>)}
      />

      <DesktopIcon
        icon={folderIcon}
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
        icon={folderIcon}
        label="Square Demo"
        onDoubleClick={() =>
          openWindow(
            "square",
            "Square Window",
            <div style={{ background: "#333", height: "100%" }} />,
            { aspectRatio: 1 }
          )
        }
      />

      <DesktopIcon
        icon={folderIcon}
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
        icon={folderIcon}
        label="About"
        onDoubleClick={() =>
          openWindow(
            "about",
            "About BuzzOS",
            <AboutMe />,
            { baseWidth: 360 }
          )
        }
      />
      <DesktopIcon
        icon={folderIcon}
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
          onResize={(newSize) => updateWindowSize(window.id, newSize)}
        >
          {React.isValidElement(window.content)
            ? React.cloneElement(window.content, { windowMetrics })
            : window.content}
        </Window>
      );
    })}

    </Desktop>
  );
}

export default App;
