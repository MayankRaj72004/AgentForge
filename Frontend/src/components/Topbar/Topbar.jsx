import React from "react";
import { useChat } from "../../context/ChatContext";
import "./Topbar.css";

/**
 * Top bar with title and dynamic status indicator.
 * Status shows: "Ready", "Thinking with {model}...", "Using {tool}...",
 * "Listening...", "Generating with {model}..."
 */
export default function Topbar() {
  const { status } = useChat();

  return (
    <div className="topbar">
      <div>Agentic AI Chatbot</div>
      <div className="status">{status}</div>
    </div>
  );
}
