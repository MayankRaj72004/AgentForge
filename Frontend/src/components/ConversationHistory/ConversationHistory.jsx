import React from "react";
import { useChat } from "../../context/ChatContext";
import "./ConversationHistory.css";

/**
 * Scrollable list of conversation history items.
 * Shows active state for the current thread.
 */
export default function ConversationHistory() {
  const { conversationList, threadId, loadConversation } = useChat();

  if (!conversationList || conversationList.length === 0) {
    return (
      <div className="conversation-history">
        <div className="history-item">No chats yet</div>
      </div>
    );
  }

  return (
    <div className="conversation-history">
      {conversationList.map((conv) => (
        <div
          key={conv.thread_id}
          className={`history-item${conv.thread_id === threadId ? " active" : ""}`}
          onClick={() => loadConversation(conv.thread_id)}
        >
          {conv.title || "New Chat"}
        </div>
      ))}
    </div>
  );
}
