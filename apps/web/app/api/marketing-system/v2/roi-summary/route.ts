import { NextResponse } from "next/server";
import { MarketingSystemEventCategory } from "@prisma/client";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { engineFlags } from "@/config/feature-flags";
import { requireUser } from "@/modules/security/access-guard.service";
import { aggregatePerformanceForUser } from "@/modules/marketing-performance";
import { computeCostPerUnit, computeRoiPercent } from "@/modules/marketing-performance/roi-calculator.service";

export const dynamic = "force-dynamic";

/** GET /api/marketing-system/v2/roi-summary — aggregates user-reported performance events (last 90d). */
export async function GET() {
  if (!engineFlags.marketingIntelligenceV1) {
    return NextResponse.json({ error: "Marketing intelligence is disabled" }, { status: 403 });
  }
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const agg = await aggregatePerformanceForUser(auth.userId, since);

  const revenueCents = agg.amountByKey["revenue"] ?? 0;
  const spendCents = agg.amountByKey["spend"] ?? 0;

  const leadCount = await prisma.marketingSystemEvent.count({
    where: {
      userId: auth.userId,
      category: MarketingSystemEventCategory.PERFORMANCE,
      eventKey: "lead",
      createdAt: { gte: since },
    },
  });

  const bookingCount = await prisma.marketingSystemEvent.count({
    where: {
      userId: auth.userId,
      category: MarketingSystemEventCategory.PERFORMANCE,
      eventKey: "booking",
      createdAt: { gte: since },
    },
  });

  const roiPercent = computeRoiPercent({ revenueCents, spendCents });
  const costPerLead = computeCostPerUnit(spendCents, leadCount);
  const costPerBooking = computeCostPerUnit(spendCents, bookingCount);

  const clickToLeadRate =
    agg.clicks > 0 ? Math.round((leadCount / agg.clicks) * 1000) / 10 : null;
  const leadToBookingRate =
    leadCount > 0 ? Math.round((bookingCount / leadCount) * 1000) / 10 : null;

  return NextResponse.json({
    windowDays: 90,
    impressions: agg.impressions,
    clicks: agg.clicks,
    leadCount,
    bookingCount,
    revenueCents,
    spendCents,
    roiPercent,
    costPerLeadCents: costPerLead,
    costPerBookingCents: costPerBooking,
    /** Reported performance events only — leads ÷ clicks (null if no clicks). */
    clickToLeadPercent: clickToLeadRate,
    /** Bookings ÷ leads (null if no leads). */
    leadToBookingPercent: leadToBookingRate,
    amountByKey: agg.amountByKey,
  });
}
