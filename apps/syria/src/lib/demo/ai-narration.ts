import { narrationRegistry } from "@/lib/demo/narration-registry";
import type { NarrationLang } from "@/lib/demo/narration-registry";

const CACHE_PREFIX = "syria_ai_narr_v1_";

/** In-memory cache for session — complements localStorage. */
const memoryCache = new Map<string, string>();

/** Matches server {@link digestNarrationLineSync} (UTF-8, SHA-256 hex). */
export async function digestNarrationLine(text: string, locale: NarrationLang): Promise<string> {
  const payload = `${text}\u0000${locale}`;
  const buf = new TextEncoder().encode(payload);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function isRegisteredNarrationLine(text: string, locale: NarrationLang): boolean {
  const t = text.trim();
  for (const entry of Object.values(narrationRegistry)) {
    const line = (entry[locale] ?? entry.en).trim();
    if (line === t) return true;
  }
  return false;
}

/**
 * Fetches AI-generated audio for **registry narration lines only** (digest-whitelisted server-side).
 * Returns a playable `data:` URL (cached by sha256(text + locale)).
 */
export async function generateNarrationAudio(
  text: string,
  locale: NarrationLang = "en",
): Promise<string> {
  if (!isRegisteredNarrationLine(text, locale)) {
    throw new Error("Narration text is not in the static registry");
  }
  const trimmed = text.trim();
  const digest = await digestNarrationLine(trimmed, locale);
  const cacheKey = `${digest}:${locale}`;

  const memHit = memoryCache.get(cacheKey);
  if (memHit) return memHit;

  try {
    const ls = localStorage.getItem(CACHE_PREFIX + digest);
    if (ls?.startsWith("data:")) {
      memoryCache.set(cacheKey, ls);
      return ls;
    }
  } catch {
    /* private mode / quota */
  }

  const res = await fetch("/api/demo/ai-narration", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ digest }),
  });

  const data = (await res.json()) as {
    ok?: boolean;
    mimeType?: string;
    base64?: string;
    message?: string;
  };

  if (!res.ok || !data.ok || !data.base64 || !data.mimeType) {
    throw new Error(data.message ?? `HTTP ${res.status}`);
  }

  const src = `data:${data.mimeType};base64,${data.base64}`;
  memoryCache.set(cacheKey, src);
  try {
    localStorage.setItem(CACHE_PREFIX + digest, src);
  } catch {
    /* quota */
  }

  return src;
}
