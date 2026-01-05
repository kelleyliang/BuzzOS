import React from "react";
import "./DesktopIcon.css";

export default function DesktopIcon({icon, label, onDoubleClick}) {
    // icon, label, and onDoubleClick passed through in the component specifier
    return (
        <div
            className = "desktop-icon"
            onDoubleClick = {onDoubleClick}
        >
            <img src = {icon} className="desktop-icon-img"/>
            <p className="desktop-icon-label">{label}</p>

        </div>
    );
}