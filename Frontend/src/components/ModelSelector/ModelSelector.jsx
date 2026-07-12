import React from "react";
import { useChat } from "../../context/ChatContext";
import "./ModelSelector.css";

/**
 * Model selection dropdown.
 * All 5 models from the original HTML.
 * Persists selection to LocalStorage via context.
 */
export default function ModelSelector() {
  const { model, changeModel } = useChat();

  return (
    <select
      className="model-select"
      value={model}
      onChange={(e) => changeModel(e.target.value)}
      title="Select model"
    >
      <option value="gemini-2.5-flash">gemini-2.5-flash</option>
      <option value="gemini-2.5-pro">gemini-2.5-pro</option>
      <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite</option>
      <option value="gemini-1.5-flash">gemini-1.5-flash</option>
      <option value="gemini-1.5-pro">gemini-1.5-pro</option>
    </select>
  );
}
