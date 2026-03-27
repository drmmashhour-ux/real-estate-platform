const EMAIL_MAX = 254;
const PHONE_MAX = 40;
const NAME_MAX = 200;
const NOTES_MAX = 20000;
const SOURCE_MAX = 200;
const CITY_MAX = 120;
const TAG_MAX = 64;

/** Reasonable email shape; empty string treated as undefined. */
export function parseOptionalEmail(raw: unknown): { ok: true; value: string | undefined } | { ok: false; error: string } {
  if (raw === undefined || raw === null || raw === "") return { ok: true, value: undefined };
  const s = String(raw).trim();
  if (s.length > EMAIL_MAX) return { ok: false, error: `email must be at most ${EMAIL_MAX} characters` };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return { ok: false, error: "email format is invalid" };
  return { ok: true, value: s };
}

/** Digits, spaces, common punctuation; empty → undefined. */
export function parseOptionalPhone(raw: unknown): { ok: true; value: string | undefined } | { ok: false; error: string } {
  if (raw === undefined || raw === null || raw === "") return { ok: true, value: undefined };
  const s = String(raw).trim().slice(0, PHONE_MAX);
  if (s.length > PHONE_MAX) return { ok: false, error: `phone must be at most ${PHONE_MAX} characters` };
  if (!/^[\d\s\-+()./ext]+$/i.test(s)) return { ok: false, error: "phone contains invalid characters" };
  return { ok: true, value: s };
}

export function parseRequiredName(raw: unknown): { ok: true; value: string } | { ok: false; error: string } {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s) return { ok: false, error: "fullName is required" };
  if (s.length > NAME_MAX) return { ok: false, error: `fullName must be at most ${NAME_MAX} characters` };
  return { ok: true, value: s };
}

export function parseOptionalStringField(
  raw: unknown,
  max: number,
  label: string
): { ok: true; value: string | undefined } | { ok: false; error: string } {
  if (raw === undefined || raw === null || raw === "") return { ok: true, value: undefined };
  const s = String(raw).trim();
  if (s.length > max) return { ok: false, error: `${label} must be at most ${max} characters` };
  return { ok: true, value: s };
}

export function parseTags(raw: unknown): { ok: true; value: string[] } | { ok: false; error: string } {
  if (raw === undefined || raw === null) return { ok: true, value: [] };
  if (!Array.isArray(raw)) return { ok: false, error: "tags must be an array of strings" };
  const out: string[] = [];
  for (const t of raw) {
    if (typeof t !== "string") return { ok: false, error: "tags must be strings" };
    const s = t.trim().toLowerCase();
    if (!s) continue;
    if (s.length > TAG_MAX) return { ok: false, error: `each tag must be at most ${TAG_MAX} characters` };
    out.push(s);
  }
  return { ok: true, value: [...new Set(out)] };
}

export const brokerCrmLimits = {
  EMAIL_MAX,
  PHONE_MAX,
  NAME_MAX,
  NOTES_MAX,
  SOURCE_MAX,
  CITY_MAX,
};

export function parseNotes(raw: unknown) {
  return parseOptionalStringField(raw, NOTES_MAX, "notes");
}

export function parseSource(raw: unknown) {
  return parseOptionalStringField(raw, SOURCE_MAX, "source");
}

export function parseTargetCity(raw: unknown) {
  return parseOptionalStringField(raw, CITY_MAX, "targetCity");
}
