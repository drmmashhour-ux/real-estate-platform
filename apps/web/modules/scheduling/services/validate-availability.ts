/** 0 = Sunday … 6 = Saturday (JavaScript Date.getUTCDay). */
export function normalizeDayOfWeek(n: number): { ok: true; value: number } | { ok: false; error: string } {
  if (!Number.isInteger(n) || n < 0 || n > 6) {
    return { ok: false, error: "dayOfWeek must be an integer 0–6 (Sun–Sat)" };
  }
  return { ok: true, value: n };
}

export function normalizeMinuteRange(
  start: number,
  end: number
): { ok: true; startMinute: number; endMinute: number } | { ok: false; error: string } {
  if (!Number.isInteger(start) || !Number.isInteger(end)) {
    return { ok: false, error: "startMinute and endMinute must be integers" };
  }
  if (start < 0 || start > 1439 || end < 0 || end > 1440) {
    return { ok: false, error: "minutes must be within 0–1440" };
  }
  if (end <= start) return { ok: false, error: "endMinute must be after startMinute" };
  return { ok: true, startMinute: start, endMinute: end };
}
