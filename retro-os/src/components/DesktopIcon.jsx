import React from "react";
import "./DesktopIcon.css";

export default function DesktopIcon({icon, label, onDoubleClick}) {
    // icon, label, and onDoubleClick passed through in the component specifier
    return (
        <div
            className = "desktop-icon"
            onDoubleClick = {onDoubleClick}
        >
            <img src = {icon} alt="" className="desktop-icon-img" draggable={false}/>
            <p className="desktop-icon-label">{label}</p>

        </div>
    );
}
