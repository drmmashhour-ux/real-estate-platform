/**
 * Cross-app normalized shapes — advisory / dashboard use; not DB rows.
 */

import type { PlatformRegionCode } from "../regions/region.types";

export type NormalizedAppSource = "web" | "syria" | "external";

export type NormalizedComplianceState = "unknown" | "pending" | "passed" | "blocked";

export type NormalizedListing = {
  id: string;
  sourceApp: NormalizedAppSource;
  regionCode: PlatformRegionCode;
  listingType: string | null;
  title: string | null;
  status: string | null;
  priceHint: number | null;
  currency: string | null;
  complianceState: NormalizedComplianceState;
  legalRiskScoreHint: number | null;
  trustScoreHint: number | null;
  fraudFlag: boolean;
  bookingCountHint: number | null;
  revenueHint: number | null;
  payoutPendingHint: number | null;
  availabilityNotes: readonly string[];
};

export type NormalizedBooking = {
  id: string;
  listingId: string;
  regionCode: PlatformRegionCode;
  sourceApp: NormalizedAppSource;
  status: string | null;
  grossHint: number | null;
  fraudFlag: boolean;
  cancelled: boolean;
  availabilityNotes: readonly string[];
};

export type NormalizedUserProfile = {
  id: string;
  regionCode: PlatformRegionCode;
  sourceApp: NormalizedAppSource;
  roleHint: string | null;
  trustScoreHint: number | null;
  riskTags: readonly string[];
  availabilityNotes: readonly string[];
};

export type NormalizedPayout = {
  id: string;
  regionCode: PlatformRegionCode;
  amountHint: number | null;
  currency: string | null;
  status: string | null;
  availabilityNotes: readonly string[];
};

export type NormalizedRiskFlag = {
  code: string;
  severity: "info" | "warning" | "critical";
  scope: "listing" | "booking" | "user" | "platform";
  availabilityNotes: readonly string[];
};

export type NormalizedTrustProfile = {
  entityId: string;
  regionCode: PlatformRegionCode;
  scoreHint: number | null;
  levelHint: string | null;
  factors: readonly string[];
  availabilityNotes: readonly string[];
};
