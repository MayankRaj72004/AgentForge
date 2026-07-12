import { useState, useRef, useCallback } from "react";

/**
 * Custom hook for Web Speech API with continuous recognition.
 * Matches the exact behavior from the original HTML implementation:
 * - Continuous mode with interim results
 * - Auto-restart on end while dictating
 * - Recording state management
 *
 * @param {Object} options
 * @param {function} options.onTranscript - Called with final transcript text.
 * @param {function} options.onInterim - Called with interim transcript text.
 * @param {function} options.onStatusChange - Called with status text updates.
 * @returns {Object} { isDictating, toggleDictation }
 */
export function useSpeechRecognition({ onTranscript, onInterim, onStatusChange }) {
  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = useRef(null);
  const isDictatingRef = useRef(false);

  const stopDictation = useCallback(() => {
    isDictatingRef.current = false;
    setIsDictating(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error("Could not stop dictation:", error);
      }
    }

    onStatusChange("Ready");
  }, [onStatusChange]);

  const setupRecognition = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return null;
    }

    const speechRecognition = new SpeechRecognition();
    speechRecognition.lang = "en-US";
    speechRecognition.continuous = true;
    speechRecognition.interimResults = true;

    speechRecognition.onstart = () => {
      isDictatingRef.current = true;
      setIsDictating(true);
      onStatusChange("Listening...");
    };

    speechRecognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        onTranscript(finalTranscript.trim());
      }

      if (interimTranscript) {
        onInterim(interimTranscript);
      }
    };

    speechRecognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);

      if (event.error === "not-allowed") {
        alert("Microphone permission denied. Please allow microphone access.");
      }

      stopDictation();
    };

    speechRecognition.onend = () => {
      if (isDictatingRef.current) {
        try {
          speechRecognition.start();
        } catch (error) {
          stopDictation();
        }
      }
    };

    return speechRecognition;
  }, [onTranscript, onInterim, onStatusChange, stopDictation]);

  const toggleDictation = useCallback(() => {
    if (!recognitionRef.current) {
      recognitionRef.current = setupRecognition();
    }

    if (!recognitionRef.current) {
      alert(
        "Speech recognition is not supported in this browser. Please use Chrome or Edge."
      );
      return;
    }

    if (isDictatingRef.current) {
      stopDictation();
    } else {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error("Could not start dictation:", error);
      }
    }
  }, [setupRecognition, stopDictation]);

  return { isDictating, toggleDictation };
}
