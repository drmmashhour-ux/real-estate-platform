import { prisma } from "@/lib/db";
import { engineFlags } from "@/config/feature-flags";

/** Minimum relative drop to generate candidates (e.g. 0.03 = 3%). */
const MEANINGFUL_DROP_RATIO = 0.03;

function dedupeKey(userId: string, listingId: string, day: string) {
  return `price_drop:${userId}:${listingId}:${day}`;
}

/**
 * When an FSBO price drops, enqueue alert candidates for users who have the listing on a watchlist.
 * Does not send email/push — `AlertCandidate` rows are consumed by a delivery worker later.
 */
export async function onFsboPriceDropForWatchers(args: {
  listingId: string;
  oldPriceCents: number;
  newPriceCents: number;
}): Promise<{ candidatesCreated: number }> {
  if (!engineFlags.priceDropAlertsV1) return { candidatesCreated: 0 };
  if (args.oldPriceCents <= 0 || args.newPriceCents >= args.oldPriceCents) {
    return { candidatesCreated: 0 };
  }

  const dropRatio = (args.oldPriceCents - args.newPriceCents) / args.oldPriceCents;
  if (dropRatio < MEANINGFUL_DROP_RATIO) return { candidatesCreated: 0 };

  const watchers = await prisma.watchlistItem.findMany({
    where: { listingId: args.listingId },
    select: { watchlist: { select: { userId: true } } },
  });
  const userIds = [...new Set(watchers.map((w) => w.watchlist.userId))];
  if (userIds.length === 0) return { candidatesCreated: 0 };

  const day = new Date().toISOString().slice(0, 10);
  let candidatesCreated = 0;

  for (const userId of userIds) {
    const key = dedupeKey(userId, args.listingId, day);
    const existing = await prisma.alertCandidate.findFirst({
      where: { dedupeKey: key },
      select: { id: true },
    });
    if (existing) continue;

    try {
      await prisma.alertCandidate.create({
        data: {
          type: "price_drop_alert",
          userId,
          listingId: args.listingId,
          status: "candidate",
          dedupeKey: key,
          payload: {
            oldPriceCents: args.oldPriceCents,
            newPriceCents: args.newPriceCents,
            dropRatio: Math.round(dropRatio * 10000) / 10000,
          },
        },
      });
      candidatesCreated += 1;
    } catch (e: unknown) {
      const code = typeof e === "object" && e !== null && "code" in e ? (e as { code?: string }).code : undefined;
      if (code === "P2002") continue;
      throw e;
    }
  }

  return { candidatesCreated };
}
