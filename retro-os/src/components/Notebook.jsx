import { useState } from "react";
import "./Journal.css";

export default function Notebook() {
  const [note, setNote] = useState(() => {
    try { return localStorage.getItem("buzzos-notebook") ?? ""; }
    catch { return ""; }
  });
  const [status, setStatus] = useState("Saved on this browser");
  function updateNote(event) {
    const value = event.target.value;
    setNote(value);
    try {
      localStorage.setItem("buzzos-notebook", value);
      setStatus("Saved on this browser");
    } catch {
      setStatus("Couldn’t save. Keep this window open or copy your notes.");
    }
  }
  return (
    <div className="journal notebook">
      <header><span className="journal-eyebrow">A SPACE TO THINK</span><h2>Notebook</h2><p>Loose thoughts, little ideas, anything on your mind.</p></header>
      <textarea aria-label="Your notes" placeholder="Start writing here…" value={note} onChange={updateNote} spellCheck />
      <footer role="status">{status}</footer>
    </div>
  );
}
