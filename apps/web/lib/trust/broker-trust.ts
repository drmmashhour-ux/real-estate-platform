/**
 * Public broker trust copy + OACIQ register links.
 * LECIPM is not a regulator — wording avoids implying platform certification.
 */

export const OACIQ_PUBLIC_REGISTER_EN = "https://registre.oaciq.com/en/";

export function oaciqRegisterUrl(locale: string): string {
  const lower = locale.toLowerCase();
  if (lower.startsWith("fr")) return "https://registre.oaciq.com/fr/";
  return OACIQ_PUBLIC_REGISTER_EN;
}

export type LicenceProfileSlice = {
  licenceNumber: string | null;
  licenceStatus: string;
  practiceMode: string | null;
  regulator: string | null;
  fullName?: string | null;
} | null;

/** Québec residential broker: active OACIQ licence record on file (platform data; confirm on OACIQ). */
export function isActiveOaciqLicenceOnFile(profile: LicenceProfileSlice): boolean {
  if (!profile?.licenceNumber?.trim()) return false;
  return profile.licenceStatus.toLowerCase() === "active";
}

export function isIndependentPractice(profile: LicenceProfileSlice): boolean {
  return (profile?.practiceMode ?? "").toUpperCase() === "INDEPENDENT";
}

export const TRUST_COPY = {
  platformNotRegulator:
    "LECIPM is a technology platform, not a regulator. Licence details are supplied by the broker—confirm status on the official OACIQ register.",
  whatMeansTitle: "What does this mean?",
  whatMeansBody: [
    "In Québec, real estate brokers are regulated by the Organisme d’autoréglementation du courtage immobilier du Québec (OACIQ). OACIQ sets licensing and conduct rules for brokers—not for LECIPM.",
    "FARCIQ professional liability insurance is coverage brokers maintain for their practice. When shown as “on file”, it reflects records in LECIPM at this time; it is not a guarantee about every future transaction.",
  ].join(" "),
  verifyBroker: "Verify broker (OACIQ register)",
  licensedBadge: "Licensed broker (OACIQ)",
  insuredBadge: "Insured (FARCIQ)",
  independentBadge: "Independent broker",
  contractInsuranceActive:
    "Professional liability (FARCIQ): active policy on file for the current term (platform record).",
  contractInsuranceNone: "Professional liability (FARCIQ): no active policy on file in LECIPM at this time.",
} as const;
