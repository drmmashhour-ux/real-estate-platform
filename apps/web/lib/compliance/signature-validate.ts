import type { SignatureBlock } from "./signature-format";

export type SignatureWarningCode = "SIGNATURE_CITY_MISSING";

/**
 * Hard requirements for a saved signature (throws on missing critical fields).
 */
export function assertSignatureRecord(input: {
  signedDate: string | null | undefined;
  signerId: string | null | undefined;
}): void {
  if (!input.signedDate) {
    throw new Error("SIGNATURE_DATE_REQUIRED");
  }
  if (!input.signerId) {
    throw new Error("SIGNER_REQUIRED");
  }
}

/**
 * Optional / best-practice checks (non-blocking for all jurisdictions).
 * Log or surface in review UI.
 */
export function collectSignatureWarnings(
  input: Pick<SignatureBlock, "signedCity"> | { signedCity?: string | null },
): SignatureWarningCode[] {
  const w: SignatureWarningCode[] = [];
  const c = input.signedCity?.trim();
  if (!c || c === "UNSPECIFIED") {
    w.push("SIGNATURE_CITY_MISSING");
  }
  return w;
}

export function logSignatureWarning(code: SignatureWarningCode, detail?: string): void {
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.warn(`[signature] ${code}${detail ? `: ${detail}` : ""}`);
  }
}

/**
 * Validate a full block (throws + optional warning side-effect for city).
 */
export function validateSignatureBlock(block: SignatureBlock): SignatureWarningCode[] {
  assertSignatureRecord({ signedDate: block.signedDate, signerId: block.signerId });
  const warns = collectSignatureWarnings(block);
  for (const code of warns) {
    logSignatureWarning(code);
  }
  return warns;
}
