/** Enable automatic content machine runs (with listing create + cron). Default off. */
export function isContentMachineEnabled(): boolean {
  return process.env.CONTENT_MACHINE_ENABLED?.trim() === "1";
}

export function contentMachineDailyBudget(): number {
  const n = Number(process.env.CONTENT_MACHINE_DAILY_PIECES?.trim());
  return Number.isFinite(n) && n >= 1 && n <= 20 ? Math.floor(n) : 5;
}

/**
 * Comma-separated UTC hours (0–23) for post slots.
 * Default `[17, 20, 23]` ≈ lunch / afternoon / evening Eastern (adjust for DST or Québec).
 * Example Montréal summer EDT: noon=16, 3pm=19, 7pm=23 UTC.
 */
export function contentMachineSlotHoursUtc(): number[] {
  const raw = process.env.CONTENT_MACHINE_SLOT_HOURS_UTC?.trim();
  if (raw) {
    const parts = raw.split(",").map((s) => Number(s.trim()));
    const ok = parts.filter((n) => Number.isFinite(n) && n >= 0 && n <= 23);
    if (ok.length) return ok;
  }
  return [17, 20, 23];
}
