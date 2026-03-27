/**
 * TrustGraph Phase 2 — tunable limits (no magic numbers inside rule bodies).
 * Import from rules via this module only.
 */
import { getFsboMaxPhotosForSellerPlan } from "@/lib/fsbo/photo-limits";

function parseEnvBool(raw: string | undefined): boolean {
  if (raw == null || raw === "") return false;
  const v = raw.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes" || v === "on";
}

export const TRUSTGRAPH_LISTING_RULE_ENGINE_VERSION = "2";

/** Minimum photos required for verification eligibility (drafts may have fewer). */
export const MIN_PHOTOS_FOR_VERIFICATION = 1;

/** Free / basic seller plan slug (matches `getFsboMaxPhotosForSellerPlan` default). */
export const FREE_PLAN_SLUGS = new Set(["basic", ""]);

export function isFreeSellerPlan(plan: string | null | undefined): boolean {
  const p = (plan ?? "basic").toLowerCase();
  return p === "basic" || FREE_PLAN_SLUGS.has(p);
}

export function freePlanPhotoMax(plan: string | null | undefined): number {
  return getFsboMaxPhotosForSellerPlan(isFreeSellerPlan(plan) ? "basic" : plan);
}

/** Conservative floor for price sanity (cents). Below = fail unless clearly invalid. */
export const MIN_LISTING_PRICE_CENTS = 1;

/**
 * When true, failed DUPLICATE_MEDIA_HASH_RULE blocks publish (in addition to warnings).
 * Default false — duplicates are flagged for admin review without blocking publication.
 */
export const DUPLICATE_MEDIA_BLOCKS_PUBLISH = parseEnvBool(process.env.TRUSTGRAPH_DUPLICATE_MEDIA_BLOCKS_PUBLISH);

/**
 * Rule codes that block paid publish / checkout when the rule does not pass.
 * Keep conservative; duplicate media is opt-in via DUPLICATE_MEDIA_BLOCKS_PUBLISH.
 */
export const PUBLISH_BLOCKING_RULE_CODES: readonly string[] = ["DECLARATION_MANDATORY_FIELDS_RULE"];

/**
 * Premium publish requires trust at or above this level (when TrustGraph is enabled).
 */
export const PREMIUM_PUBLISH_MIN_TRUST_LEVELS = new Set(["high", "verified"]);
