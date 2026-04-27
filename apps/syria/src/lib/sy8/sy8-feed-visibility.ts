import type { Prisma } from "@/generated/prisma";

/**
 * SY8-2 public listing visibility — use on every **guest-facing** `SyriaProperty` query.
 * Excludes: `fraudFlag`, sellers with `owner.flagged`, and listings in the report queue
 * (`needsReview: true` and/or `status: PENDING_REVIEW` from the ≥5-reports path).
 * Composed with `status: "PUBLISHED"` in `buildPropertyWhere` and similar clauses.
 */
export const sy8FeedExtraWhere: Prisma.SyriaPropertyWhereInput = {
  needsReview: false,
  owner: { flagged: false },
};
