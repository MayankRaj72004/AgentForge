import { useCallback } from "react";

/**
 * Custom hook for textarea auto-resize behavior.
 * Matches the original HTML: textarea.style.height = "auto" then scrollHeight.
 *
 * @param {React.RefObject} textareaRef - Ref to the textarea element.
 * @returns {function} autoResize - Call this on input/change.
 */
export function useAutoResize(textareaRef) {
  const autoResize = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  }, [textareaRef]);

  return autoResize;
}
