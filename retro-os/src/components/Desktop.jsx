import React from "react";
import "./Desktop.css";

export default function Desktop({children, wallpaper = 'hills'}) {
    return (
        // components must return ONE parent element
        /* this class Name lets desktop to be styled like it should be in css*/
        <div className={`desktop desktop-${wallpaper}`}>
            {/* children includes whatever you put in the tag when using
            the Desktop components in app*/} 
            {children}
        </div>
    );
}
