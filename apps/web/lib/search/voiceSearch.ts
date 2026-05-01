/**
 * Browser Web Speech API — recognition only starts after explicit user gesture (button click).
 */

export type VoiceSearchHandlers = {
  onTranscript: (text: string) => void;
  onError?: (message: string, code?: string) => void;
  onListeningChange?: (listening: boolean) => void;
  lang?: string;
};

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
  );
}

type RecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((ev: { results: { 0: { 0: { transcript: string } } } }) => void) | null;
  onerror: ((ev: { error: string; message?: string }) => void) | null;
  onend: (() => void) | null;
};

/**
 * Start one-shot dictation. Call from a click handler only.
 * Returns `stop` to cancel, or `null` if unsupported / failed to start.
 */
export function startVoiceSearch(handlers: VoiceSearchHandlers): { stop: () => void } | null {
  if (typeof window === "undefined") return null;

  const W = window as unknown as {
    SpeechRecognition?: new () => RecognitionInstance;
    webkitSpeechRecognition?: new () => RecognitionInstance;
  };
  const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition;
  if (!Ctor) {
    handlers.onError?.("Voice search is not supported in this browser. Try Chrome or Edge.");
    return null;
  }

  let recognition: RecognitionInstance;
  try {
    recognition = new Ctor();
  } catch {
    handlers.onError?.("Could not start voice search.");
    return null;
  }

  recognition.lang = handlers.lang ?? "en-CA";
  recognition.interimResults = false;
  recognition.continuous = false;

  handlers.onListeningChange?.(true);

  recognition.onresult = (event) => {
    const text = event.results?.[0]?.[0]?.transcript?.trim() ?? "";
    if (text) handlers.onTranscript(text);
  };

  recognition.onerror = (event) => {
    const code = event.error;
    let msg = "Could not capture speech.";
    if (code === "not-allowed" || code === "service-not-allowed") {
      msg = "Microphone permission denied. Allow the microphone in your browser settings.";
    } else if (code === "no-speech") {
      msg = "No speech detected. Try again.";
    } else if (code === "aborted") {
      msg = "";
    }
    if (msg) handlers.onError?.(msg, code);
    handlers.onListeningChange?.(false);
  };

  recognition.onend = () => {
    handlers.onListeningChange?.(false);
  };

  try {
    recognition.start();
  } catch {
    handlers.onError?.("Could not start the microphone.");
    handlers.onListeningChange?.(false);
    return null;
  }

  return {
    stop: () => {
      try {
        recognition.abort();
      } catch {
        try {
          recognition.stop();
        } catch {
          /* ignore */
        }
      }
    },
  };
}
