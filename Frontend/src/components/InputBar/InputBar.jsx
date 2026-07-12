import React, { useRef, useCallback } from "react";
import { useChat } from "../../context/ChatContext";
import { useSpeechRecognition } from "../../hooks/useSpeechRecognition";
import { useAutoResize } from "../../hooks/useAutoResize";
import FileUpload from "../FileUpload/FileUpload";
import ModelSelector from "../ModelSelector/ModelSelector";
import VoiceSearch from "../VoiceSearch/VoiceSearch";
import "./InputBar.css";

/**
 * Fixed input bar at the bottom of the screen.
 * Contains: attach button, textarea, model selector, mic button, send button.
 * Matches the original HTML layout exactly.
 */
export default function InputBar({ inputText, setInputText }) {
  const { sendMessage, loading, noticeText, setStatus, setNoticeText } = useChat();
  const textareaRef = useRef(null);
  const autoResize = useAutoResize(textareaRef);

  // Speech recognition callbacks
  const onTranscript = useCallback(
    (transcript) => {
      setInputText((prev) => {
        const currentText = prev.trim();
        return currentText ? currentText + " " + transcript : transcript;
      });
      // Trigger resize after adding text
      setTimeout(autoResize, 0);
    },
    [setInputText, autoResize]
  );

  const onInterim = useCallback(
    (interimTranscript) => {
      setNoticeText("Listening: " + interimTranscript);
    },
    [setNoticeText]
  );

  const onStatusChange = useCallback(
    (statusText) => {
      setStatus(statusText);
      if (statusText === "Ready") {
        setNoticeText("MyGPT can make mistakes. Check important info.");
      }
    },
    [setStatus, setNoticeText]
  );

  const { isDictating, toggleDictation } = useSpeechRecognition({
    onTranscript,
    onInterim,
    onStatusChange,
  });

  const handleSend = () => {
    const message = inputText.trim();
    if (!message) return;

    if (isDictating) {
      toggleDictation();
    }

    sendMessage(message);
    setInputText("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e) => {
    setInputText(e.target.value);
    autoResize();
  };

  return (
    <div className="input-area">
      <div className="input-wrapper">
        <FileUpload />

        <textarea
          ref={textareaRef}
          placeholder="Ask anything..."
          rows="1"
          value={inputText}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
        />

        <ModelSelector />

        <VoiceSearch isDictating={isDictating} onToggle={toggleDictation} />

        <button
          className="send-btn"
          onClick={handleSend}
          disabled={loading || !inputText.trim()}
        >
          ➜
        </button>
      </div>

      <div className="notice">{noticeText}</div>
    </div>
  );
}
