import { ClientFollowUpStatus, ClientFollowUpType, Prisma, UserEventType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import { buildClientFollowUpEmail } from "@/lib/follow-up/follow-up-email";

type InterestSummary = {
  topCities: string[];
  topPropertyTypes: string[];
  savedListingCount: number;
  recentViewCount: number;
  inquiryCount: number;
  compareCount: number;
};

function normalizeStage(score: number) {
  if (score >= 75) return "hot";
  if (score >= 40) return "warm";
  return "cold";
}

function startOfToday() {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  return value;
}

function sameMonthDay(a: Date, b: Date) {
  return a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate();
}

async function enqueueClientFollowUp(input: {
  userId: string;
  type: ClientFollowUpType;
  title: string;
  message: string;
  payload?: Prisma.InputJsonValue;
  dedupeKey: string;
}) {
  return prisma.clientFollowUpQueue.upsert({
    where: { dedupeKey: input.dedupeKey },
    update: {
      title: input.title,
      message: input.message,
      payload: input.payload,
      status: ClientFollowUpStatus.PENDING,
      scheduledAt: new Date(),
      lastError: null,
    },
    create: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      payload: input.payload,
      dedupeKey: input.dedupeKey,
      scheduledAt: new Date(),
    },
  });
}

async function deliverClientFollowUp(item: {
  id: string;
  userId: string;
  type: ClientFollowUpType;
  title: string;
  message: string;
  payload: Prisma.JsonValue | null;
}) {
  const user = await prisma.user.findUnique({
    where: { id: item.userId },
    select: {
      email: true,
      name: true,
    },
  });

  await prisma.notification.create({
    data: {
      userId: item.userId,
      type: "REMINDER",
      title: item.title,
      message: item.message,
      metadata: {
        followUpType: item.type,
        queueId: item.id,
        ...(item.payload && typeof item.payload === "object" ? (item.payload as object) : {}),
      } as Prisma.InputJsonValue,
    },
  });

  if (user?.email) {
    const email = buildClientFollowUpEmail({
      type: item.type,
      name: user.name,
      title: item.title,
      message: item.message,
    });
    await sendEmail({
      to: user.email,
      subject: email.subject,
      html: email.html,
    });
  }

  if (item.type === ClientFollowUpType.BIRTHDAY_GREETING) {
    await prisma.clientCelebrationProfile.updateMany({
      where: { userId: item.userId },
      data: { lastBirthdaySentAt: new Date() },
    });
  }
}

