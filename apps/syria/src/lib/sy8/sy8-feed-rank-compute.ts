import type { SyriaAppUser, SyriaProperty } from "@/generated/prisma";

export type Sy8LocationQualityTier = "incomplete" | "general" | "medium" | "precise";

function nz(s: string | null | undefined): string {
  return (s ?? "").trim();
}

/** Whether listing has a “state / governorate” and city for SYBNB safety checks. */
export function hasSy8ListingStateAndCity(
  p: Pick<SyriaProperty, "state" | "governorate" | "city">,
): boolean {
  const hasState = nz(p.state) !== "" || nz(p.governorate) !== "";
  return hasState && nz(p.city) !== "";
}

/**
 * +3 if state (or governorate) + city,
 * +2 area, +2 address details, +3 verified seller, +5 if property has any booking.
 */
export function computeSy8FeedRankScore(input: {
  property: Pick<SyriaProperty, "state" | "governorate" | "city" | "area" | "addressDetails">;
  owner: Pick<SyriaAppUser, "phoneVerifiedAt" | "verifiedAt" | "verificationLevel">;
  bookingCount: number;
}): number {
  const { property: p, owner, bookingCount } = input;
  const hasStateLine = nz(p.state) !== "" || nz(p.governorate) !== "";
  const hasCity = nz(p.city) !== "";
  const stateCity = hasStateLine && hasCity ? 3 : 0;
  const area = nz(p.area) !== "" ? 2 : 0;
  const details = nz(p.addressDetails) !== "" ? 2 : 0;
  const verified =
    owner.phoneVerifiedAt != null || owner.verifiedAt != null || Boolean(owner.verificationLevel?.trim())
      ? 3
      : 0;
  const bookingBoost = bookingCount > 0 ? 5 : 0;
  return stateCity + area + details + verified + bookingBoost;
}

/**
 * - **incomplete** — no state/governorate or no city
 * - **general** — state / governorate only (no city)
 * - **medium** — state + city, but not “full” address
 * - **precise** — state + city + area + addressDetails
 */
export function sy8LocationQualityTier(
  p: Pick<SyriaProperty, "state" | "governorate" | "city" | "area" | "addressDetails">,
): Sy8LocationQualityTier {
  const hasState = nz(p.state) !== "" || nz(p.governorate) !== "";
  const hasCity = nz(p.city) !== "";
  if (!hasState || !hasCity) {
    if (hasState && !hasCity) return "general";
    return "incomplete";
  }
  const hasArea = nz(p.area) !== "";
  const hasDetails = nz(p.addressDetails) !== "";
  if (hasArea && hasDetails) return "precise";
  return "medium";
}
