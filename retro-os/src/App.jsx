import React, { useState } from "react";
import Desktop from "./components/Desktop";
import DesktopIcon from "./components/DesktopIcon";
import Window from "./components/Window";
import folderIcon from "./assets/folder.png";
import Taskbar from "./components/Taskbar";

function App() {
  const [windows, setWindows] = useState([]);
  const [activeWindowId, setActiveWindowId] = useState(null);

  function openWindow(id, title, content) {
    // If already open, do nothing (later we bring to front)
    if (windows.some(w => w.id === id)) {
      bringToFront(id)
      setActiveWindowId(id); // sets the recent opened to active
      return;
    }
    setWindows(prev => [
      ...prev,
      {
        id,
        title,
        content,
        position: { x: 100, y: 100 },
        zIndex: prev.length + 1, // new window on top
        minimized: false,
        maximized: false,
        prevPosition: null
      }
    ]);
    
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
            prevPosition: w.position,
            position: {x: 0, y: 0}
          };
        } else {
          // restore pre maximized version
          return {
            ...w,
            maximized:false,
            position: w.prevPosition,
            prevPosition: null
          };
        }
      })
    );
  }

  function minimizeWindow(id) {
    setWindows(prev =>
      prev.map(w =>
        w.id === id ? {...w, minimized: true} : w
      )
    );
  }
  
  function restoreWindow(id) {
    setWindows(prev =>
      prev.map(w =>
        w.id === id ? {... w, minimized: false} : w
      )
    );
    setActiveWindowId(id);
    bringToFront(id);
  }

  function bringToFront(id) {
    setActiveWindowId(id);

    setWindows(prev => {
      const maxZ = Math.max(...prev.map(w => w.zIndex), 0);

      return prev.map(w=>
        w.id === id? { ...w, zIndex: maxZ + 1} // this window goes on top
        : w
      );
    });
  }

  function closeWindow(id) {
    setWindows(prev => prev.filter(w => w.id !== id));
  }

  return (
    <Desktop>
      {/* TASKBAR */}
      <Taskbar  
        windows={windows}
        onRestore={restoreWindow}
      />

      {/* ICONS */}
      <DesktopIcon
        icon={folderIcon}
        label="Notes"
        onDoubleClick={() => openWindow("notes", "Notes App", <p>Notes go here.</p>)}
      />

      <DesktopIcon
        icon={folderIcon}
        label="Snake"
        onDoubleClick={() =>
          openWindow("snake", "Snake Game", <p>Snake will go here.</p>)
        }
      />

      {/* WINDOWS */}
      {windows.map(window => (
        <Window
          key={window.id}
          id ={window.id}
          title={window.title}
          position={window.position}
          zIndex={window.zIndex}
          minimized={window.minimized}
          maximized={window.maximized}
          isActive={activeWindowId === window.id}
          onFocus={() => bringToFront(window.id)}
          onClose={() => closeWindow(window.id)}
          onMinimize={() => minimizeWindow(window.id)}
          onMaximize={() => toggleMaximize(window.id)}
          onMove={(pos) => updateWindowPosition(window.id, pos)}
        >
          {window.content}
        </Window>
      ))}

    </Desktop>
  );
}

export default App;
