import { useEffect, useRef, useState } from "react";
import "./MusicPlayer.css";

function timestamp(seconds) {
  const value = Number.isFinite(seconds) ? Math.floor(seconds) : 0;
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}

export default function MusicPlayer() {
  const audioRef = useRef(null);
  const [track, setTrack] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!track) return;
    return () => URL.revokeObjectURL(track.url);
  }, [track]);

  function loadTrack(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    audioRef.current.pause();
    setPlaying(false);
    setPosition(0);
    setDuration(0);
    setError("");
    setTrack({ name: file.name.replace(/\.[^.]+$/, ""), url: URL.createObjectURL(file) });
    event.target.value = "";
  }

  async function togglePlayback() {
    if (playing) audioRef.current.pause();
    else {
      try {
        await audioRef.current.play();
        setError("");
      } catch {
        setError("This file couldn’t play. Try another audio file.");
      }
    }
  }

  return (
    <div className="cd-player">
      <audio ref={audioRef} src={track?.url} preload="metadata"
        onLoadedMetadata={() => {
          setDuration(Number.isFinite(audioRef.current.duration) ? audioRef.current.duration : 0);
          audioRef.current.volume = volume;
        }}
        onTimeUpdate={() => setPosition(audioRef.current.currentTime)}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() => { setPlaying(false); setError("This file couldn’t play. Try another audio file."); }}
      />
      <div className="cd-deck" aria-hidden="true">
        <div className={`cd-disc ${playing ? "is-playing" : ""}`}><span className="cd-label">BUZZOS<br />SIDE A</span><span className="cd-hole" /></div>
      </div>
      <div className="cd-display" aria-live="polite"><small>{playing ? "NOW PLAYING" : track ? "READY TO PLAY" : "NO DISC"}</small><div title={track?.name}>{track?.name ?? "Your little listening corner"}</div></div>
      <div className="cd-progress"><span>{timestamp(position)}</span><input aria-label="Track position" type="range" min="0" max={duration || 0} step="0.1" value={position} disabled={!duration} onChange={event => { const value = Number(event.target.value); audioRef.current.currentTime = value; setPosition(value); }} /><span>{timestamp(duration)}</span></div>
      <div className="cd-controls">
        <button aria-label="Restart track" disabled={!track || !duration} onClick={() => { audioRef.current.currentTime = 0; setPosition(0); }}>↺</button>
        <button className="cd-play" disabled={!track} onClick={togglePlayback}>{playing ? "Pause" : "Play"}</button>
        <label className="cd-load">Load music<input type="file" accept="audio/*" onChange={loadTrack} /></label>
      </div>
      <label className="cd-volume">Volume<input aria-label="Volume" type="range" min="0" max="1" step="0.01" value={volume} onChange={event => { const value = Number(event.target.value); setVolume(value); audioRef.current.volume = value; }} /></label>
      <p className="cd-hint">{error || "Pick an audio file from your computer. It stays on your device."}</p>
    </div>
  );
}
