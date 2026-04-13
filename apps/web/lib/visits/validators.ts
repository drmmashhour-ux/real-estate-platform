import {
  VISIT_DURATION_DEFAULT,
  VISIT_DURATION_MAX,
  VISIT_DURATION_MIN,
} from "@/lib/visits/constants";

export function clampDurationMinutes(raw: unknown): number {
  const n = typeof raw === "number" ? raw : typeof raw === "string" ? parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n)) return VISIT_DURATION_DEFAULT;
  return Math.min(VISIT_DURATION_MAX, Math.max(VISIT_DURATION_MIN, Math.round(n)));
}

export function parseISODate(s: unknown): Date | null {
  if (typeof s !== "string" || !s.trim()) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isValidHHMM(s: string): boolean {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return false;
  const h = parseInt(m[1]!, 10);
  const min = parseInt(m[2]!, 10);
  return h >= 0 && h <= 23 && min >= 0 && min <= 59;
}
