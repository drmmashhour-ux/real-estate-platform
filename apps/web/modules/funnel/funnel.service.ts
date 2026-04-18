/**
 * Funnel steps for Marketing System v2 — stored as MarketingSystemEvent FUNNEL category.
 * Does not replace existing `AnalyticsFunnelEvent` — additive parallel path.
 */
import { MarketingSystemEventCategory } from "@prisma/client";
import { prisma } from "@/lib/db";
import { asOptionalInputJsonValue } from "@/lib/prisma/as-input-json";

export type FunnelStepKey =
  | "ad_click"
  | "landing_view"
  | "cta_click"
  | "blog_view"
  | "blog_click"
  | "listing_view"
  | "lead_submit"
  | "lead_capture"
  | "booking_start"
  | "checkout"
  | "booking_completed";

export async function recordFunnelStep(input: {
  step: FunnelStepKey | string;
  userId?: string | null;
  sessionId?: string | null;
  listingId?: string | null;
  blogId?: string | null;
  campaignId?: string | null;
  /** When set (e.g. booking_completed), rows anchor to the booking for funnel analytics. */
  bookingId?: string | null;
  meta?: Record<string, unknown>;
}) {
  const idem =
    input.meta && typeof input.meta.idempotencyKey === "string" ? input.meta.idempotencyKey : null;
  if (idem) {
    const dup = await prisma.marketingSystemEvent.findFirst({
      where: {
        category: MarketingSystemEventCategory.FUNNEL,
        meta: { path: ["idempotencyKey"], equals: idem },
      },
      select: { id: true },
    });
    if (dup) {
      return prisma.marketingSystemEvent.findFirstOrThrow({ where: { id: dup.id } });
    }
  }

  const subjectType = input.bookingId
    ? "booking"
    : input.listingId
      ? "listing"
      : input.blogId
        ? "blog"
        : input.campaignId
          ? "campaign"
          : null;
  const subjectId =
    input.bookingId ?? input.listingId ?? input.blogId ?? input.campaignId ?? null;
  return prisma.marketingSystemEvent.create({
    data: {
      userId: input.userId ?? null,
      category: MarketingSystemEventCategory.FUNNEL,
      eventKey: input.step,
      subjectType,
      subjectId,
      sessionId: input.sessionId ?? null,
      meta: asOptionalInputJsonValue(input.meta ?? undefined),
    },
  });
}
