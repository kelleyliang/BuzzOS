import "./Taskbar.css";

export default function Taskbar({windows, activeWindowId, onClickWindow}) {
    return (
        <div className="taskbar">
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
    );
}
