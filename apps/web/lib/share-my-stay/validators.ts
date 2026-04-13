import { ShareSessionType } from "@prisma/client";
import { parseDurationPreset, type ShareDurationPreset } from "@/lib/share-sessions/duration";

export function parseShareTypeInput(raw: unknown): ShareSessionType | null {
  if (typeof raw !== "string") return null;
  const u = raw.trim().toLowerCase();
  if (u === "live_location" || u === "live") return ShareSessionType.LIVE_LOCATION;
  if (u === "stay_status_only" || u === "status_only") return ShareSessionType.STAY_STATUS_ONLY;
  return null;
}

export function parseDurationInput(raw: unknown): ShareDurationPreset | null {
  return parseDurationPreset(raw);
}

export function isValidRecipientEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export type ExtendBodyParsed =
  | { kind: "add_minutes"; minutes: number }
  | { kind: "until_checkout" };

/** Parses POST body for extend: preset 1h | 8h | until_checkout, or addMinutes 5–1440. */
export function parseExtendBody(body: { addMinutes?: unknown; preset?: unknown }): ExtendBodyParsed | null {
  const presetRaw = typeof body.preset === "string" ? body.preset.trim().toLowerCase() : "";
  if (presetRaw === "1h") return { kind: "add_minutes", minutes: 60 };
  if (presetRaw === "8h") return { kind: "add_minutes", minutes: 8 * 60 };
  if (presetRaw === "until_checkout") return { kind: "until_checkout" };
  const n = typeof body.addMinutes === "number" ? body.addMinutes : Number(body.addMinutes);
  if (!Number.isFinite(n) || n < 5 || n > 24 * 60) return null;
  return { kind: "add_minutes", minutes: n };
}
