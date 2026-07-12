import React from "react";
import "./PromptCards.css";

/**
 * Prompt suggestion cards.
 * Exact text from the original HTML implementation.
 */

const PROMPTS = [
  {
    label: "Search latest web info",
    text: "Search the web for latest AI agent news.",
  },
  {
    label: "Summarize uploaded document",
    text: "Summarize the document I uploaded.",
  },
  {
    label: "Save something to memory",
    text: "Remember that my channel name is dswithbappy.",
  },
  {
    label: "Use calculator tool",
    text: "Calculate 125 * 48 / 6",
  },
];

export default function PromptCards({ onUsePrompt }) {
  return (
    <div className="cards">
      {PROMPTS.map((prompt, index) => (
        <div
          key={index}
          className="card"
          onClick={() => onUsePrompt(prompt.text)}
        >
          {prompt.label}
        </div>
      ))}
    </div>
  );
}
