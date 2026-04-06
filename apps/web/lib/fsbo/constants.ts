/** FSBO (sell-by-yourself) module constants. */

export const FSBO_STATUS = {
  DRAFT: "DRAFT",
  /** Submitted by seller; awaiting admin review before going live. */
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
  ACTIVE: "ACTIVE",
  ARCHIVED: "ARCHIVED",
  SOLD: "SOLD",
} as const;

export const FSBO_MODERATION = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export const FSBO_PLAN_BASIC = "basic" as const;
export const FSBO_PLAN_PREMIUM = "premium" as const;
export type FsboPublishPlan = typeof FSBO_PLAN_BASIC | typeof FSBO_PLAN_PREMIUM;

/** Default publish fee: $99 CAD (minor units). Override with FSBO_PUBLISH_PRICE_CENTS. */
export function getFsboPublishPriceCents(): number {
  const raw = process.env.FSBO_PUBLISH_PRICE_CENTS?.trim();
  if (raw) {
    const n = parseInt(raw, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 9_900;
}

/** Premium / featured listing fee: $199 CAD default. Override FSBO_PREMIUM_PUBLISH_PRICE_CENTS. */
export function getFsboPremiumPublishPriceCents(): number {
  const raw = process.env.FSBO_PREMIUM_PUBLISH_PRICE_CENTS?.trim();
  if (raw) {
    const n = parseInt(raw, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 19_900;
}

export function getFsboPlanPublishPriceCents(plan: FsboPublishPlan): number {
  return plan === FSBO_PLAN_PREMIUM ? getFsboPremiumPublishPriceCents() : getFsboPublishPriceCents();
}

export function parseFsboPublishPlan(raw: unknown): FsboPublishPlan {
  if (raw === FSBO_PLAN_PREMIUM || raw === "premium") return FSBO_PLAN_PREMIUM;
  return FSBO_PLAN_BASIC;
}

export function isFsboPubliclyVisible(listing: {
  status: string;
  moderationStatus: string;
  expiresAt?: Date | string | null;
  archivedAt?: Date | string | null;
}): boolean {
  const expiresAt =
    listing.expiresAt instanceof Date
      ? listing.expiresAt
      : typeof listing.expiresAt === "string"
        ? new Date(listing.expiresAt)
        : null;

  return (
    listing.status === FSBO_STATUS.ACTIVE &&
    listing.moderationStatus === FSBO_MODERATION.APPROVED &&
    !listing.archivedAt &&
    (!expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() > Date.now())
  );
}
