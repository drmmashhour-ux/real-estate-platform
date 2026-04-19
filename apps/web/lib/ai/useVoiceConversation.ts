"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isSpeechRecognitionSupported, startVoiceSearch } from "@/lib/search/voiceSearch";

export type VoiceConversationPhase =
  | "idle"
  | "listening"
  | "processing"
  | "speaking"
  | "paused";

export type VoiceLang = "en-CA" | "fr-CA";

type Opts = {
  onTranscript: (text: string) => string | undefined;
  enabled: boolean;
};

/**
 * Hands-free voice conversation loop.
 *
 * Phase cycle: idle → listening → processing → speaking → listening → …
 * The caller supplies `onTranscript` which receives the spoken text and
 * returns the assistant reply (or undefined to skip TTS).
 */
export function useVoiceConversation({ onTranscript, enabled }: Opts) {
  const [phase, setPhase] = useState<VoiceConversationPhase>("idle");
  const [lang, setLang] = useState<VoiceLang>("en-CA");
  const [active, setActive] = useState(false);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const activeRef = useRef(false);
  const onTranscriptRef = useRef(onTranscript);
  const langRef = useRef(lang);
  const listenFnRef = useRef<() => void>(() => {});

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
  }, []);

  const stopRecognition = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, []);

  const scheduleRestart = useCallback(() => {
    listenFnRef.current();
  }, []);

  const startListening = useCallback(() => {
    if (!activeRef.current) return;
    if (!isSpeechRecognitionSupported()) {
      setPhase("idle");
      activeRef.current = false;
      setActive(false);
      return;
    }

    setPhase("listening");
    stopRecognition();

    const ctrl = startVoiceSearch({
      lang: langRef.current,
      onTranscript: (text) => {
        if (!activeRef.current) return;
        setPhase("processing");

        const reply = onTranscriptRef.current(text);

        if (
          reply &&
          typeof window !== "undefined" &&
          "speechSynthesis" in window
        ) {
          setPhase("speaking");
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(reply);
          u.lang = langRef.current;
          u.rate = 0.95;
          utteranceRef.current = u;
          u.onend = () => {
            utteranceRef.current = null;
            if (activeRef.current) {
              scheduleRestart();
            } else {
              setPhase("idle");
            }
          };
          u.onerror = () => {
            utteranceRef.current = null;
            if (activeRef.current) {
              scheduleRestart();
            } else {
              setPhase("idle");
            }
          };
          window.setTimeout(() => window.speechSynthesis.speak(u), 80);
        } else {
          if (activeRef.current) {
            scheduleRestart();
          } else {
            setPhase("idle");
          }
        }
      },
      onError: () => {
        if (activeRef.current) {
          window.setTimeout(() => scheduleRestart(), 600);
        } else {
          setPhase("idle");
        }
      },
      onListeningChange: () => {},
    });

    recognitionRef.current = ctrl;
    if (!ctrl) {
      setPhase("idle");
      activeRef.current = false;
      setActive(false);
    }
  }, [stopRecognition, scheduleRestart]);

  useEffect(() => {
    listenFnRef.current = startListening;
  }, [startListening]);

  const start = useCallback(() => {
    if (!enabled) return;
    activeRef.current = true;
    setActive(true);
    listenFnRef.current();
  }, [enabled]);

  const stop = useCallback(() => {
    activeRef.current = false;
    setActive(false);
    stopRecognition();
    stopSpeaking();
    setPhase("idle");
  }, [stopRecognition, stopSpeaking]);

  const toggle = useCallback(() => {
    if (activeRef.current) {
      stop();
    } else {
      start();
    }
  }, [start, stop]);

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === "en-CA" ? "fr-CA" : "en-CA"));
  }, []);

  useEffect(() => {
    return () => {
      activeRef.current = false;
      stopRecognition();
      stopSpeaking();
    };
  }, [stopRecognition, stopSpeaking]);

  return {
    phase,
    lang,
    active: active || phase !== "idle",
    start,
    stop,
    toggle,
    toggleLang,
    setLang,
  } as const;
}
