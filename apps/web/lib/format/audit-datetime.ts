/**
 * Audit-friendly display for timestamps stored in UTC (Prisma `DateTime`).
 * Browser renders in the user's local timezone unless `timeZone` is set.
 */

export type AuditDateTimeOptions = {
  /** IANA zone, e.g. "America/Toronto". Default: user's local (omit in Intl). */
  timeZone?: string;
  /** Show short timezone label (e.g. GMT-4). */
  showTimezone?: boolean;
  /** e.g. "2 hours ago" after the main line */
  relative?: boolean;
  /**
   * `true` (default): `Mar 23, 2026 — 8:32 PM` — user-facing timelines.
   * `false`: 24-hour clock for strict audit readouts.
   */
  hour12?: boolean;
  /** Include seconds in the time segment (audit / compliance). */
  includeSeconds?: boolean;
};

function relativeFromNow(d: Date, now = Date.now()): string {
  const sec = Math.round((d.getTime() - now) / 1000);
  const abs = Math.abs(sec);
  if (abs < 60) return "just now";
  const min = Math.round(abs / 60);
  if (min < 60) return `${min} min${min === 1 ? "" : "s"} ${sec >= 0 ? "from now" : "ago"}`;
  const h = Math.round(abs / 3600);
  if (h < 48) return `${h} hour${h === 1 ? "" : "s"} ${sec >= 0 ? "from now" : "ago"}`;
  const days = Math.round(abs / 86400);
  return `${days} day${days === 1 ? "" : "s"} ${sec >= 0 ? "from now" : "ago"}`;
}

/**
 * Example: `Mar 23, 2026 — 8:32 PM` (local, default) or 24h when `hour12: false`.
 */
export function formatAuditDateTime(
  input: Date | string | number,
  opts: AuditDateTimeOptions = {}
): string {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "—";

  const hour12 = opts.hour12 !== false;

  const base: Intl.DateTimeFormatOptions = opts.timeZone
    ? { timeZone: opts.timeZone }
    : {};

  const datePart = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...base,
  }).format(d);

  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    ...(opts.includeSeconds ? { second: "2-digit" as const } : {}),
    hour12,
    ...base,
  }).format(d);

  let s = `${datePart} — ${timePart}`;

  if (opts.showTimezone) {
    const tz = new Intl.DateTimeFormat("en-US", {
      ...base,
      timeZoneName: "short",
    }).formatToParts(d);
    const name = tz.find((p) => p.type === "timeZoneName")?.value;
    if (name) s = `${s} ${name}`;
  }

  if (opts.relative) {
    s = `${s} · ${relativeFromNow(d)}`;
  }

  return s;
}

/** ISO string in UTC for APIs / logs (explicit). */
export function toIsoUtc(d: Date | string): string {
  const x = d instanceof Date ? d : new Date(d);
  return x.toISOString();
}

/** Compact UTC line for admin “raw” audit view. */
export function formatAuditUtcIso(input: Date | string | number): string {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " Z");
}
