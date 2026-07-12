import React from "react";
import "./Message.css";

/**
 * Single chat message component.
 * User messages appear right-aligned with a bubble.
 * Assistant messages appear left-aligned without a bubble.
 * Uses plain text display (pre-wrap) to match the original HTML.
 */
export default function Message({ role, content }) {
  const isUser = role === "user";

  return (
    <div className={`message ${isUser ? "user" : "assistant"}`}>
      <div className={`avatar ${isUser ? "user-avatar" : "bot-avatar"}`}>
        {isUser ? "U" : "AI"}
      </div>
      <div className="message-content">{content}</div>
    </div>
  );
}
