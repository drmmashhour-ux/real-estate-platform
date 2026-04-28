/**
 * ORDER SYBNB-93 — public posting tiers: low-value listings allow anonymous create (no signup).
 */
import type { MarketplaceCategory } from "@/lib/marketplace-categories";

export const LOW_VALUE_POSTING_KINDS = ["bicycle", "basic_item", "small_rental"] as const;
export const HIGH_VALUE_POSTING_KINDS = ["apartment", "house", "hotel", "booking_listing", "land"] as const;

export type LowValuePostingKind = (typeof LOW_VALUE_POSTING_KINDS)[number];
export type HighValuePostingKind = (typeof HIGH_VALUE_POSTING_KINDS)[number];
export type PostingKind = LowValuePostingKind | HighValuePostingKind;

/** ORDER SYBNB-99 — apartment / house / land (real estate) require owner-or-mandate declaration. */
export const OWNERSHIP_REQUIRED_POSTING_KINDS = ["apartment", "house", "land"] as const;

const LOW_SET = new Set<string>(LOW_VALUE_POSTING_KINDS);
const HIGH_SET = new Set<string>(HIGH_VALUE_POSTING_KINDS);

export function isLowValuePostingKind(s: string | undefined | null): boolean {
  const k = (s ?? "").trim();
  return k.length > 0 && LOW_SET.has(k);
}

export function isHighValuePostingKind(s: string | undefined | null): boolean {
  const k = (s ?? "").trim();
  return k.length > 0 && HIGH_SET.has(k);
}

export function isKnownPostingKind(s: string | undefined | null): s is PostingKind {
  const k = (s ?? "").trim();
  return k.length > 0 && (LOW_SET.has(k) || HIGH_SET.has(k));
}

/** Stable classification from marketplace pair — drives anonymous vs auth-required API rules. */
export function derivePostingKindFromMarketplace(category: MarketplaceCategory, subcategory: string): PostingKind {
  if (category === "other") return "basic_item";
  if (category === "cars" && subcategory === "motorcycle") return "bicycle";
  if (category === "real_estate" && subcategory === "rent") return "small_rental";
  if (category === "stay" && subcategory === "hotel") return "hotel";
  if (category === "stay") return "booking_listing";
  if (category === "real_estate" && subcategory === "hotel") return "hotel";
  if (category === "real_estate" && subcategory === "commercial") return "land";
  if (category === "real_estate" && subcategory === "furnished") return "house";
  if (category === "real_estate") return "apartment";
  if (category === "cars") return "apartment";
  if (category === "electronics" || category === "furniture" || category === "services") return "basic_item";
  return "basic_item";
}

/** ORDER SYBNB-99 — high-value real_estate classes only (not cars masquerading as `apartment` kind). */
export function requiresOwnershipMandateDeclaration(
  category: MarketplaceCategory,
  postingKind: PostingKind | string,
): boolean {
  if (category !== "real_estate") return false;
  const k = String(postingKind).trim();
  return k === "apartment" || k === "house" || k === "land";
}

/** ORDER SYBNB-101 — apartment / house / land real_estate subject to ownership verification ranking + badges. */
export function isOwnershipVerificationTierListing(
  category: string | null | undefined,
  postingKind: string | null | undefined,
): boolean {
  if ((category ?? "").trim() !== "real_estate") return false;
  const k = (postingKind ?? "").trim();
  return k === "apartment" || k === "house" || k === "land";
}
