import { useEffect, useState } from "react";
import "./Clock.css";

export default function Clock({ clock24 = false }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = String(clock24 ? time.getHours() : time.getHours() % 12 || 12).padStart(2, '0');

  const minutes = String(time.getMinutes()).padStart(2, "0");

  const ampm = time.getHours() >= 12 ? "PM" : "AM";
  const showColon = time.getSeconds() % 2 === 0;

  return (
    <div className="clock">
      {hours}
      <span className={`clock-colon ${showColon ? "on" : "off"}`}>:</span>
      {minutes}
      {!clock24 && <span className="clock-ampm">{ampm}</span>}
    </div>
  );
}
