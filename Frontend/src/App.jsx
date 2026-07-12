import React, { useState, useEffect, useCallback } from "react";
import { ChatProvider, useChat } from "./context/ChatContext";
import Sidebar from "./components/Sidebar/Sidebar";
import Topbar from "./components/Topbar/Topbar";
import ChatContainer from "./components/Chat/ChatContainer";
import InputBar from "./components/InputBar/InputBar";

/**
 * Inner App component — uses ChatContext.
 * Manages the input text state and wires up prompt cards.
 */
function AppContent() {
  const { loadConversations, loadConversation, threadId } = useChat();
  const [inputText, setInputText] = useState("");

  // Load conversations and current thread on mount
  useEffect(() => {
    loadConversations();
    if (threadId) {
      loadConversation(threadId);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Prompt card click: fill the textarea and focus
  const handleUsePrompt = useCallback((text) => {
    setInputText(text);
  }, []);

  return (
    <>
      <Sidebar />

      <main className="main">
        <Topbar />
        <ChatContainer onUsePrompt={handleUsePrompt} />
        <InputBar inputText={inputText} setInputText={setInputText} />
      </main>
    </>
  );
}

/**
 * Root App component — wraps everything in ChatProvider.
 */
export default function App() {
  return (
    <ChatProvider>
      <AppContent />
    </ChatProvider>
  );
}
