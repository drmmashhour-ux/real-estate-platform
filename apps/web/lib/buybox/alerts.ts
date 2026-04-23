import { prisma } from "@/lib/db";
import { createAlert } from "@/lib/monitoring/alerts";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

/** Create advisory Alert Center items for strong new buy-box matches (not executed trades). */
export async function alertOnNewHighBuyBoxMatches(buyBoxId: string) {
  const buyBox = await prisma.investorBuyBox.findUnique({ where: { id: buyBoxId } });
  if (!buyBox) return;

  const matches = await prisma.buyBoxMatch.findMany({
    where: {
      investorBuyBoxId: buyBoxId,
      alerted: false,
      matchScore: { gte: 80 },
    },
  });

  for (const match of matches) {
    await createAlert({
      ownerType: buyBox.ownerType,
      ownerId: buyBox.ownerId,
      alertType: "buy_box",
      severity: "info",
      title: `Strong buy-box match: ${buyBox.title}`,
      message: `Listing match scored ${Math.round(match.matchScore)} (${match.matchLabel ?? "match"}). Advisory only — human review required; not a purchase recommendation.`,
      referenceType: "buy_box_match",
      referenceId: match.id,
      metadata: {
        buyBoxId: buyBox.id,
        listingId: match.listingId,
      },
    });

    await prisma.buyBoxMatch.update({
      where: { id: match.id },
      data: { alerted: true },
    });

    await recordAuditEvent({
      actorUserId: buyBox.ownerId,
      action: "BUY_BOX_HIGH_MATCH_ALERT",
      payload: { matchId: match.id, buyBoxId: buyBox.id },
    });
  }
}
