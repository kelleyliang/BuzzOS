// pomodoro timer
// function: 25 min work, 5 min break

import {useEffect, useState, useRef} from "react";
import"./Pomodoro.css";

const POMODORO_SECONDS = 25 * 60; // 25 mins


export default function Pomodoro( {windowMetrics} ) {
    // safeguard here why though
    if (!windowMetrics) return null;

    const [secondsLeft, setSecondsLeft] = useState(POMODORO_SECONDS);
    const [running, setRunning] = useState(false);
    const intervalRef = useRef(null);

  

    useEffect(() => {
        if (!running) return;
        intervalRef.current = setInterval(() => {
            setSecondsLeft (prev => {
                if (prev<= 1) {
                    clearInterval(intervalRef.current);
                    setRunning(false);
                    return 0;
                }
                return prev -1;
            });
        }, 1000);

        return () => clearInterval(intervalRef.current);
    }, [running]);
    
    function reset() {
        clearInterval(intervalRef.current);
        setRunning(false);
        setSecondsLeft(POMODORO_SECONDS);
    }
    
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;

    return (
        <div className="pomodoro">
            <div 
                className="pomodoro-inner"
                style={{
                    transform: `scale(${windowMetrics})`,
                    transformOrigin: "top center"
                }}
            > 
                <div className="pomodoro-time">
                    {String(minutes).padStart(2, "0")}:
                    {String(seconds).padStart(2, "0")}
                </div>

                <div className="pomodoro-controls">
                    <button 
                        className="pomodoro-button"
                        onClick={() => setRunning(true)} 
                        disabled={running}
                    >
                        Start
                    </button>
                    <button 
                        className="pomodoro-button"
                        onClick={() => setRunning(false)}
                    >
                        Pause
                    </button>
                    <button 
                        className="pomodoro-button"
                        onClick={reset}
                    >
                        Reset
                    </button>
                </div>
            </div>
        </div>
        
    );
}