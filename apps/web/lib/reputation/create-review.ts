import type { ReputationEntityType } from "@prisma/client";
import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { updateReputationScore } from "@/lib/reputation/update-reputation-score";

export type CreateReputationReviewInput = {
  authorUserId: string;
  subjectEntityType: ReputationEntityType;
  subjectEntityId: string;
  listingId?: string | null;
  rating: number;
  title?: string | null;
  body?: string | null;
};

async function assertEligible(authorUserId: string, input: CreateReputationReviewInput): Promise<void> {
  const { subjectEntityType, subjectEntityId, listingId } = input;

  if (authorUserId === subjectEntityId && subjectEntityType !== "listing") {
    throw new Error("Cannot review yourself");
  }

  if (subjectEntityType === "listing") {
    if (!listingId || listingId !== subjectEntityId) {
      throw new Error("listing reviews must set listingId to the listing");
    }
    const ok = await prisma.booking.findFirst({
      where: {
        guestId: authorUserId,
        listingId: subjectEntityId,
        status: BookingStatus.COMPLETED,
      },
      select: { id: true },
    });
    if (!ok) throw new Error("Only guests with a completed stay can review this listing");
    return;
  }

  if (subjectEntityType === "host") {
    const ok = await prisma.booking.findFirst({
      where: {
        guestId: authorUserId,
        status: BookingStatus.COMPLETED,
        listing: { ownerId: subjectEntityId },
      },
      select: { id: true },
    });
    if (!ok) throw new Error("Only guests with a completed stay with this host can review");
    return;
  }

  if (subjectEntityType === "broker") {
    const ok = await prisma.brokerLead.findFirst({
      where: {
        brokerId: subjectEntityId,
        OR: [{ buyerId: authorUserId }, { lead: { userId: authorUserId } }],
      },
      select: { id: true },
    });
    if (!ok) throw new Error("Only clients with broker activity can review this broker");
    return;
  }

  if (subjectEntityType === "seller") {
    const author = await prisma.user.findUnique({
      where: { id: authorUserId },
      select: { email: true },
    });
    const touch = await prisma.lead.findFirst({
      where: {
        fsboListing: { ownerId: subjectEntityId },
        OR: [
          { userId: authorUserId },
          ...(author?.email ? [{ email: { equals: author.email, mode: "insensitive" as const } }] : []),
        ],
      },
      select: { id: true },
    });
    if (!touch) throw new Error("Only users with seller listing contact history can review");
    return;
  }

  if (subjectEntityType === "buyer") {
    const touch = await prisma.booking.findFirst({
      where: {
        guestId: subjectEntityId,
        listing: { ownerId: authorUserId },
        status: BookingStatus.COMPLETED,
      },
      select: { id: true },
    });
    if (!touch) throw new Error("Only hosts with a completed stay with this guest can review");
  }
}

export async function createReputationReview(input: CreateReputationReviewInput) {
  if (input.rating < 1 || input.rating > 5) {
    throw new Error("Rating must be 1–5");
  }

  await assertEligible(input.authorUserId, input);

  const status =
    input.subjectEntityType === "listing" || input.subjectEntityType === "host"
      ? ("published" as const)
      : ("pending" as const);

  const row = await prisma.reputationReview.create({
    data: {
      authorUserId: input.authorUserId,
      subjectEntityType: input.subjectEntityType,
      subjectEntityId: input.subjectEntityId,
      listingId: input.listingId ?? null,
      rating: Math.round(input.rating),
      title: input.title?.trim() || null,
      body: input.body?.trim() || null,
      status,
    },
  });

  await updateReputationScore(input.subjectEntityType, input.subjectEntityId);
  if (input.subjectEntityType === "listing") {
    const l = await prisma.shortTermListing.findUnique({
      where: { id: input.subjectEntityId },
      select: { ownerId: true },
    });
    if (l) await updateReputationScore("host", l.ownerId);
  }
  if (input.subjectEntityType === "host") {
    await updateReputationScore("host", input.subjectEntityId);
  }

  return row;
}
