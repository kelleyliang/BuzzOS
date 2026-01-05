import "./Taskbar.css";

export default function Taskbar({windows, onRestore}) {
    return (
        <div className="taskbar">
            {windows.map(w=> (
                <button
                    key={w.id}
                    className="taskbar-item"
                    onClick={() =>onRestore(w.id)}
                >
                    {w.title}
                    {w.minimized ? " (minimized)" : ""}  
                </button>
            ))}
        </div>
    );
}
