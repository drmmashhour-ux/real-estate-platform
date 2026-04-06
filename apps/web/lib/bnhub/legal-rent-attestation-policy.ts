/** Bump when attestation wording or policy changes; hosts must re-attest to publish. */
export const LEGAL_RENT_RIGHT_ATTESTATION_VERSION = "2026-03-30";

export const LEGAL_RENT_RIGHT_ATTESTATION_SUMMARY =
  "I confirm that I have the legal right to offer this stay for short-term rental on this platform (for example as owner, lawful tenant with sublet permission where required, or an authorized property manager), and that the information I provide is accurate.";

export function hasCurrentLegalRentRightAttestation(
  attestedAt: Date | null | undefined,
  version: string | null | undefined
): boolean {
  return Boolean(attestedAt && version === LEGAL_RENT_RIGHT_ATTESTATION_VERSION);
}
