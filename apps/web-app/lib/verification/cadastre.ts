/**
 * Cadastre number validation for Québec (Registre foncier).
 * Formats can include: numbers, letters, fractions (e.g. 16 1/4), lot names, etc.
 */

const CADASTRE_MIN_LENGTH = 1;
const CADASTRE_MAX_LENGTH = 80;
// Allow alphanumeric, spaces, hyphens, fractions, & for "50 & 51A", accents for French
const CADASTRE_REGEX = /^[\p{L}\p{N}\s\-/&.'()]+$/u;

export function validateCadastreNumber(value: string | null | undefined): {
  valid: boolean;
  error?: string;
} {
  if (value == null || typeof value !== "string") {
    return { valid: false, error: "Cadastre number is required" };
  }
  const trimmed = value.trim();
  if (trimmed.length < CADASTRE_MIN_LENGTH) {
    return { valid: false, error: "Cadastre number is required" };
  }
  if (trimmed.length > CADASTRE_MAX_LENGTH) {
    return { valid: false, error: `Cadastre number must be at most ${CADASTRE_MAX_LENGTH} characters` };
  }
  if (!CADASTRE_REGEX.test(trimmed)) {
    return {
      valid: false,
      error:
        "Cadastre number can only contain letters, numbers, spaces, hyphens, and common symbols (e.g. / & ' ( ) )",
    };
  }
  return { valid: true };
}

export function normalizeCadastreNumber(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}