export async function recomputeClientInterestProfile(userId: string) {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 90);

  const [events, savedListings] = await Promise.all([
    prisma.userEvent.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    prisma.buyerSavedListing.findMany({
      where: { userId },
      include: {
        fsboListing: {
          select: {
            city: true,
            propertyType: true,
            priceCents: true,
          },
        },
      },
      take: 100,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const cityCounts = new Map<string, number>();
  const propertyCounts = new Map<string, number>();
  const viewedPrices: number[] = [];
  let recentViewCount = 0;
  let inquiryCount = 0;
  let compareCount = 0;
  let searchCount = 0;

  for (const event of events) {
    const meta = (event.metadata ?? {}) as Record<string, unknown>;
    const city = typeof meta.city === "string" ? meta.city.trim() : "";
    const propertyType = typeof meta.propertyType === "string" ? meta.propertyType.trim() : "";
    const price = typeof meta.priceCents === "number" ? meta.priceCents : typeof meta.price === "number" ? Math.round(meta.price * 100) : null;

    if (city) cityCounts.set(city, (cityCounts.get(city) ?? 0) + 1);
    if (propertyType) propertyCounts.set(propertyType, (propertyCounts.get(propertyType) ?? 0) + 1);
    if (price != null && Number.isFinite(price)) viewedPrices.push(price);

    if (event.eventType === UserEventType.LISTING_VIEW) recentViewCount += 1;
    if (event.eventType === UserEventType.INQUIRY) inquiryCount += 1;
    if (event.eventType === UserEventType.COMPARE) compareCount += 1;
    if (event.eventType === UserEventType.SEARCH_PERFORMED) searchCount += 1;
  }

  for (const saved of savedListings) {
    if (saved.fsboListing?.city) cityCounts.set(saved.fsboListing.city, (cityCounts.get(saved.fsboListing.city) ?? 0) + 3);
    if (saved.fsboListing?.propertyType) {
      propertyCounts.set(saved.fsboListing.propertyType, (propertyCounts.get(saved.fsboListing.propertyType) ?? 0) + 3);
    }
    if (saved.fsboListing?.priceCents) viewedPrices.push(saved.fsboListing.priceCents);
  }

  const topCity = [...cityCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const topPropertyType = [...propertyCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const interestScore = Math.min(
    100,
    recentViewCount * 4 + inquiryCount * 18 + compareCount * 9 + searchCount * 3 + savedListings.length * 12
  );
  const lastActiveAt = events[0]?.createdAt ?? savedListings[0]?.createdAt ?? null;
  const preferredPriceMinCents = viewedPrices.length ? Math.min(...viewedPrices) : null;
  const preferredPriceMaxCents = viewedPrices.length ? Math.max(...viewedPrices) : null;
  const summary: InterestSummary = {
    topCities: [...cityCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([value]) => value),
    topPropertyTypes: [...propertyCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([value]) => value),
    savedListingCount: savedListings.length,
    recentViewCount,
    inquiryCount,
    compareCount,
  };

  return prisma.clientInterestProfile.upsert({
    where: { userId },
    update: {
      topCity,
      topPropertyType,
      topIntentMode: inquiryCount > 0 ? "broker_contact" : compareCount > 0 ? "compare" : "browse",
      preferredPriceMinCents,
      preferredPriceMaxCents,
      interestScore,
      intentStage: normalizeStage(interestScore),
      lastActiveAt,
      computedFromEventsAt: new Date(),
      summaryJson: summary as Prisma.InputJsonValue,
    },
    create: {
      userId,
      topCity,
      topPropertyType,
      topIntentMode: inquiryCount > 0 ? "broker_contact" : compareCount > 0 ? "compare" : "browse",
      preferredPriceMinCents,
      preferredPriceMaxCents,
      interestScore,
      intentStage: normalizeStage(interestScore),
      lastActiveAt,
      computedFromEventsAt: new Date(),
      summaryJson: summary as Prisma.InputJsonValue,
    },
  });
}

export async function generateFollowUpQueueForUser(userId: string) {
  const profile = await recomputeClientInterestProfile(userId);

  if (profile.topCity && profile.intentStage !== "cold") {
    const newMatches = await prisma.fsboListing.findMany({
      where: {
        city: { equals: profile.topCity, mode: "insensitive" },
        ...(profile.topPropertyType ? { propertyType: { equals: profile.topPropertyType, mode: "insensitive" } } : {}),
        ...(profile.preferredPriceMinCents != null || profile.preferredPriceMaxCents != null
          ? {
              priceCents: {
                ...(profile.preferredPriceMinCents != null ? { gte: Math.max(0, profile.preferredPriceMinCents - 1000000) } : {}),
                ...(profile.preferredPriceMaxCents != null ? { lte: profile.preferredPriceMaxCents + 1000000 } : {}),
              },
            }
          : {}),
        createdAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) },
      },
      select: { id: true, title: true, city: true },
      take: 3,
      orderBy: { createdAt: "desc" },
    });

    if (newMatches.length > 0) {
      await enqueueClientFollowUp({
        userId,
        type: ClientFollowUpType.NEW_MATCH,
        title: `${newMatches.length} new offers match your search`,
        message: `Fresh listings in ${profile.topCity} match the client interest profile. Review the latest opportunities now.`,
        payload: {
          listingIds: newMatches.map((match) => match.id),
          city: profile.topCity,
          propertyType: profile.topPropertyType,
        } as Prisma.InputJsonValue,
        dedupeKey: `new-match:${userId}:${startOfToday().toISOString().slice(0, 10)}:${profile.topCity}:${profile.topPropertyType ?? "any"}`,
      });
    }
  }

  if (profile.lastActiveAt) {
    const inactiveDays = Math.floor((Date.now() - profile.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24));
    if (inactiveDays >= 10 && profile.interestScore >= 25) {
      await enqueueClientFollowUp({
        userId,
        type: ClientFollowUpType.INACTIVITY_NUDGE,
        title: "We found new opportunities since your last visit",
        message: "The platform noticed client interest cooling down. Re-engage with fresh listings, comparisons, or broker guidance.",
        payload: { inactiveDays, topCity: profile.topCity } as Prisma.InputJsonValue,
        dedupeKey: `inactive:${userId}:${startOfToday().toISOString().slice(0, 10)}`,
      });
    }
  }

  const celebration = await prisma.clientCelebrationProfile.findUnique({ where: { userId } });
  if (celebration?.allowBirthdayTouch && celebration.birthDate && sameMonthDay(celebration.birthDate, new Date())) {
    const alreadySentThisYear =
      celebration.lastBirthdaySentAt != null &&
      celebration.lastBirthdaySentAt.getUTCFullYear() === new Date().getUTCFullYear();

    if (!alreadySentThisYear) {
      await enqueueClientFollowUp({
        userId,
        type: ClientFollowUpType.BIRTHDAY_GREETING,
        title: "Happy birthday from LECIPM",
        message: "Wishing you a beautiful birthday. When you are ready, we are here to help with the next real estate move.",
        payload: { celebration: "birthday" } as Prisma.InputJsonValue,
        dedupeKey: `birthday:${userId}:${new Date().getUTCFullYear()}`,
      });
    }
  }

  return profile;
}

export async function processClientFollowUpQueue(limit = 25) {
  const pending = await prisma.clientFollowUpQueue.findMany({
    where: {
      status: ClientFollowUpStatus.PENDING,
      scheduledAt: { lte: new Date() },
    },
    orderBy: { scheduledAt: "asc" },
    take: limit,
  });

  for (const item of pending) {
    try {
      await deliverClientFollowUp(item);

      await prisma.clientFollowUpQueue.update({
        where: { id: item.id },
        data: {
          status: ClientFollowUpStatus.SENT,
          sentAt: new Date(),
          lastError: null,
        },
      });
    } catch (error) {
      await prisma.clientFollowUpQueue.update({
        where: { id: item.id },
        data: {
          status: ClientFollowUpStatus.FAILED,
          lastError: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }

  return pending.length;
}

export async function sendClientFollowUpNow(queueId: string) {
  const item = await prisma.clientFollowUpQueue.findUnique({
    where: { id: queueId },
  });
  if (!item) {
    throw new Error("Queue item not found");
  }

  await deliverClientFollowUp(item);

  return prisma.clientFollowUpQueue.update({
    where: { id: queueId },
    data: {
      status: ClientFollowUpStatus.SENT,
      sentAt: new Date(),
      lastError: null,
      scheduledAt: new Date(),
    },
  });
}

export async function skipClientFollowUp(queueId: string) {
  return prisma.clientFollowUpQueue.update({
    where: { id: queueId },
    data: {
      status: ClientFollowUpStatus.SKIPPED,
      lastError: null,
    },
  });
}

export async function requeueClientFollowUp(queueId: string) {
  return prisma.clientFollowUpQueue.update({
    where: { id: queueId },
    data: {
      status: ClientFollowUpStatus.PENDING,
      sentAt: null,
      lastError: null,
      scheduledAt: new Date(),
    },
  });
}

export async function generateFollowUpsForActiveUsers(limit = 50) {
  const activeUsers = await prisma.user.findMany({
    where: {
      OR: [
        { growthUserEvents: { some: { createdAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120) } } } },
        { buyerSavedListings: { some: {} } },
      ],
    },
    select: { id: true },
    take: limit,
  });

  for (const user of activeUsers) {
    await generateFollowUpQueueForUser(user.id);
  }

  return activeUsers.length;
}
