/** SYBNB booking chat — server-validated plain text only (no HTML). */
export const SYBNB_MESSAGE_MAX_LEN = 1000;

export type NormalizeSybnbMessageResult =
  | { ok: true; content: string }
  | { ok: false; error: "empty" | "too_long" };

/**
 * Trim, length-cap, strip dangerous control characters (keep newlines/tabs).
 */
export function normalizeSybnbMessageContent(raw: string): NormalizeSybnbMessageResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "empty" };
  }
  if (trimmed.length > SYBNB_MESSAGE_MAX_LEN) {
    return { ok: false, error: "too_long" };
  }
  const cleaned = trimmed.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  return { ok: true, content: cleaned };
}

/** Soft UX hint — URLs are allowed but we warn in UI (no blocking). */
export function sybnbMessageContainsHttpUrl(content: string): boolean {
  return /\bhttps?:\/\//i.test(content);
}
