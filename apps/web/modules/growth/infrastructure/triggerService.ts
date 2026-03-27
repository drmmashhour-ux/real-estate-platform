import type { PrismaClient } from "@prisma/client";
import { SubscriptionStatus } from "@prisma/client";
import { scoreLeadForUser } from "@/modules/lead-scoring/infrastructure/leadScoringService";
const PAYING: SubscriptionStatus[] = [
  SubscriptionStatus.trialing,
  SubscriptionStatus.active,
  SubscriptionStatus.past_due,
];

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export async function findUsersInactiveWithListings(db: PrismaClient, limit: number) {
  const cutoff = new Date(Date.now() - THREE_DAYS_MS);
  const rows = await db.user.findMany({
    where: {
      updatedAt: { lt: cutoff },
      OR: [{ shortTermListings: { some: {} } }, { fsboListings: { some: {} } }, { ownedCrmListings: { some: {} } }],
    },
    take: limit,
    select: { id: true, email: true, updatedAt: true },
  });
  return rows;
}

export async function findIncompleteBnhubListings(db: PrismaClient, limit: number) {
  const older = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  return db.shortTermListing.findMany({
    where: {
      listingStatus: "DRAFT",
      createdAt: { lt: older },
    },
    take: limit,
    select: { id: true, ownerId: true, title: true, owner: { select: { email: true } } },
  });
}

export async function findHighScoreWithoutSubscription(db: PrismaClient, limit: number) {
  const candidates = await db.user.findMany({
    take: Math.min(limit * 10, 200),
    orderBy: { updatedAt: "desc" },
    select: { id: true, email: true },
  });
  const out: { userId: string; email: string; score: number }[] = [];
  for (const c of candidates) {
    const sub = await db.subscription.findFirst({
      where: { userId: c.id, status: { in: PAYING } },
    });
    if (sub) continue;
    const { score, category } = await scoreLeadForUser(db, c.id);
    if (category === "high" && c.email) {
      out.push({ userId: c.id, email: c.email, score });
      if (out.length >= limit) break;
    }
  }
  return out;
}

export async function findNewUsersForOnboarding(db: PrismaClient, limit: number) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return db.user.findMany({
    where: { createdAt: { gte: since } },
    take: limit,
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, name: true },
  });
}
