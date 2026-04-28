import { createHash } from "node:crypto";
import { narrationRegistry } from "@/lib/demo/narration-registry";
import type { NarrationLang } from "@/lib/demo/narration-registry";

/** Matches browser {@link digestNarrationLine} in `ai-narration.ts` (UTF-8, SHA-256 hex). */
export function digestNarrationLineSync(text: string, locale: NarrationLang): string {
  return createHash("sha256").update(`${text}\u0000${locale}`, "utf8").digest("hex");
}

/** Resolve registry-only narration line from cryptographic digest (server-side validation). */
export function resolveRegisteredLineFromDigest(digestHex: string): {
  text: string;
  locale: NarrationLang;
} | null {
  const normalized = digestHex.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) return null;
  for (const entry of Object.values(narrationRegistry)) {
    for (const loc of ["en", "ar"] as const) {
      const t = entry[loc];
      if (digestNarrationLineSync(t, loc) === normalized) {
        return { text: t, locale: loc };
      }
    }
  }
  return null;
}
