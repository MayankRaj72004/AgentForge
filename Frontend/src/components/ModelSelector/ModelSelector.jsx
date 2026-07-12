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
      <option value="llama-3.3-70b-versatile">llama-3.3</option>
      <option value="llama-3.1-8b-instant">llama-3.1</option>
      <option value="openai/gpt-oss-120b">openai/gpt-oss-120b</option>
      <option value="openai/gpt-oss-20b">openai/gpt-oss-20b</option>
      <option value="deepseek-r1-distill-llama-70b">deepseek-r1</option>
    </select>
  );
}
