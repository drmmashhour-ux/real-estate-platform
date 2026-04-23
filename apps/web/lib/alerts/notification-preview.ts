/**
 * Short preview line for email subject, SMS, or push (optional AI summary).
 * Does not auto-send — callers remain responsible for human review.
 */
export function buildNotificationPreview(input: { title: string; summary?: string | null }): string {
  const s = typeof input.summary === "string" ? input.summary.trim() : "";
  if (s.length > 0) {
    const clip = s.length > 140 ? `${s.slice(0, 137)}…` : s;
    return `${input.title} — ${clip}`;
  }
  return input.title;
}
