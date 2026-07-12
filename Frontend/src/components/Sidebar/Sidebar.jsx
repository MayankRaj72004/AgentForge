import React from "react";
import { useChat } from "../../context/ChatContext";
import ConversationHistory from "../ConversationHistory/ConversationHistory";
import "./Sidebar.css";

/**
 * Sidebar with brand name, new chat button, and conversation history.
 * Hidden on mobile (≤768px) via CSS.
 */
export default function Sidebar() {
  const { newChat } = useChat();

  return (
    <aside className="sidebar">
      <div className="brand">MyGPT</div>

      <button className="new-chat" onClick={newChat}>
        + New chat
      </button>

      <div className="history-title">Recent Chats</div>

      <ConversationHistory />
    </aside>
  );
}
