import React from "react";
import "./ToolProgress.css";

/**
 * Tool progress indicator.
 * Shows a spinning indicator while tool is running,
 * and a checkmark when completed.
 */
export default function ToolProgress({ toolName, isComplete }) {
  return (
    <div className="tool-progress">
      <div className="tool-progress-box">
        {isComplete ? (
          <span className="tool-check">✓</span>
        ) : (
          <span className="tool-spinner"></span>
        )}
        <span>
          {isComplete ? `${toolName} completed` : `Using ${toolName}...`}
        </span>
      </div>
    </div>
  );
}
