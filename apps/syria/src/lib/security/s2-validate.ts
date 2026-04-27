import { onlyDigits } from "@/lib/syria-phone";

export const S2_MIN_TITLE = 2;
export const S2_MIN_PHONE_DIGITS = 8;

const LISTING_ID = /^[a-z0-9_-]{8,64}$/i;
const CUIDISH = /^c[a-z0-9]{20,32}$/i;

export function s2IsValidListingId(id: string): boolean {
  const t = id.trim();
  if (!t) return false;
  return LISTING_ID.test(t) || CUIDISH.test(t);
}

export function s2ValidatePhoneDigits(raw: string): { ok: true; digits: string } | { ok: false } {
  const digits = onlyDigits(String(raw));
  if (digits.length < S2_MIN_PHONE_DIGITS) return { ok: false };
  return { ok: true, digits };
}

export function s2ValidatePrice(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n > 0;
}

export function s2ValidateTitle(s: string): boolean {
  return s.trim().length >= S2_MIN_TITLE;
}
