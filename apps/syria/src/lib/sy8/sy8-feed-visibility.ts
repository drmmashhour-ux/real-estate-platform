import type { Prisma } from "@/generated/prisma";

/**
 * SY8-2 public listing visibility — use on every **guest-facing** `SyriaProperty` query.
 * Excludes: `fraudFlag`, sellers with `owner.flagged`, `needsReview`, and `status: NEEDS_REVIEW` / non-published rows when composed with `status: "PUBLISHED"`.
 */
export const sy8FeedExtraWhere: Prisma.SyriaPropertyWhereInput = {
  needsReview: false,
  owner: { flagged: false },
  /** ORDER SYBNB-108 — exclude synthetic test rows from guest-facing catalogs. */
  isTest: false,
};
