import React, { useEffect, useRef } from "react";
import { useChat } from "../../context/ChatContext";
import Welcome from "../Welcome/Welcome";
import PromptCards from "../PromptCards/PromptCards";
import Message from "../Message/Message";
import ToolProgress from "../ToolProgress/ToolProgress";
import "./ChatContainer.css";

/**
 * Main chat container.
 * Shows welcome screen + prompt cards when no messages,
 * or the message list with tool progress indicators.
 * Auto-scrolls to bottom on new messages.
 */
export default function ChatContainer({ onUsePrompt }) {
  const { messages, showWelcome, toolProgress } = useChat();
  const containerRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, toolProgress]);

  return (
    <div className="chat-container" ref={containerRef}>
      {showWelcome && messages.length === 0 && (
        <>
          <Welcome />
          <PromptCards onUsePrompt={onUsePrompt} />
        </>
      )}

      {messages.map((msg, index) => (
        <Message key={index} role={msg.role} content={msg.content} />
      ))}

      {toolProgress && (
        <ToolProgress
          toolName={toolProgress.toolName}
          isComplete={toolProgress.isComplete}
        />
      )}
    </div>
  );
}
