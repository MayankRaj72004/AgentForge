import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const API_BASE = "http://localhost:8000";

// SVG Icons
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5v14"/>
  </svg>
);

const PaperclipIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
  </svg>
);

const SparklesIcon = () => (
  <svg className="control-icon gemini" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
  </svg>
);

const BulbIcon = () => (
  <svg className="control-icon bulb" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .3 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
    <path d="M9 18h6"/>
    <path d="M10 22h4"/>
  </svg>
);

const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
    <path d="M19 10v1a7 7 0 0 1-14 0v-1"/>
    <line x1="12" x2="12" y1="19" y2="22"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

// Custom Simple Markdown Formatter
function parseMarkdown(text) {
  if (!text) return [];
  
  const parts = [];
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    const textBefore = text.substring(lastIndex, match.index);
    if (textBefore) {
      parts.push({ type: 'text', content: textBefore });
    }
    parts.push({ type: 'code', lang: match[1], content: match[2] });
    lastIndex = codeBlockRegex.lastIndex;
  }
  
  const textAfter = text.substring(lastIndex);
  if (textAfter) {
    parts.push({ type: 'text', content: textAfter });
  }
  
  return parts;
}

function MessageContent({ content }) {
  const parts = parseMarkdown(content);
  
  const formatText = (text) => {
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      const listMatch = line.match(/^(\s*)[-*]\s+(.*)$/);
      if (listMatch) {
        return (
          <li key={lineIdx} style={{ marginLeft: '20px', marginBottom: '4px' }}>
            {renderInline(listMatch[2])}
          </li>
        );
      }
      return (
        <p key={lineIdx} style={{ marginBottom: '12px' }}>
          {renderInline(line)}
        </p>
      );
    });
  };

  const renderInline = (text) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx}>{part.slice(2, -2)}</strong>;
      } else if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={idx}>{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  return (
    <div className="message-text">
      {parts.map((part, index) => {
        if (part.type === 'code') {
          return (
            <div key={index} style={{ margin: '12px 0' }}>
              <div className="code-header">
                <span>{part.lang || 'code'}</span>
                <button 
                  className="copy-btn" 
                  onClick={() => navigator.clipboard.writeText(part.content)}
                >
                  Copy
                </button>
              </div>
              <pre>
                <code>{part.content}</code>
              </pre>
            </div>
          );
        } else {
          return <div key={index}>{formatText(part.content)}</div>;
        }
      })}
    </div>
  );
}

