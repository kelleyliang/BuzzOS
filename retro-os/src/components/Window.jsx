import React, { useRef, useState, useEffect } from "react";
import "./Window.css";

export default function Window({ 
    title, 
    children, 
    isActive,
    onClose, 
    position, 


    onMove,
    zIndex, 
    onFocus,
    onMinimize,
    onMaximize,

    minimized,
    maximized,

    prevMaximizePosition, // before maximize
    prevMinimizePosition // before minimalize
    }) {

    const WindowRef = useRef();
    const lastClickTime = useRef(0);

    const [pos, setPos] = useState(position);
    const [dragging, setDragging] = useState(false);
    const offset = useRef({ x: 0, y: 0 });

    // dragging is true when mouse is clicking down
    function onMouseDown(e) {
        if (maximized) return; // no dragging when window maximized
        setDragging(true);
        offset.current = {
            x: e.clientX - pos.x,
            y: e.clientY - pos.y
        };
    }

    useEffect(() => {
        setPos(position);
    }, [position]);

    // smooth dragging using global mousemove
    useEffect(() => {
        function handleMouseMove(e) {
            if (!dragging || maximized) return;
            let newX = e.clientX - offset.current.x;
            let newY = e.clientY - offset.current.y;

            // clamp values so window stays in viewport
            if (!maximized) {
                const maxX = window.innerWidth - 300;  // 300px = window width
                const maxY = window.innerHeight - 200; // adjust based on your window height

                if (newX < 0) newX = 0;
                if (newY < 0) newY = 0;
                if (newX > maxX) newX = maxX;
                if (newY > maxY) newY = maxY;
            }
            setPos({ x: newX, y: newY });
            onMove({x : newX, y: newY});

        }

        // when mouse is not clicking down on track, drag is false
        function handleMouseUp() {
            // if check for no stale renentries, have to check not sure
            if (dragging) {
                setDragging(false);
            }
        }

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [dragging, maximized]);

    if (minimized) return null;
    
    // adding it correctly here?
    if (!pos) return null;

    return (
       
        <div
            className={`window ${maximized ? "maximized": ""} ${isActive ? "active" : "inactive"}`}
            style={{
                top: pos.y,
                left: pos.x,
                zIndex: zIndex
            }}
            onMouseDown={onFocus}
        >
            <div 
                className="window-titlebar" 
                onMouseDown={(e) => {
                    onFocus();
                    const now = Date.now();
                    const DOUBLE_CLICK_DELAY = 250;
                    
                    // double click = maximize
                    if (now - lastClickTime.current < DOUBLE_CLICK_DELAY) {
                        lastClickTime.current = 0;
                        setDragging(false); // cancel drag, maximize
                        onMaximize();
                        return;
                    }
                    // else this is a single click
                    lastClickTime.current = now;

                    if (!maximized) {
                        setDragging(true);
                        offset.current = {
                            x: e.clientX - pos.x,
                            y: e.clientY - pos.y
                        };
                    }
                }}
            >
                <span>{title}</span>
                <div className="window-controls">
                    <button className={`window-maximize ${maximized ? "active" : ""}`}
                        onClick={onMaximize}
                    />

                    <button className="window-minimize" onClick={onMinimize}/>
                    <button className="window-close" onClick={onClose}/>
                </div>
            </div>

            <div className="window-content">
                {children}
            </div>
        </div>
    );
}
