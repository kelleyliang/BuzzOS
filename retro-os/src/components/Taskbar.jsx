import "./Taskbar.css";
import { useEffect, useRef } from "react";
import Clock from "./Clock";
import StartMenu from "./StartMenu";
import buzz from "../assets/buzz-character.png";

export default function Taskbar({ windows, activeWindowId, onClickWindow, apps, startOpen, onStartChange, onLaunch, onShowDesktop, preferences, onPreferencesChange }) {
    const startAreaRef = useRef(null);
    const startButtonRef = useRef(null);

    useEffect(() => {
        if (!startOpen) return;
        function outsideClick(event) {
            if (!startAreaRef.current?.contains(event.target)) onStartChange(false);
        }
        function handleEscape(event) {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            event.stopImmediatePropagation();
            onStartChange(false);
            startButtonRef.current?.focus();
        }
        function leaveMenu(event) {
            if (event.relatedTarget && !startAreaRef.current?.contains(event.relatedTarget)) onStartChange(false);
        }
        const startArea = startAreaRef.current;
        document.addEventListener('pointerdown', outsideClick);
        window.addEventListener('keydown', handleEscape, true);
        startArea.addEventListener('focusout', leaveMenu);
        return () => {
            document.removeEventListener('pointerdown', outsideClick);
            window.removeEventListener('keydown', handleEscape, true);
            startArea.removeEventListener('focusout', leaveMenu);
        };
    }, [startOpen, onStartChange]);
    return (
        <div className="taskbar">
            {/* LEFT SYSTEM AREA*/ }
            <div className="taskbar-left" ref={startAreaRef}>
                <button type="button" className={`taskbar-start ${startOpen ? 'active' : ''}`} ref={startButtonRef}
                    aria-label="Open BuzzOS menu"
                    aria-expanded={startOpen} aria-controls="buzzos-start-menu" aria-haspopup="dialog"
                    onClick={() => onStartChange(!startOpen)}>
                  <img
                    src={buzz}
                    alt=""
                    className="taskbar-buzz"
                  />
                </button>
                {startOpen && <StartMenu apps={apps} preferences={preferences} onPreferencesChange={onPreferencesChange} onLaunch={onLaunch} onShowDesktop={onShowDesktop} />}
            </div>

            {/* WINDOW BUTTONS*/}
            <div className="taskbar-windows"> 
                {windows.map(w=> (
                    <button
                        key={w.id}
                        className={`taskbar-item ${
                            activeWindowId === w.id ? "active" : ""
                        }`}
                        onClick={() =>onClickWindow(w.id)}
                    >
                        {w.title}
                    </button>
                ))}
            </div>
            {/* RIGHT: Clock */}
            <div className="taskbar-right">
          
              <Clock clock24={preferences.clock24} />
               
            </div>  
        </div>
    );
}
