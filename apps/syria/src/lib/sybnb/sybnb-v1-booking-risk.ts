import { isSy8SellerVerified } from "@/lib/sy8/sy8-reputation";
import type { SyriaAppUser, SyriaProperty } from "@/generated/prisma";

function nz(s: string | null | undefined): string {
  return (s ?? "").trim();
}

/**
 * SY8-2: composite risk for Sybnb v1 request rows (`riskScore` + `riskStatus`).
 * Points: unverified host +2, no address +1, no area +1, ≥3 reports on this listing +2.
 * Status: 0–3 clear, 4–5 review, 6+ blocked.
 */
export function computeSybnbV1BookingRiskScore(input: {
  host: Pick<SyriaAppUser, "phoneVerifiedAt" | "verifiedAt" | "verificationLevel">;
  listing: Pick<SyriaProperty, "addressDetails" | "area">;
  /** Combined Syria + Sybnb reports for this property. */
  listingReportCount: number;
}): number {
  let risk = 0;
  if (!isSy8SellerVerified(input.host)) {
    risk += 2;
  }
  if (!nz(input.listing.addressDetails)) {
    risk += 1;
  }
  if (!nz(input.listing.area)) {
    risk += 1;
  }
  if (input.listingReportCount >= 3) {
    risk += 2;
  }
  return risk;
}

export function sybnbRiskStateFromScore(score: number): "clear" | "review" | "blocked" {
  if (score >= 6) {
    return "blocked";
  }
  if (score >= 4) {
    return "review";
  }
  return "clear";
}
