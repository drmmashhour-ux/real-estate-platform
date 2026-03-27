import { prisma } from "@/lib/db";
import { recordPlatformEvent } from "@/lib/observability";
import { persistVerificationCaseRun } from "@/lib/trustgraph/application/persistVerificationCaseRun";
import {
  collectBnhubGuestRuleResults,
  collectBnhubHostRuleResults,
  collectBookingRiskRuleResults,
  collectShortTermListingRuleResults,
} from "@/lib/trustgraph/infrastructure/rules/bnhubRulesRegistry";

function photoCountFromListing(l: {
  photos: unknown;
  listingPhotos: { id: string }[];
}): number {
  const fromPhotos = Array.isArray(l.photos) ? l.photos.length : 0;
  return Math.max(fromPhotos, l.listingPhotos.length);
}

export async function runHostVerificationPipeline(args: {
  caseId: string;
  hostId: string;
  actorUserId?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const host = await prisma.bnhubHost.findUnique({ where: { id: args.hostId } });
  if (!host) return { ok: false, error: "Host not found" };

  const results = collectBnhubHostRuleResults({
    name: host.name,
    email: host.email,
    phone: host.phone,
    ownershipConfirmationStatus: host.ownershipConfirmationStatus,
  });

  const outcome = await prisma.$transaction(async (tx) => {
    return persistVerificationCaseRun(tx, {
      caseId: args.caseId,
      results,
      trustProfile: { kind: "host", hostId: args.hostId },
    });
  });

  void recordPlatformEvent({
    eventType: "trustgraph_bnhub_host_verification",
    sourceModule: "trustgraph",
    entityType: "VERIFICATION_CASE",
    entityId: args.caseId,
    payload: {
      hostId: args.hostId,
      overallScore: outcome.overallScore,
      trustLevel: outcome.trustLevel,
      readinessLevel: outcome.readinessLevel,
      actorUserId: args.actorUserId ?? null,
    },
  }).catch(() => {});

  return { ok: true };
}

export async function runGuestVerificationPipeline(args: {
  caseId: string;
  userId: string;
  actorUserId?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const u = await prisma.user.findUnique({
    where: { id: args.userId },
    select: { email: true, name: true, phone: true },
  });
  if (!u) return { ok: false, error: "User not found" };

  const results = collectBnhubGuestRuleResults(u);

  const outcome = await prisma.$transaction(async (tx) => {
    return persistVerificationCaseRun(tx, {
      caseId: args.caseId,
      results,
      trustProfile: { kind: "guestUser", userId: args.userId },
    });
  });

  void recordPlatformEvent({
    eventType: "trustgraph_bnhub_guest_verification",
    sourceModule: "trustgraph",
    entityType: "VERIFICATION_CASE",
    entityId: args.caseId,
    payload: {
      guestUserId: args.userId,
      overallScore: outcome.overallScore,
      trustLevel: outcome.trustLevel,
      readinessLevel: outcome.readinessLevel,
    },
  }).catch(() => {});

  return { ok: true };
}

export async function runShortTermListingVerificationPipeline(args: {
  caseId: string;
  listingId: string;
  actorUserId?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: args.listingId },
    include: { listingPhotos: { select: { id: true } } },
  });
  if (!listing) return { ok: false, error: "Short-term listing not found" };

  const results = collectShortTermListingRuleResults({
    title: listing.title,
    description: listing.description,
    photoCount: photoCountFromListing(listing),
    houseRules: listing.houseRules,
  });

  const outcome = await prisma.$transaction(async (tx) => {
    return persistVerificationCaseRun(tx, {
      caseId: args.caseId,
      results,
      trustProfile: { kind: "none" },
    });
  });

  void recordPlatformEvent({
    eventType: "trustgraph_bnhub_short_term_listing_verification",
    sourceModule: "trustgraph",
    entityType: "VERIFICATION_CASE",
    entityId: args.caseId,
    payload: {
      shortTermListingId: args.listingId,
      overallScore: outcome.overallScore,
      trustLevel: outcome.trustLevel,
      readinessLevel: outcome.readinessLevel,
    },
  }).catch(() => {});

  return { ok: true };
}

export async function runBookingRiskPipeline(args: {
  caseId: string;
  bookingId: string;
  actorUserId?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const booking = await prisma.booking.findUnique({
    where: { id: args.bookingId },
    select: {
      id: true,
      createdAt: true,
      checkIn: true,
      nights: true,
      totalCents: true,
    },
  });
  if (!booking) return { ok: false, error: "Booking not found" };

  const results = collectBookingRiskRuleResults({
    createdAt: booking.createdAt,
    checkIn: booking.checkIn,
    nights: booking.nights,
    totalCents: booking.totalCents,
  });

  const outcome = await prisma.$transaction(async (tx) => {
    return persistVerificationCaseRun(tx, {
      caseId: args.caseId,
      results,
      trustProfile: { kind: "none" },
    });
  });

  void recordPlatformEvent({
    eventType: "trustgraph_bnhub_booking_risk_evaluation",
    sourceModule: "trustgraph",
    entityType: "VERIFICATION_CASE",
    entityId: args.caseId,
    payload: {
      bookingId: args.bookingId,
      overallScore: outcome.overallScore,
      trustLevel: outcome.trustLevel,
      readinessLevel: outcome.readinessLevel,
    },
  }).catch(() => {});

  return { ok: true };
}
