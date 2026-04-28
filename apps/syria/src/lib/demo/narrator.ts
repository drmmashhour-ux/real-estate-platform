import { routing } from "@/i18n/routing";
import { generateNarrationAudio } from "@/lib/demo/ai-narration";
import {
  narrationRegistry,
  type NarrationLang,
  type NarrationTexts,
} from "@/lib/demo/narration-registry";

export type { NarrationLang };

export type NarrationRuntimeSnapshot = {
  investorDemoActive: boolean;
  autoNarrationEnvEnabled: boolean;
  userNarrationEnabled: boolean;
  ttsEnabled: boolean;
  /** Server flag `AI_NARRATION_ENABLED` — no secrets. */
  aiNarrationEnvEnabled: boolean;
};

let runtimeSnapshot: NarrationRuntimeSnapshot | null = null;

/** When true, scripted auto-demo may narrate without AUTO_NARRATION env / user toggle (investor demo still required). */
let autoDemoScriptPlaybackActive = false;

/** When true, storytelling pitch mode may narrate like scripted demo (investor demo still required). */
let storyModePlaybackActive = false;

/** While true, pathname-driven narration in NarrationProvider is skipped (script drives narration). */
let suppressAutomaticRouteNarration = false;

/** Demo panel “AI Voice” toggle — client-only preference (defaults ON). */
let aiVoiceUserPreference = true;

export function registerAiVoiceUserPreference(enabled: boolean): void {
  aiVoiceUserPreference = enabled;
}

export function registerNarrationRuntime(snapshot: NarrationRuntimeSnapshot | null): void {
  runtimeSnapshot = snapshot;
}

export function setAutoDemoScriptPlayback(active: boolean): void {
  autoDemoScriptPlaybackActive = active;
}

export function setStoryModePlayback(active: boolean): void {
  storyModePlaybackActive = active;
}

export function setSuppressAutomaticRouteNarration(active: boolean): void {
  suppressAutomaticRouteNarration = active;
}

export function isAutomaticRouteNarrationSuppressed(): boolean {
  return suppressAutomaticRouteNarration;
}

/** Current UI locale for narration (URL-derived); fallback handled in {@link narrationLocaleFromPathname}. */
let registeredLocale: NarrationLang = "en";

export function registerNarrationLocale(locale: NarrationLang): void {
  registeredLocale = locale;
}

export function getNarrationLocale(): NarrationLang {
  return registeredLocale;
}

type CaptionSetter = ((text: string | null, locale: NarrationLang) => void) | null;

let captionSetter: CaptionSetter = null;

export function registerNarrationCaptionSetter(fn: CaptionSetter): void {
  captionSetter = fn;
}

/** Fallback `"en"` when pathname has no locale segment (per product spec). */
export function narrationLocaleFromPathname(pathname: string): NarrationLang {
  const seg = (pathname || "/").split("/").filter(Boolean)[0];
  if (seg === "ar") return "ar";
  if (seg === "en") return "en";
  return "en";
}

export function narrationTextForLocale(entry: NarrationTexts, locale: NarrationLang): string {
  const text = entry[locale] ?? entry.en;
  return text.trim();
}

/** Strip locale prefix (`/en`, `/ar`) from pathname for registry routing. */
export function normalizeDemoRoutePath(pathname: string): string {
  const p = pathname || "/";
  for (const loc of routing.locales) {
    const prefix = `/${loc}`;
    if (p === prefix) return "/";
    if (p.startsWith(`${prefix}/`)) {
      const rest = p.slice(prefix.length);
      return rest.length ? rest : "/";
    }
  }
  return p;
}

/** Map a normalized route to a narration registry key (deterministic prefixes only). */
export function narrationRouteKeyFromNormalizedPath(normalizedPath: string): string | null {
  const pathOnly = normalizedPath.split("?")[0] ?? normalizedPath;
  if (pathOnly.startsWith("/listing")) return "/listing";
  if (pathOnly.startsWith("/demo")) return "/demo";
  if (pathOnly.startsWith("/sybnb")) return "/sybnb";
  if (pathOnly.startsWith("/admin/dr-brain")) return "/admin/dr-brain";
  if (pathOnly.startsWith("/admin/sybnb/reports")) return "/admin/sybnb/reports";
  return null;
}

export function showCaption(text: string | null, locale: NarrationLang): void {
  captionSetter?.(text, locale);
}

/** Active AI audio element for cancellation (browser speech uses speechSynthesis.cancel). */
let activeAiAudio: HTMLAudioElement | null = null;

export function cancelActiveNarrationPlayback(): void {
  if (typeof window === "undefined") return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
  if (activeAiAudio) {
    try {
      activeAiAudio.pause();
      activeAiAudio.removeAttribute("src");
      activeAiAudio.load();
    } catch {
      /* ignore */
    }
    activeAiAudio = null;
  }
}

function playAiAudioFromSrc(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    activeAiAudio = audio;
    audio.src = src;
    audio.onended = () => {
      if (activeAiAudio === audio) activeAiAudio = null;
      resolve();
    };
    audio.onerror = () => {
      if (activeAiAudio === audio) activeAiAudio = null;
      reject(new Error("Audio playback failed"));
    };
    void audio.play().catch((e) => {
      if (activeAiAudio === audio) activeAiAudio = null;
      reject(e instanceof Error ? e : new Error(String(e)));
    });
  });
}

async function speakNarrationAsync(text: string, locale: NarrationLang): Promise<void> {
  const snap = runtimeSnapshot;
  if (typeof window === "undefined" || !snap?.investorDemoActive) return;

  const narrationAllowed =
    autoDemoScriptPlaybackActive ||
    storyModePlaybackActive ||
    (snap.autoNarrationEnvEnabled && snap.userNarrationEnabled);
  if (!narrationAllowed) return;

  cancelActiveNarrationPlayback();

  const tryAi =
    snap.aiNarrationEnvEnabled &&
    aiVoiceUserPreference &&
    snap.investorDemoActive;

  if (tryAi) {
    try {
      const src = await generateNarrationAudio(text, locale);
      await playAiAudioFromSrc(src);
      return;
    } catch {
      /* fallback to browser TTS when configured */
    }
  }

  const allowBrowserTts = snap.ttsEnabled || autoDemoScriptPlaybackActive || storyModePlaybackActive;
  if (!allowBrowserTts) return;

  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale === "ar" ? "ar-SA" : "en-US";
    window.speechSynthesis.speak(utterance);
  } catch {
    /* ignore unsupported / denied */
  }
}

export function speakNarration(text: string, locale: NarrationLang): void {
  void speakNarrationAsync(text, locale);
}

/**
 * Speaks + captions using registry entry. Captions are local; speech uses AI TTS when enabled + registry-only digest API, else browser speech synthesis.
 * Investor demo required. Scripted auto-demo enables narration via {@link setAutoDemoScriptPlayback}.
 */
export function triggerNarration(key: string, locale?: NarrationLang): void {
  const snap = runtimeSnapshot;
  const narrationAllowed =
    snap?.investorDemoActive &&
    (autoDemoScriptPlaybackActive ||
      storyModePlaybackActive ||
      (snap.autoNarrationEnvEnabled && snap.userNarrationEnabled));
  if (!narrationAllowed) {
    return;
  }
  const loc = locale ?? registeredLocale;
  const entry = narrationRegistry[key];
  if (!entry) return;
  const text = narrationTextForLocale(entry, loc);
  if (!text) return;
  showCaption(text, loc);
  speakNarration(text, loc);
}
