import React from "react";
import "./Welcome.css";

/**
 * Welcome screen shown when no messages exist.
 * Displays heading and description text.
 */
export default function Welcome() {
  return (
    <div className="welcome">
      <h1>How can I help you today?</h1>
      <p>
        Ask questions, upload documents, use tools, search the web, and chat
        with memory.
      </p>
    </div>
  );
}
