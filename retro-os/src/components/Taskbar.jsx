import "./Taskbar.css";
import Clock from "./Clock";
import buzz from "../assets/buzz.png"; 

export default function Taskbar({windows, activeWindowId, onClickWindow}) {
    return (
        <div className="taskbar">
            {/* LEFT SYSTEM AREA*/ }
            <div className="taskbar-left">
              
                <img
                    src={buzz}
                    alt="buzz"
                    className="taskbar-buzz"
                />
            
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
          
                <Clock />
               
            </div>  
        </div>
    );
}
