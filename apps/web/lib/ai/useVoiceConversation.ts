"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isSpeechRecognitionSupported, startVoiceSearch } from "@/lib/search/voiceSearch";
import { speakPremium, cancelPremiumSpeech, warmBrowserVoices } from "@/lib/ai/premiumVoice";

export type VoiceConversationPhase =
  | "idle"
  | "listening"
  | "processing"
  | "speaking"
  | "paused";

export type VoiceLang = "en-CA" | "fr-CA" | "ar";

const LANG_ORDER: VoiceLang[] = ["fr-CA", "en-CA", "ar"];

type Opts = {
  onTranscript: (text: string) => string | undefined;
  enabled: boolean;
};

/**
 * Hands-free voice conversation loop with premium TTS.
 *
 * Phase cycle: idle → listening → processing → speaking → listening → …
 * The caller supplies `onTranscript` which receives the spoken text and
 * returns the assistant reply (or undefined to skip TTS).
 *
 * Uses ElevenLabs when configured, browser speechSynthesis as fallback.
 */
export function useVoiceConversation({ onTranscript, enabled }: Opts) {
  const [phase, setPhase] = useState<VoiceConversationPhase>("idle");
  const [lang, setLang] = useState<VoiceLang>("en-CA");
  const [active, setActive] = useState(false);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const cancelSpeechRef = useRef<(() => void) | null>(null);
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

  useEffect(() => {
    warmBrowserVoices();
  }, []);

  const stopSpeaking = useCallback(() => {
    cancelPremiumSpeech();
    cancelSpeechRef.current?.();
    cancelSpeechRef.current = null;
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

        if (reply) {
          setPhase("speaking");

          void speakPremium({
            text: reply,
            lang: langRef.current,
            onEnd: () => {
              cancelSpeechRef.current = null;
              if (activeRef.current) {
                scheduleRestart();
              } else {
                setPhase("idle");
              }
            },
            onError: () => {
              cancelSpeechRef.current = null;
              if (activeRef.current) {
                scheduleRestart();
              } else {
                setPhase("idle");
              }
            },
          }).then((handle) => {
            cancelSpeechRef.current = handle.cancel;
          });
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
    setLang((prev) => {
      const idx = LANG_ORDER.indexOf(prev);
      return LANG_ORDER[(idx + 1) % LANG_ORDER.length];
    });
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
