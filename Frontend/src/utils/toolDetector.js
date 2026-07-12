/**
 * Detects which tool is likely needed based on the user's message.
 * Uses the exact regex patterns from the original HTML implementation.
 *
 * @param {string} message - The user's message text.
 * @returns {string|null} Tool name or null if no tool detected.
 */
export function detectLikelyTool(message) {
  const text = message.toLowerCase();

  const mathPattern =
    /(\d+\s*[+\-*/]\s*\d+)|calculate|calculation|math|solve/;
  const ragPattern =
    /document|pdf|file|uploaded|summarize|summary|according to|based on/;
  const memorySavePattern =
    /remember that|save this|store this|keep in memory|memorize/;
  const memoryRecallPattern =
    /what do you remember|recall|my memory|remember about me/;
  const webSearchPattern =
    /latest|current|today|now|recent|news|search web|web search|internet|online|price|version|update|2025|2026|who is|what is happening|trending|release|new model|current ceo|latest version/;

  if (memorySavePattern.test(text)) {
    return "Memory Save";
  }

  if (memoryRecallPattern.test(text)) {
    return "Memory Recall";
  }

  if (ragPattern.test(text)) {
    return "Document Search";
  }

  if (webSearchPattern.test(text)) {
    return "Web Search";
  }

  if (mathPattern.test(text)) {
    return "Calculator";
  }

  return null;
}
