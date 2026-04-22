"use client";

import { useCallback } from "react";

/** Browser speech synthesis — optional assist for low vision users. */
export function ReadPageAloudButton(props: { label?: string }) {
  const speak = useCallback(() => {
    const root = document.querySelector("[data-senior-residence-main]");
    const text = root?.textContent?.replace(/\s+/g, " ").trim() ?? "";
    if (!text || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  }, []);

  return (
    <button type="button" className="sl-btn-secondary min-h-[48px] px-6" onClick={speak}>
      {props.label ?? "Read this page aloud"}
    </button>
  );
}

/** Voice search — uses browser speech-to-text when available; otherwise focuses the field. */
export function VoiceSearchAssist(props: { inputId: string }) {
  const tryListen = useCallback(() => {
    const input = document.getElementById(props.inputId) as HTMLInputElement | null;
    if (!input) return;
    if (typeof window === "undefined") return;

    const W = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        start: () => void;
        onresult: ((ev: Event) => void) | null;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        start: () => void;
        onresult: ((ev: Event) => void) | null;
      };
    };
    const Rec = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!Rec) {
      input.focus();
      return;
    }
    const rec = new Rec();
    rec.lang = document.documentElement.lang || "en-CA";
    rec.onresult = (ev: Event) => {
      const anyEv = ev as unknown as { results: Array<Array<{ transcript: string }>> };
      const said = anyEv.results?.[0]?.[0]?.transcript ?? "";
      if (said) input.value = said.trim();
      input.focus();
    };
    rec.start();
  }, [props.inputId]);

  return (
    <button type="button" className="sl-btn-secondary mt-4 min-h-[48px] w-full sm:mt-0 sm:w-auto" onClick={tryListen}>
      Voice search
    </button>
  );
}
