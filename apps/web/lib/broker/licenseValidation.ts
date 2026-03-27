/**
 * Mortgage broker license — **format** checks only.
 * Does not verify against a regulator; manual admin review is required for compliance.
 */

export const LICENSE_MIN_LEN = 6;
export const LICENSE_MAX_LEN = 12;

export type LicenseFormatResult =
  | { valid: true; normalized: string }
  | { valid: false; normalized: string; reason: string };

/** Non-empty, length 6–12, alphanumeric only (after trim). */
export function validateLicenseFormat(raw: string): LicenseFormatResult {
  const normalized = raw.trim();
  if (!normalized) {
    return { valid: false, normalized: "", reason: "License number is required." };
  }
  if (normalized.length < LICENSE_MIN_LEN || normalized.length > LICENSE_MAX_LEN) {
    return {
      valid: false,
      normalized,
      reason: `License must be ${LICENSE_MIN_LEN}–${LICENSE_MAX_LEN} characters.`,
    };
  }
  if (!/^[a-zA-Z0-9]+$/.test(normalized)) {
    return {
      valid: false,
      normalized,
      reason: "License may only contain letters and numbers (no spaces or symbols).",
    };
  }
  return { valid: true, normalized };
}

export type LicenseAssistFlag = "looks_valid" | "suspicious";

/**
 * Heuristic “AI-style” hint — **not** regulatory verification.
 * Use only for UX; admins must verify manually.
 */
export function assessLicenseAssistFlag(normalized: string, format: LicenseFormatResult): LicenseAssistFlag | null {
  if (!format.valid || !normalized) return null;

  const lower = normalized.toLowerCase();
  if (/^(.)\1+$/.test(normalized)) {
    return "suspicious";
  }
  if (/^(\d)\1+$/.test(normalized.replace(/[a-z]/gi, "")) && normalized.replace(/\D/g, "").length === normalized.length) {
    return "suspicious";
  }
  const hasLetter = /[a-zA-Z]/.test(normalized);
  const hasDigit = /\d/.test(normalized);
  if (!hasLetter || !hasDigit) {
    return "suspicious";
  }
  if (["abcdef", "123456", "000000", "111111"].includes(lower)) {
    return "suspicious";
  }
  const digitsOnly = normalized.replace(/\D/g, "");
  if (digitsOnly.length >= 6 && isStrictlySequentialDigits(digitsOnly)) {
    return "suspicious";
  }
  return "looks_valid";
}

function isStrictlySequentialDigits(d: string): boolean {
  for (let i = 1; i < d.length; i++) {
    if (Number(d[i]) !== Number(d[i - 1]) + 1) return false;
  }
  return true;
}

export const LICENSE_MANUAL_REVIEW_WARNING =
  "This license is not automatically verified. Verification is subject to manual review.";

// Future (optional): if a regulator publishes a public license lookup API, add a server-only
// client in e.g. `lib/broker/regulatorLookup.ts`, call it after `validateLicenseFormat` passes,
// and persist auxiliary fields (lookup payload, timestamp). Keep `verificationStatus` driven by
// admin manual review until compliance policy says otherwise.
