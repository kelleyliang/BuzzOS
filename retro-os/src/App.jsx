import React, { useState } from "react";
import Desktop from "./components/Desktop";
import DesktopIcon from "./components/DesktopIcon";
import Window from "./components/Window";
import folderIcon from "./assets/folder.png";

function App() {
  const [windows, setWindows] = useState([]);

  function openWindow(id, title, content) {
    // If already open, do nothing (later we bring to front)
    if (windows.some(w => w.id === id)) return;

    setWindows(prev => [
      ...prev,
      {
        id,
        title,
        content,
        position: { x: 100, y: 100 },
        zIndex: prev.length + 1, // new window on top
        minimized: false 
      }
    ]);
  }

  function minimizeWindow(id) {
    setWindows(prev =>
      prev.map(w =>
        w.id === id ? {...w, minimized: trye} : w
      )
    );
  }

  function bringToFront(id) {
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
          onFocus={() => bringToFront(window.id)}
          onClose={() => closeWindow(window.id)}
        >
          {window.content}
        </Window>
      ))}

    </Desktop>
  );
}

export default App;
