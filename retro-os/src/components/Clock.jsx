import { useEffect, useState } from "react";
import "./Clock.css";

export default function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = time.toLocaleTimeString([], {
    hour: "2-digit",
    hour12: true
  }).replace(/ AM| PM/, "");

  const minutes = time.toLocaleTimeString([], {
    minute: "2-digit"
  });

  const ampm = time.getHours() >= 12 ? "PM" : "AM";
  const showColon = time.getSeconds() % 2 === 0;

  return (
    <div className="clock">
      {hours}
      <span className={`clock-colon ${showColon ? "on" : "off"}`}>:</span>
      {minutes}
      <span className="clock-ampm">{ampm}</span>
    </div>
  );
}
