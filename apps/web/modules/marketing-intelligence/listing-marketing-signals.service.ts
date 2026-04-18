import { MarketingSystemEventCategory } from "@prisma/client";
import { prisma } from "@/lib/db";

/** Pulls real PERFORMANCE rows for a listing subject (host-owned marketing telemetry). */
export async function getListingMarketingSignals(ownerUserId: string, listingId: string, since: Date) {
  const rows = await prisma.marketingSystemEvent.findMany({
    where: {
      userId: ownerUserId,
      category: MarketingSystemEventCategory.PERFORMANCE,
      subjectType: "listing",
      subjectId: listingId,
      createdAt: { gte: since },
    },
    select: { eventKey: true, amountCents: true },
    take: 2000,
  });
  let revenueCents = 0;
  let spendCents = 0;
  let leads = 0;
  let impressions = 0;
  let clicks = 0;
  for (const r of rows) {
    if (r.eventKey === "revenue" && r.amountCents) revenueCents += r.amountCents;
    if (r.eventKey === "spend" && r.amountCents) spendCents += r.amountCents;
    if (r.eventKey === "lead") leads += 1;
    if (r.eventKey === "impression") impressions += 1;
    if (r.eventKey === "click") clicks += 1;
  }
  return { revenueCents, spendCents, leads, impressions, clicks, eventCount: rows.length };
}
