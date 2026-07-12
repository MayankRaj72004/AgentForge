import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { fetchConversations, fetchHistory, uploadDocument, streamChat } from "../services/api";
import { detectLikelyTool } from "../utils/toolDetector";
import { useLocalStorage } from "../hooks/useLocalStorage";

const ChatContext = createContext(null);

/**
 * Provides global chat state and actions to the entire app.
 * Persists thread_id and selected_model in LocalStorage.
 */
export function ChatProvider({ children }) {
  // Persisted state
  const [threadId, setThreadId] = useLocalStorage("thread_id", crypto.randomUUID());
  const [model, setModel] = useLocalStorage("selected_model", "llama-3.3-70b-versatile");

  // Application state
  const [messages, setMessages] = useState([]);
  const [conversationList, setConversationList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [noticeText, setNoticeText] = useState("MyGPT can make mistakes. Check important info.");

  // Tool progress: { toolName, isComplete }
  const [toolProgress, setToolProgress] = useState(null);

  // Track whether welcome screen should show
  const [showWelcome, setShowWelcome] = useState(true);

  // Ref to track the bot message element for streaming updates
  const botContentRef = useRef(null);

  /**
   * Load conversation list from backend.
   */
  const loadConversations = useCallback(async () => {
    try {
      const conversations = await fetchConversations();
      setConversationList(conversations);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  }, []);

  /**
   * Load a specific conversation's messages.
   */
  const loadConversation = useCallback(async (selectedThreadId) => {
    setThreadId(selectedThreadId);

    try {
      const msgs = await fetchHistory(selectedThreadId);

      if (!msgs || msgs.length === 0) {
        setMessages([]);
        setShowWelcome(true);
      } else {
        setMessages(
          msgs.map((msg) => ({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.content,
          }))
        );
        setShowWelcome(false);
      }

      await loadConversations();
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  }, [setThreadId, loadConversations]);

  /**
   * Start a new chat — reset everything.
   */
  const newChat = useCallback(async () => {
    const newId = crypto.randomUUID();
    setThreadId(newId);
    setMessages([]);
    setShowWelcome(true);
    setToolProgress(null);
    setStatus("Ready");
    setNoticeText("MyGPT can make mistakes. Check important info.");

    await loadConversations();
  }, [setThreadId, loadConversations]);

  /**
   * Send a message and stream the response.
   */
  const sendMessage = useCallback(async (messageText) => {
    if (!messageText.trim() || loading) return;

    setShowWelcome(false);
    setLoading(true);
    setStatus(`Thinking with ${model}...`);

    // Detect likely tool
    const likelyTool = detectLikelyTool(messageText);
    let toolProgressState = null;

    if (likelyTool) {
      toolProgressState = { toolName: likelyTool, isComplete: false };
      setToolProgress(toolProgressState);
      setStatus(`Using ${likelyTool}...`);
    }

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: messageText }]);

    // Add empty assistant message placeholder
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    let firstTokenReceived = false;

    try {
      await streamChat({
        message: messageText,
        threadId,
        model,
        onToken: (token) => {
          if (!firstTokenReceived) {
            firstTokenReceived = true;

            if (likelyTool) {
              setToolProgress({ toolName: likelyTool, isComplete: true });
            }

            setStatus(`Generating with ${model}...`);
          }

          setMessages((prev) => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg && lastMsg.role === "assistant") {
              updated[updated.length - 1] = {
                ...lastMsg,
                content: lastMsg.content + token,
              };
            }
            return updated;
          });
        },
        onError: (error) => {
          if (likelyTool) {
            setToolProgress({ toolName: likelyTool, isComplete: true });
          }

          setMessages((prev) => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg && lastMsg.role === "assistant") {
              updated[updated.length - 1] = {
                ...lastMsg,
                content: lastMsg.content + "\n\nError: " + error,
              };
            }
            return updated;
          });

          setStatus("Ready");
        },
        onDone: () => {
          if (likelyTool && !firstTokenReceived) {
            setToolProgress({ toolName: likelyTool, isComplete: true });
          }

          setStatus("Ready");
        },
      });
    } catch (error) {
      console.error("Streaming error:", error);

      if (likelyTool) {
        setToolProgress({ toolName: likelyTool, isComplete: true });
      }

      setMessages((prev) => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg && lastMsg.role === "assistant") {
          updated[updated.length - 1] = {
            ...lastMsg,
            content: "Something went wrong: " + error.message,
          };
        }
        return updated;
      });
    } finally {
      setLoading(false);
      setStatus("Ready");
      setToolProgress(null);
      await loadConversations();
    }
  }, [loading, model, threadId, loadConversations]);

  /**
   * Upload a file and show progress in chat.
   */
  const handleUpload = useCallback(async (file) => {
    if (!file) return;

    setShowWelcome(false);

    // Add user upload message
    setMessages((prev) => [
      ...prev,
      { role: "user", content: `📎 Uploaded document: ${file.name}` },
    ]);

    setToolProgress({ toolName: "Document Ingestion", isComplete: false });
    setStatus("Using Document Ingestion...");

    try {
      const data = await uploadDocument(file, threadId);

      setToolProgress({ toolName: "Document Ingestion", isComplete: true });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            data.message + "\n\nYou can now ask questions about this document.",
        },
      ]);

      await loadConversations();
    } catch (error) {
      setToolProgress({ toolName: "Document Ingestion", isComplete: true });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Upload failed: " + error.message },
      ]);
    } finally {
      setStatus("Ready");
      // Clear tool progress after a short delay so user sees completion
      setTimeout(() => setToolProgress(null), 1500);
    }
  }, [threadId, loadConversations]);

  /**
   * Change selected model and show notice.
   */
  const changeModel = useCallback((newModel) => {
    setModel(newModel);
    setNoticeText(`Selected model: ${newModel}`);
  }, [setModel]);

  const value = {
    // State
    threadId,
    messages,
    conversationList,
    loading,
    status,
    noticeText,
    toolProgress,
    showWelcome,
    model,

    // Setters for direct use
    setStatus,
    setNoticeText,

    // Actions
    loadConversations,
    loadConversation,
    newChat,
    sendMessage,
    handleUpload,
    changeModel,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

/**
 * Hook to access chat context. Must be used within ChatProvider.
 */
export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