function App() {
  const [conversations, setConversations] = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-pro");
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeFile, setActiveFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [streamError, setStreamError] = useState(null);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Fetch recent conversations on load
  const fetchConversations = async () => {
    try {
      const response = await fetch(`${API_BASE}/conversations`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Fetch messages when thread changes
  useEffect(() => {
    if (currentThreadId) {
      const fetchMessages = async () => {
        try {
          const response = await fetch(`${API_BASE}/conversations/${currentThreadId}/messages`);
          if (response.ok) {
            const data = await response.json();
            setMessages(data.messages || []);
          }
        } catch (err) {
          console.error("Error fetching messages:", err);
        }
      };
      fetchMessages();
    } else {
      setMessages([]);
    }
    setActiveFile(null);
  }, [currentThreadId]);

  // Auto-scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Auto-resize input textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputText]);

  // Handle creating a new chat
  const handleNewChat = () => {
    setCurrentThreadId(null);
    setInputText("");
    setActiveFile(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Click on a sidebar conversation
  const handleSelectConversation = (threadId) => {
    setCurrentThreadId(threadId);
  };

  // Suggested Prompt Cards click
  const handlePromptCardClick = (promptText) => {
    setInputText(promptText);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Handle file uploads
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Use current thread id or create one temporarily
    const targetThreadId = currentThreadId || crypto.randomUUID();
    
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("thread_id", targetThreadId);

    try {
      const response = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setActiveFile(file);
        
        // If it was a new chat, establish the thread ID
        if (!currentThreadId) {
          setCurrentThreadId(targetThreadId);
        } else {
          // Refresh messages to show the system notice
          const msgResponse = await fetch(`${API_BASE}/conversations/${targetThreadId}/messages`);
          if (msgResponse.ok) {
            const data = await msgResponse.json();
            setMessages(data.messages || []);
          }
        }
      } else {
        const errData = await response.json();
        alert(`Upload failed: ${errData.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error uploading file:", err);
      alert("Error connection failed during file upload.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Submit chat message
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isStreaming) return;

    const userMsgText = inputText.trim();
    setInputText("");
    setStreamError(null);

    // Get thread ID or generate a new one
    const targetThreadId = currentThreadId || crypto.randomUUID();
    const isNewConversation = !currentThreadId;

    // 1. Add user message locally
    const newMessages = [
      ...messages,
      { id: Date.now(), role: "user", content: userMsgText }
    ];
    setMessages(newMessages);

    // 2. Set active thread immediately
    if (isNewConversation) {
      setCurrentThreadId(targetThreadId);
    }

    // 3. Initiate SSE Streaming
    setIsStreaming(true);
    
    // Add placeholder assistant message
    const placeholderId = Date.now() + 1;
    setMessages(prev => [
      ...prev,
      { id: placeholderId, role: "assistant", content: "" }
    ]);

    try {
      const response = await fetch(`${API_BASE}/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMsgText,
          thread_id: targetThreadId,
          model: selectedModel
        })
      });

      if (!response.ok) {
        throw new Error("HTTP response was not ok");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed.startsWith("data: ")) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              if (data.token) {
                fullContent += data.token;
                setMessages(prev => prev.map(msg => 
                  msg.id === placeholderId ? { ...msg, content: fullContent } : msg
                ));
              } else if (data.error) {
                setStreamError(data.error);
                setMessages(prev => prev.map(msg => 
                  msg.id === placeholderId ? { ...msg, content: `Error: ${data.error}` } : msg
                ));
              } else if (data.done) {
                // Done streaming
              }
            } catch (err) {
              console.error("SSE parse error", err, trimmed);
            }
          }
        }
      }

      // Re-fetch chat list to pick up the updated title (if new chat)
      await fetchConversations();

    } catch (err) {
      console.error("Streaming connection error:", err);
      setStreamError("Failed to connect to assistant stream.");
      setMessages(prev => prev.map(msg => 
        msg.id === placeholderId ? { ...msg, content: "Error: Connection to backend failed." } : msg
      ));
    } finally {
      setIsStreaming(false);
      setActiveFile(null);
    }
  };

  // Keyboard shortcut (Enter to submit, Shift+Enter to newline)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="app-container">
      {/* Left Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="brand-title">BappyGPT</h1>
          <button className="new-chat-btn" onClick={handleNewChat}>
            <PlusIcon />
            <span>New chat</span>
          </button>
        </div>

        <div className="sidebar-label">Recent Chats</div>
        
        <div className="conversations-list">
          {conversations.map((item) => (
            <div
              key={item.thread_id}
              className={`conversation-item ${currentThreadId === item.thread_id ? 'active' : ''}`}
              onClick={() => handleSelectConversation(item.thread_id)}
              title={item.title}
            >
              <span className="conversation-title">{item.title || "New Chat"}</span>
            </div>
          ))}
          {conversations.length === 0 && (
            <div style={{ padding: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              No chats yet.
            </div>
          )}
        </div>
      </aside>

      {/* Right Main Panel */}
      <main className="main-chat">
        <header className="chat-header">
          <div className="header-title">Agentic AI Chatbot</div>
        </header>

        {/* Message Panel / Dashboard */}
        {messages.length === 0 ? (
          <div className="welcome-container">
            <h2 className="welcome-title">How can I help you today?</h2>
            <p className="welcome-subtitle">
              Ask questions, upload documents, use tools, search the web, and chat with memory.
            </p>
            
            <div className="prompt-grid">
              <div 
                className="prompt-card" 
                onClick={() => handlePromptCardClick("Search latest web info about the upcoming soccer season")}
              >
                <span>Search latest web info</span>
              </div>
              <div 
                className="prompt-card" 
                onClick={() => handlePromptCardClick("Summarize uploaded document and extract key insights")}
              >
                <span>Summarize uploaded document</span>
              </div>
              <div 
                className="prompt-card" 
                onClick={() => handlePromptCardClick("Remember that I prefer short summaries and bullet points")}
              >
                <span>Save something to memory</span>
              </div>
              <div 
                className="prompt-card" 
                onClick={() => handlePromptCardClick("Use calculator tool to evaluate 125 * 48 / 6")}
              >
                <span>Use calculator tool</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="messages-container">
            {messages.map((msg) => (
              <div key={msg.id} className="message-wrapper">
                <div className={`message-avatar ${
                  msg.role === 'user' ? 'avatar-user' : 
                  msg.role === 'system' ? 'avatar-system' : 'avatar-ai'
                }`}>
                  {msg.role === 'user' ? 'U' : msg.role === 'system' ? 'S' : 'B'}
                </div>
                <div className="message-content">
                  {msg.role === 'system' ? (
                    <em style={{ color: 'var(--accent-color)' }}>{msg.content}</em>
                  ) : (
                    <MessageContent content={msg.content} />
                  )}
                </div>
              </div>
            ))}
            {isStreaming && messages[messages.length - 1]?.content === "" && (
              <div className="message-wrapper">
                <div className="message-avatar avatar-ai">B</div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Bottom Input Area */}
        <section className="input-area">
          <form className="input-container" onSubmit={handleSubmit}>
            
            {/* Uploaded File Chip Indicator */}
            {activeFile && (
              <div className="active-file-chip">
                <span>📎 {activeFile.name}</span>
                <button 
                  type="button" 
                  className="remove-file-btn" 
                  onClick={() => setActiveFile(null)}
                  title="Clear selection"
                >
                  &times;
                </button>
              </div>
            )}

            {uploading && (
              <div className="active-file-chip" style={{ opacity: 0.7 }}>
                <span>⏳ Uploading & indexing...</span>
              </div>
            )}

            <div className="input-capsule">
              {/* Paperclip file uploader button */}
              <button 
                type="button" 
                className="attach-btn" 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || isStreaming}
                title="Upload document for RAG search"
              >
                <PaperclipIcon />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                style={{ display: 'none' }} 
                accept=".pdf,.docx,.txt,.md,.py,.csv"
              />

              {/* Text Area */}
              <textarea
                ref={textareaRef}
                rows={1}
                className="chat-textarea"
                placeholder="Ask anything..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isStreaming}
              />

              {/* Action Buttons & Dropdowns */}
              <div className="right-controls">
                <div className="icon-badge-group">
                  <SparklesIcon />
                  <BulbIcon />
                </div>

                <select
                  className="model-select"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={isStreaming}
                >
                  <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                  <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                  <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite</option>
                  <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                  <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                  <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                </select>

                <button 
                  type="button" 
                  className="mic-btn" 
                  title="Voice input"
                  disabled={isStreaming}
                >
                  <MicIcon />
                </button>

                <button 
                  type="submit" 
                  className="send-btn" 
                  disabled={!inputText.trim() || isStreaming || uploading}
                  title="Send message"
                >
                  <ArrowRightIcon />
                </button>
              </div>
            </div>
            <div className="disclaimer-text">
              BappyGPT can make mistakes. Check important info.
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

export default App;
