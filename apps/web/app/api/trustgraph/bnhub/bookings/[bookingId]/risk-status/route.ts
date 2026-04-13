import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@/lib/db";
import { isTrustGraphEnabled } from "@/lib/trustgraph/config";
import { isTrustGraphBnhubRiskEnabled } from "@/lib/trustgraph/feature-flags";
import { toBnhubBookingRiskDtos } from "@/lib/trustgraph/application/dto/bnhubBookingRiskDto";
import { trustgraphJsonError, trustgraphJsonOk } from "@/lib/trustgraph/infrastructure/auth/http";

export const dynamic = "force-dynamic";

const paramsSchema = z.object({
  bookingId: z.string().min(1),
});

export async function GET(_request: Request, context: { params: Promise<{ bookingId: string }> }) {
  if (!isTrustGraphEnabled() || !isTrustGraphBnhubRiskEnabled()) {
    return trustgraphJsonError("BNHUB TrustGraph disabled", 503);
  }

  const raw = await context.params;
  const parsed = paramsSchema.safeParse(raw);
  if (!parsed.success) {
    return trustgraphJsonError("Invalid booking id", 400, parsed.error.flatten());
  }

  const userId = await getGuestId();
  if (!userId) {
    return trustgraphJsonError("Unauthorized", 401);
  }

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
    select: {
      id: true,
      guestId: true,
      listing: { select: { ownerId: true } },
    },
  });
  if (!booking) {
    return trustgraphJsonError("Not found", 404);
  }

  const admin = await isPlatformAdmin(userId);
  const allowed = admin || userId === booking.guestId || userId === booking.listing.ownerId;
  if (!allowed) {
    return trustgraphJsonError("Forbidden", 403);
  }

  const c = await prisma.verificationCase.findFirst({
    where: { entityType: "BOOKING", entityId: booking.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, overallScore: true, readinessLevel: true },
  });

  const rules = c
    ? await prisma.verificationRuleResult.findMany({
        where: { caseId: c.id },
        select: { ruleCode: true, passed: true, details: true },
      })
    : [];

  const depositRecommended = rules.some((r) => r.ruleCode === "BOOKING_DEPOSIT_RECOMMENDATION_RULE" && !r.passed);
  const manualReviewHint = rules.some(
    (r) =>
      (r.ruleCode === "BOOKING_ANOMALY_RULE" && !r.passed) ||
      (r.ruleCode === "SHORT_STAY_RISK_RULE" && !r.passed)
  );

  const dtos = toBnhubBookingRiskDtos({
    overallScore: c?.overallScore ?? null,
    readinessLevel: c?.readinessLevel ?? null,
    depositRecommended,
    manualReviewHint,
  });

  return trustgraphJsonOk({
    safe: dtos.safe,
    ...(admin ? { admin: dtos.admin } : {}),
  });
}
