/**
 * Premium voice engine for the platform assistant.
 *
 * Uses ElevenLabs via /api/assistant/tts when available,
 * falls back to browser speechSynthesis with curated female voice.
 */

export type VoiceEngine = "elevenlabs" | "browser";

type SpeakOpts = {
  text: string;
  lang?: string;
  onEnd?: () => void;
  onError?: () => void;
};

let cachedEngine: VoiceEngine | null = null;
let audioEl: HTMLAudioElement | null = null;

function getAudioElement(): HTMLAudioElement {
  if (!audioEl) {
    audioEl = new Audio();
  }
  return audioEl;
}

/**
 * Preferred female voice names for browser fallback — warm, clear, confident.
 * Tried in order; first match wins.
 */
const PREFERRED_FEMALE_VOICES_EN = [
  "Microsoft Zira",
  "Zira",
  "Google UK English Female",
  "Google US English",
  "Samantha",
  "Karen",
  "Moira",
  "Victoria",
  "Tessa",
  "Fiona",
  "Microsoft Jenny",
  "Jenny",
];

const PREFERRED_FEMALE_VOICES_FR = [
  "Microsoft Caroline",
  "Caroline",
  "Google français",
  "Amélie",
  "Thomas",
  "Microsoft Julie",
  "Julie",
];

function selectBrowserVoice(lang: string): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const isFrench = lang.startsWith("fr");
  const preferred = isFrench ? PREFERRED_FEMALE_VOICES_FR : PREFERRED_FEMALE_VOICES_EN;
  const langPrefix = isFrench ? "fr" : "en";

  for (const name of preferred) {
    const match = voices.find(
      (v) => v.name.includes(name) && v.lang.startsWith(langPrefix)
    );
    if (match) return match;
  }

  const langVoices = voices.filter((v) => v.lang.startsWith(langPrefix));
  const femaleHint = langVoices.find(
    (v) =>
      /female|woman|féminin/i.test(v.name) ||
      /zira|jenny|samantha|karen|victoria|caroline|amélie|julie/i.test(v.name)
  );
  if (femaleHint) return femaleHint;

  return langVoices[0] ?? null;
}

function speakWithBrowser({ text, lang, onEnd, onError }: SpeakOpts): { cancel: () => void } {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onError?.();
    return { cancel: () => {} };
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang ?? "en-CA";
  utterance.rate = 0.92;
  utterance.pitch = 1.08;
  utterance.volume = 1.0;

  const voice = selectBrowserVoice(lang ?? "en-CA");
  if (voice) {
    utterance.voice = voice;
  }

  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onError?.();

  window.speechSynthesis.speak(utterance);

  return {
    cancel: () => {
      window.speechSynthesis.cancel();
    },
  };
}

async function speakWithElevenLabs({ text, lang, onEnd, onError }: SpeakOpts): Promise<{ cancel: () => void }> {
  const audio = getAudioElement();
  audio.pause();

  try {
    const res = await fetch("/api/assistant/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang: lang?.startsWith("fr") ? "fr" : "en" }),
    });

    if (res.status === 204 || !res.ok) {
      cachedEngine = "browser";
      return speakWithBrowser({ text, lang, onEnd, onError });
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    audio.src = url;
    audio.onended = () => {
      URL.revokeObjectURL(url);
      onEnd?.();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      cachedEngine = "browser";
      speakWithBrowser({ text, lang, onEnd, onError });
    };

    await audio.play();

    return {
      cancel: () => {
        audio.pause();
        audio.currentTime = 0;
        URL.revokeObjectURL(url);
      },
    };
  } catch {
    cachedEngine = "browser";
    return speakWithBrowser({ text, lang, onEnd, onError });
  }
}

/**
 * Speak text with the best available voice engine.
 * ElevenLabs is tried first; on 204/failure, permanently falls back to browser.
 */
export async function speakPremium(opts: SpeakOpts): Promise<{ cancel: () => void }> {
  if (cachedEngine === "browser") {
    return speakWithBrowser(opts);
  }

  return speakWithElevenLabs(opts);
}

export function cancelPremiumSpeech(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  const audio = audioEl;
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
}

export function getActiveEngine(): VoiceEngine {
  return cachedEngine ?? "elevenlabs";
}

/**
 * Pre-warm browser voice list (Chrome loads voices async).
 * Call once on mount.
 */
export function warmBrowserVoices(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}
