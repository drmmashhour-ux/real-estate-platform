import type { Prisma } from "@prisma/client";

export const OFFER_MAX_CONDITIONS = 8000;
export const OFFER_MAX_MESSAGE = 4000;
export const OFFER_MAX_NOTE = 4000;

export function parseOfferedPrice(raw: unknown): { ok: true; value: number } | { ok: false; error: string } {
  const n = typeof raw === "number" ? raw : typeof raw === "string" ? parseFloat(raw) : NaN;
  if (!Number.isFinite(n) || n <= 0) return { ok: false, error: "offeredPrice must be a positive number" };
  if (n > 1_000_000_000) return { ok: false, error: "offeredPrice is out of range" };
  return { ok: true, value: n };
}

export function parseOptionalClosingDate(raw: unknown): { ok: true; value: Date | null } | { ok: false; error: string } {
  if (raw == null || raw === "") return { ok: true, value: null };
  const d = new Date(String(raw));
  if (Number.isNaN(d.getTime())) return { ok: false, error: "closingDate is invalid" };
  return { ok: true, value: d };
}

export function parseOptionalString(raw: unknown, max: number, field: string): { ok: true; value: string | null } | { ok: false; error: string } {
  if (raw == null || raw === "") return { ok: true, value: null };
  const s = String(raw);
  if (s.length > max) return { ok: false, error: `${field} is too long (max ${max})` };
  return { ok: true, value: s };
}

export function parseScenario(raw: unknown): Prisma.InputJsonValue | undefined {
  if (raw == null || raw === "") return undefined;
  if (typeof raw === "object") return raw as Prisma.InputJsonValue;
  return undefined;
}
