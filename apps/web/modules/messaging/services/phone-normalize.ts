/** Best-effort E.164 for North America; returns null if unusable. */
export function normalizeToE164(phone: string): string | null {
  const d = phone.replace(/\D/g, "");
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  if (phone.trim().startsWith("+") && d.length >= 10 && d.length <= 15) return `+${d.replace(/^\+/, "").replace(/\D/g, "")}`;
  return null;
}
