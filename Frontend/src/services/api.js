/**
 * Centralized API service layer.
 * All backend communication goes through this file.
 * Uses Fetch API only — no Axios.
 */

// In dev mode (Vite proxy), API_BASE is empty string.
// In production (served from FastAPI), also empty string.
const API_BASE = "";

/**
 * Fetch all conversations from the server.
 * @returns {Promise<Array>} List of conversation objects.
 */
export async function fetchConversations() {
  const response = await fetch(`${API_BASE}/conversations`);
  if (!response.ok) {
    throw new Error("Failed to fetch conversations");
  }
  const data = await response.json();
  return data.conversations || [];
}

/**
 * Fetch message history for a specific thread.
 * @param {string} threadId
 * @returns {Promise<Array>} List of message objects.
 */
export async function fetchHistory(threadId) {
  const response = await fetch(`${API_BASE}/history/${threadId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch history");
  }
  const data = await response.json();
  return data.messages || [];
}

/**
 * Upload a file for RAG processing.
 * @param {File} file - The file to upload.
 * @param {string} threadId - The thread to associate with.
 * @returns {Promise<Object>} Upload result with success, filename, message.
 */
export async function uploadDocument(file, threadId) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("thread_id", threadId);

  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || data.message || "Upload failed");
  }

  return data;
}

/**
 * Parse a single SSE data part into a JSON object.
 * @param {string} part - Raw SSE part string.
 * @returns {Object|null} Parsed data or null.
 */
export function parseSSEPart(part) {
  const lines = part
    .split(/\r?\n/)
    .filter((line) => line.trim().startsWith("data:"));

  if (lines.length === 0) {
    return null;
  }

  const jsonText = lines
    .map((line) => line.replace(/^data:\s*/, ""))
    .join("\n")
    .trim();

  if (!jsonText || jsonText === "[DONE]") {
    return null;
  }

  try {
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Invalid stream JSON:", jsonText, error);
    return null;
  }
}

/**
 * Send a chat message and stream the response via SSE.
 * @param {Object} params
 * @param {string} params.message - User message text.
 * @param {string} params.threadId - Conversation thread ID.
 * @param {string} params.model - Selected model name.
 * @param {function} params.onToken - Callback for each streamed token.
 * @param {function} params.onError - Callback for errors.
 * @param {function} params.onDone - Callback when streaming completes.
 */
export async function streamChat({ message, threadId, model, onToken, onError, onDone }) {
  const response = await fetch(`${API_BASE}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      thread_id: threadId,
      model,
    }),
  });

  if (!response.ok) {
    let errorText = "Request failed.";
    try {
      const errorData = await response.json();
      errorText = errorData.detail || errorData.message || errorText;
    } catch (error) {
      console.error("Could not parse error response:", error);
    }
    throw new Error(errorText);
  }

  if (!response.body) {
    throw new Error("Streaming is not supported by this browser.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split(/\r?\n\r?\n/);
    buffer = parts.pop() || "";

    for (const part of parts) {
      const data = parseSSEPart(part);
      if (!data) continue;

      if (data.token !== undefined && data.token !== null) {
        onToken(data.token);
      }

      if (data.error) {
        onError(data.error);
      }

      if (data.done) {
        onDone();
      }
    }
  }

  // Handle leftover buffer (final chunk may not end with \n\n)
  buffer += decoder.decode();

  if (buffer.trim()) {
    const data = parseSSEPart(buffer);
    if (data) {
      if (data.token !== undefined && data.token !== null) {
        onToken(data.token);
      }
      if (data.error) {
        onError(data.error);
      }
      if (data.done) {
        onDone();
      }
    }
  }
}
