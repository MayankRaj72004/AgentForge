import React from "react";
import "./VoiceSearch.css";

/**
 * Microphone button for voice input.
 * Toggles between 🎙️ and ⏹️ emoji with red pulse animation when recording.
 */
export default function VoiceSearch({ isDictating, onToggle }) {
  return (
    <button
      className={`mic-btn${isDictating ? " recording" : ""}`}
      onClick={onToggle}
      title="Dictate"
    >
      {isDictating ? "⏹️" : "🎙️"}
    </button>
  );
}
