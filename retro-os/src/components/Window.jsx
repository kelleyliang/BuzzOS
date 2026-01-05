import React, { useRef, useState, useEffect } from "react";
import "./Window.css";

export default function Window({ title, children, onClose, position, zIndex, onFocus}) {
    const WindowRef = useRef();
    const [pos, setPos] = useState(position);
    const [dragging, setDragging] = useState(false);
    const offset = useRef({ x: 0, y: 0 });

    // dragging is true when mouse is clicking down
    function onMouseDown(e) {
        setDragging(true);
        offset.current = {
            x: e.clientX - pos.x,
            y: e.clientY - pos.y
        };
    }

    // smooth dragging using global mousemove
    useEffect(() => {
        function handleMouseMove(e) {
            if (!dragging) return;
            let newX = e.clientX - offset.current.x;
            let newY = e.clientY - offset.current.y;

            // clamp values so window stays in viewport
            const maxX = window.innerWidth - 300;  // 300px = window width
            const maxY = window.innerHeight - 200; // adjust based on your window height

            if (newX < 0) newX = 0;
            if (newY < 0) newY = 0;
            if (newX > maxX) newX = maxX;
            if (newY > maxY) newY = maxY;

            setPos({ x: newX, y: newY });

        }

        // when mouse is not clicking down on track, drag is false
        function handleMouseUp() {
            setDragging(false);
        }

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [dragging]);

    return (
        <div
            className="window"
            style={{
                top: pos.y,
                left: pos.x,
                zIndex: zIndex
            }}
            onMouseDown={onFocus}
        >
            <div className="window-titlebar" onMouseDown={(e) => {onMouseDown(e); onFocus();}}>
                <span>{title}</span>
                <button className="window-close" onClick={onClose}>x</button>
            </div>

            <div className="window-content">
                {children}
            </div>
        </div>
    );
}
