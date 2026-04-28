import { routing } from "@/i18n/routing";
import { narrationRegistry, type NarrationEntry } from "@/lib/demo/narration-registry";

export type NarrationRuntimeSnapshot = {
  investorDemoActive: boolean;
  autoNarrationEnvEnabled: boolean;
  userNarrationEnabled: boolean;
  ttsEnabled: boolean;
};

let runtimeSnapshot: NarrationRuntimeSnapshot | null = null;

export function registerNarrationRuntime(snapshot: NarrationRuntimeSnapshot | null): void {
  runtimeSnapshot = snapshot;
}

let captionSetter: ((text: string | null) => void) | null = null;

export function registerNarrationCaptionSetter(fn: ((text: string | null) => void) | null): void {
  captionSetter = fn;
}

export function formatNarrationLine(entry: NarrationEntry): string {
  return entry.title ? `${entry.title} — ${entry.text}` : entry.text;
}

/** Strip locale prefix (`/en`, `/ar`) from pathname for registry routing. */
export function normalizeDemoRoutePath(pathname: string): string {
  let p = pathname || "/";
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

export function showCaption(text: string): void {
  captionSetter?.(text);
}

export function speakNarration(text: string): void {
  const snap = runtimeSnapshot;
  if (!snap?.ttsEnabled || typeof window === "undefined") return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  } catch {
    /* ignore unsupported / denied */
  }
}

/**
 * Speaks + captions using registry entry. No API calls.
 * Only runs when investor demo + AUTO_NARRATION + user toggle allow it (via snapshot).
 */
export function triggerNarration(key: string): void {
  const snap = runtimeSnapshot;
  if (!snap?.investorDemoActive || !snap.autoNarrationEnvEnabled || !snap.userNarrationEnabled) {
    return;
  }
  const entry = narrationRegistry[key];
  if (!entry) return;
  const line = formatNarrationLine(entry);
  showCaption(line);
  speakNarration(line);
}
