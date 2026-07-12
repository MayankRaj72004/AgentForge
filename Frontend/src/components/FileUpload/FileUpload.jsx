import React, { useRef } from "react";
import { useChat } from "../../context/ChatContext";
import "./FileUpload.css";

/**
 * File upload component with hidden input and attach button.
 * Accepts: .pdf, .docx, .txt, .md, .py, .csv
 */
export default function FileUpload() {
  const fileInputRef = useRef(null);
  const { handleUpload } = useChat();

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    handleUpload(file);
    // Reset input so same file can be uploaded again
    e.target.value = "";
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        className="file-upload-input"
        accept=".pdf,.docx,.txt,.md,.py,.csv"
        onChange={onFileChange}
      />
      <button
        className="attach-btn"
        onClick={openFilePicker}
        title="Upload document"
      >
        📎
      </button>
    </>
  );
}
