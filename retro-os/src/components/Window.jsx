import React, { useRef, useState, useEffect } from "react";
import "./Window.css";

export default function Window({ 
    title, 
    children, 
    isActive,
    onClose, 
    position, 
    size,
    aspectRatio,

    onMove,
    zIndex, 
    onFocus,
    onMinimize,
    onMaximize,
    onResize,

    minimized,
    maximized

    }) {

    const WindowRef = useRef();
    const lastClickTime = useRef(0);
    const clickTimeout = useRef(null);

    const [pos, setPos] = useState(position);
    const [dragging, setDragging] = useState(false);
    const offset = useRef({ x: 0, y: 0 });

    const resizing = useRef(null); // right, bottom, corner

    const mouseDown = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });


    useEffect(() => {
        setPos(position);
    }, [position]);

    // smooth dragging using global mousemove
    useEffect(() => {
        function handleMouseMove(e) {
            // START DRAG ONLY AFTER MOVEMENT
            if (mouseDown.current && !dragging) {
                const dx = Math.abs(e.clientX - dragStart.current.x);
                const dy = Math.abs(e.clientY - dragStart.current.y);

                const DRAG_THRESHOLD = 4;

                if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
                    setDragging(true);
                } else {
                    return;
                }
            }

            // RESIZING LOGIC
            if (resizing.current) {
            
                const TASKBAR_HEIGHT = 40;
                const TITLEBAR_HEIGHT = 32;
                const MIN_CONTENT_SIZE = 200;

                const minContentWidth = MIN_CONTENT_SIZE;
                const minContentHeight = aspectRatio
                    ? Math.round(minContentWidth / aspectRatio)
                    : 120;

                const minWidth = minContentWidth;
                const minHeight = minContentHeight + TITLEBAR_HEIGHT;


                const maxWidth = window.innerWidth - pos.x;
                const maxHeight = window.innerHeight - TASKBAR_HEIGHT - pos.y;
                
                const isWidthDriven = 
                    resizing.current === "right" ||
                    resizing.current === "corner";
                const isHeightDriven = 
                    resizing.current === "bottom" ||
                    (resizing.current === "corner" && !aspectRatio);
                
                let newWidth = size.width;
                let newHeight = size.height;

                if (isWidthDriven) {
                    const rawWidth = e.clientX - pos.x
                    // width is varying, height follows
                    if (aspectRatio) {
                        const maxWidthByHeight =
                            (maxHeight - TITLEBAR_HEIGHT) * aspectRatio;
                        
                        newWidth = Math.min(
                            maxWidth,
                            maxWidthByHeight,
                            Math.max(minWidth, rawWidth)
                        );
                                            
                        newHeight = 
                            Math.round(newWidth / aspectRatio) + TITLEBAR_HEIGHT;
                    } else {
                        newWidth = Math.min(
                            maxWidth, 
                            Math.max(minWidth, rawWidth)
                        );
                    }
                    
                }

                if (isHeightDriven) {
                    const rawHeight = e.clientY - pos.y;

                    if (aspectRatio) {
                        const maxHeightByWidth =
                        Math.round(maxWidth / aspectRatio) + TITLEBAR_HEIGHT;

                        newHeight = Math.min(
                        maxHeight,
                        maxHeightByWidth,
                        Math.max(minHeight, rawHeight)
                        );

                        newWidth =
                        Math.round((newHeight - TITLEBAR_HEIGHT) * aspectRatio);
                    } else {
                        newHeight = Math.min(
                        maxHeight,
                        Math.max(minHeight, rawHeight)
                        );
                    }
                }

                // FINAL SAFETY CLAMP for when there is no aspectRatio
                if (!aspectRatio) {
                    newWidth = Math.min(
                        maxWidth,
                        Math.max(minWidth, newWidth)
                    );

                    newHeight = Math.min(
                        maxHeight,
                        Math.max(minHeight, newHeight)
                    );
                }

                onResize({width: newWidth, height: newHeight}) ;
                
                // NO DRAG WHEN RESIZING IS HAPPENNING
                return;      
            }


            // DRAG LOGIC
            if (!dragging || maximized) return;
            let newX = e.clientX - offset.current.x;
            let newY = e.clientY - offset.current.y;

            // clamp values so window stays in viewport
            if (!maximized) {
                const TASKBAR_HEIGHT = 40;

                const maxX = window.innerWidth - size.width;
                const maxY = window.innerHeight - TASKBAR_HEIGHT - size.height;

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
            mouseDown.current = false;
            setDragging(false);
            resizing.current = null;
        }

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [dragging, maximized, size, pos]);

    if (minimized) return null;
    
    // adding it correctly here?
    if (!pos) return null;

    return (
       
        <div
            className={`window ${maximized ? "maximized": ""} ${isActive ? "active" : "inactive"}`}
            style={{
                top: pos.y,
                left: pos.x,
                width: size.width,
                height: size.height,
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

                // DOUBLE CLICK → MAXIMIZE
                if (now - lastClickTime.current < DOUBLE_CLICK_DELAY) {
                    lastClickTime.current = 0;
                    setDragging(false);
                    mouseDown.current = false;
                    onMaximize();
                    return;
                }

                lastClickTime.current = now;

                // single click → potential drag
                if (!maximized) {
                    mouseDown.current = true;
                    dragStart.current = { x: e.clientX, y: e.clientY };
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

        {/* RIGHT RESIZE */}
        {!aspectRatio && (
        <div
            className="resize-handle resize-right"
            onMouseDown={(e) => {
            e.preventDefault();
            if (maximized) return;
            setDragging(false);
            resizing.current = "right";
            }}
        />
        )}

        {/* BOTTOM RESIZE */}
        {!aspectRatio && (
        <div
            className="resize-handle resize-bottom"
            onMouseDown={(e) => {
            e.preventDefault();
            if (maximized) return;
            setDragging(false);
            resizing.current = "bottom";
            }}
        />
        )}

        {/* CORNER RESIZE (always allowed) */}
        <div
        className="resize-handle resize-corner"
        onMouseDown={(e) => {
            e.preventDefault();
            if (maximized) return;
            setDragging(false);
            resizing.current = "corner";
        }}
        />


        </div>
    );
}
