import type { PrismaClient } from "@prisma/client";
import { BookingStatus, BnhubFraudFlagStatus, BnhubSafetyFlagStatus, PaymentStatus } from "@prisma/client";

function photosFromJson(photos: unknown): string[] {
  if (!Array.isArray(photos)) return [];
  return photos.filter((x): x is string => typeof x === "string");
}

function normTitle(t: string): string {
  return t.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Raw BNHUB listing + host account signals — all from Prisma counts / fields.
 * Used by the deterministic scorer only (no fabricated metrics).
 */
export type ShortTermListingFraudRawSignals = {
  listingId: string;
  hostUserId: string;
  titleLen: number;
  descLen: number;
  photoCount: number;
  duplicateTitleOtherOwners: number;
  openBnhubFraudFlags: number;
  openBnhubSafetyFlags: number;
  failedVerificationLogs90d: number;
  listingUpdatedAfterOpenFraudFlag: boolean;
  hostManagerOverrides90d: number;
  hostTrustSafetyIncidents90d: number;
  duplicatePhoneOtherUsers: number;
  failedPaymentsOnListing: number;
  maxGuestRepeatBookings90dSameListing: number;
  cancelledBookings90dOnListing: number;
  reviewsOnListingLast7d: number;
  duplicateReviewCommentBodiesOnListing: boolean;
};

export async function collectShortTermListingFraudSignals(
  db: PrismaClient,
  listingId: string,
): Promise<ShortTermListingFraudRawSignals | null> {
  const listing = await db.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      ownerId: true,
      title: true,
      description: true,
      photos: true,
      updatedAt: true,
      _count: { select: { listingPhotos: true } },
    },
  });
  if (!listing) return null;

  const hostUserId = listing.ownerId;
  const jsonPhotos = photosFromJson(listing.photos);
  const photoCount = Math.max(jsonPhotos.length, listing._count.listingPhotos ?? 0);
  const titleLen = (listing.title ?? "").trim().length;
  const descLen = (listing.description ?? "").trim().length;

  const now = Date.now();
  const d90 = new Date(now - 90 * 86400000);
  const d7 = new Date(now - 7 * 86400000);

  const nt = normTitle(listing.title ?? "");
  let duplicateTitleOtherOwners = 0;
  if (nt.length >= 4) {
    duplicateTitleOtherOwners = await db.shortTermListing.count({
      where: {
        id: { not: listing.id },
        ownerId: { not: hostUserId },
        title: { equals: listing.title, mode: "insensitive" },
      },
    });
  }

  const [
    openFraud,
    openSafety,
    failedVer,
    openFlagsForEdit,
    hostPhoneRow,
    hostOverrides,
    hostIncidents,
    failedPayments,
    guestGroups,
    cancelledCt,
    reviews7d,
    reviewsForDup,
  ] = await Promise.all([
    db.bnhubFraudFlag.count({
      where: { listingId, status: BnhubFraudFlagStatus.OPEN },
    }),
    db.bnhubSafetyFlag.count({
      where: { listingId, status: BnhubSafetyFlagStatus.OPEN },
    }),
    db.listingVerificationLog.count({
      where: { listingId, status: "FAILED", createdAt: { gte: d90 } },
    }),
    db.bnhubFraudFlag.findMany({
      where: { listingId, status: BnhubFraudFlagStatus.OPEN },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
      take: 1,
    }),
    db.user.findUnique({
      where: { id: hostUserId },
      select: { phone: true },
    }),
    db.managerAiOverrideEvent.count({
      where: { actorUserId: hostUserId, createdAt: { gte: d90 } },
    }),
    db.trustSafetyIncident.count({
      where: {
        createdAt: { gte: d90 },
        OR: [{ reporterId: hostUserId }, { accusedUserId: hostUserId }],
      },
    }),
    db.payment.count({
      where: {
        status: PaymentStatus.FAILED,
        booking: { listingId },
      },
    }),
    db.booking.groupBy({
      by: ["guestId"],
      where: {
        listingId,
        createdAt: { gte: d90 },
        status: {
          notIn: [
            BookingStatus.EXPIRED,
            BookingStatus.DECLINED,
            BookingStatus.CANCELLED_BY_GUEST,
            BookingStatus.CANCELLED_BY_HOST,
            BookingStatus.CANCELLED,
          ],
        },
      },
      _count: true,
    }),
    db.booking.count({
      where: {
        listingId,
        createdAt: { gte: d90 },
        status: {
          in: [
            BookingStatus.CANCELLED_BY_GUEST,
            BookingStatus.CANCELLED_BY_HOST,
            BookingStatus.CANCELLED,
          ],
        },
      },
    }),
    db.review.count({
      where: { listingId, createdAt: { gte: d7 } },
    }),
    db.review.findMany({
      where: { listingId, comment: { not: null } },
      select: { comment: true },
    }),
  ]);

  let duplicatePhoneOtherUsers = 0;
  const phone = hostPhoneRow?.phone?.trim();
  if (phone && phone.length >= 8) {
    duplicatePhoneOtherUsers = await db.user.count({
      where: { phone, id: { not: hostUserId } },
    });
  }

  let listingUpdatedAfterOpenFraudFlag = false;
  if (openFlagsForEdit.length) {
    const first = openFlagsForEdit[0]!;
    listingUpdatedAfterOpenFraudFlag = listing.updatedAt > first.createdAt;
  }

  const maxGuestRepeat = guestGroups.reduce((m, g) => Math.max(m, g._count), 0);

  const dupComments = new Map<string, number>();
  for (const r of reviewsForDup) {
    const c = (r.comment ?? "").trim().toLowerCase();
    if (c.length < 24) continue;
    dupComments.set(c, (dupComments.get(c) ?? 0) + 1);
  }
  const duplicateReviewCommentBodiesOnListing = [...dupComments.values()].some((n) => n >= 2);

  return {
    listingId: listing.id,
    hostUserId,
    titleLen,
    descLen,
    photoCount,
    duplicateTitleOtherOwners,
    openBnhubFraudFlags: openFraud,
    openBnhubSafetyFlags: openSafety,
    failedVerificationLogs90d: failedVer,
    listingUpdatedAfterOpenFraudFlag,
    hostManagerOverrides90d: hostOverrides,
    hostTrustSafetyIncidents90d: hostIncidents,
    duplicatePhoneOtherUsers,
    failedPaymentsOnListing: failedPayments,
    maxGuestRepeatBookings90dSameListing: maxGuestRepeat,
    cancelledBookings90dOnListing: cancelledCt,
    reviewsOnListingLast7d: reviews7d,
    duplicateReviewCommentBodiesOnListing,
  };
}
