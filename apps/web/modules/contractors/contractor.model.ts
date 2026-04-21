/**
 * Green contractor marketplace — introduction only; LECIPM does not perform or warranty work.
 */

export const CONTRACTOR_WORK_DISCLAIMER =
  "LECIPM connects you with independent professionals for informational purposes only. We do not guarantee workmanship, timelines, pricing, or licensing — verify credentials, contracts, and permits yourself.";

export const POSITIONING_GREEN_EXECUTION = "From insight → to upgrade → to certified listing";

/** Monetization — wire to billing when ready */
export const CONTRACTOR_MONETIZATION = {
  leadFeePerIntroductionCad: "Contact sales — lead fee per qualified introduction",
  premiumListingMonthlyCad: "Contact sales — boosted placement for contractors",
} as const;

/** Normalized service slugs stored on `Contractor.services` */
export type ContractorServiceSlug =
  | "insulation"
  | "heat_pump"
  | "roofing"
  | "solar_pv"
  | "windows"
  | "ventilation"
  | "air_sealing";

export type ContractorReviewPublic = {
  id: string;
  rating: number;
  body: string | null;
  authorLabel: string | null;
  createdAt: string;
};

export type ContractorProfilePublic = {
  id: string;
  name: string;
  services: string[];
  region: string;
  rating: number;
  premiumListing: boolean;
  reviews: ContractorReviewPublic[];
};

export type MatchedContractor = ContractorProfilePublic & {
  /** Why this row surfaced (tags / region) */
  matchReasons: string[];
};
