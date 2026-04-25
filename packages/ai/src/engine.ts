/**
 * AI Decision Engine – evaluate listings, bookings, users.
 * Returns riskScore (0–100) and trustLevel (low | medium | high).
 */
import { prisma } from "@/lib/db";
import { logAiDecision } from "./logger";

export type TrustLevel = "low" | "medium" | "high";
export type EntityType = "listing" | "booking" | "user";

export type EvaluateResult = {
  riskScore: number; // 0-100
  trustLevel: TrustLevel;
  factors: string[];
  entityType: EntityType;
  entityId: string;
};

function scoreToTrustLevel(riskScore: number): TrustLevel {
  if (riskScore >= 70) return "low";
  if (riskScore >= 30) return "medium";
  return "high";
}

export async function evaluateListing(listingId: string, options?: { log?: boolean }): Promise<EvaluateResult> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      listingVerificationStatus: true,
      listingStatus: true,
      ownerId: true,
      propertyIdentityId: true,
    },
  });
  if (!listing) throw new Error("Listing not found");

  const factors: string[] = [];
  let riskScore = 20;

  if (listing.listingVerificationStatus === "VERIFIED") {
    factors.push("Listing verified");
    riskScore -= 10;
  } else if (listing.listingVerificationStatus === "REJECTED" || listing.listingVerificationStatus === "PENDING_VERIFICATION") {
    factors.push("Unverified or rejected");
    riskScore += 25;
  }
  if (listing.listingStatus === "UNDER_INVESTIGATION" || listing.listingStatus === "SUSPENDED") {
    factors.push("Under investigation or suspended");
    riskScore += 40;
  }
  if (!listing.propertyIdentityId) factors.push("No property identity linked");

  const fraudScore = await prisma.propertyFraudScore.findUnique({
    where: { listingId },
  });
  if (fraudScore) {
    riskScore = Math.max(riskScore, fraudScore.fraudScore);
    factors.push(`Fraud score: ${fraudScore.fraudScore}`);
  }

  riskScore = Math.min(100, Math.max(0, riskScore));
  const trustLevel = scoreToTrustLevel(riskScore);

  if (options?.log !== false) {
    await logAiDecision({
      action: "evaluate",
      entityType: "listing",
      entityId: listingId,
      riskScore,
      trustLevel,
      details: { factors },
    });
  }

  return { riskScore, trustLevel, factors, entityType: "listing", entityId: listingId };
}

export async function evaluateBooking(bookingId: string, options?: { log?: boolean }): Promise<EvaluateResult> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, status: true, guestId: true, listingId: true },
  });
  if (!booking) throw new Error("Booking not found");

  const factors: string[] = [];
  let riskScore = 15;

  if (booking.status === "DISPUTED") {
    factors.push("Booking disputed");
    riskScore += 50;
  }
  if (booking.status === "CANCELLED") factors.push("Booking cancelled");

  const fraudSignals = await prisma.fraudSignal.count({
    where: { entityType: "BOOKING", entityId: bookingId },
  });
  if (fraudSignals > 0) {
    riskScore += fraudSignals * 15;
    factors.push(`${fraudSignals} fraud signal(s)`);
  }

  riskScore = Math.min(100, Math.max(0, riskScore));
  const trustLevel = scoreToTrustLevel(riskScore);

  if (options?.log !== false) {
    await logAiDecision({
      action: "evaluate",
      entityType: "booking",
      entityId: bookingId,
      riskScore,
      trustLevel,
      details: { factors },
    });
  }

  return { riskScore, trustLevel, factors, entityType: "booking", entityId: bookingId };
}

export async function evaluateUser(userId: string, options?: { log?: boolean }): Promise<EvaluateResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) throw new Error("User not found");

  const factors: string[] = [];
  let riskScore = 20;

  const [incidentCount, fraudCount, hostQuality] = await Promise.all([
    prisma.trustSafetyIncident.count({
      where: { OR: [{ reporterId: userId }, { accusedUserId: userId }] },
    }),
    prisma.fraudScore.count({ where: { entityType: "USER", entityId: userId } }),
    prisma.hostQuality.findUnique({ where: { userId } }),
  ]);

  if (incidentCount > 0) {
    riskScore += incidentCount * 15;
    factors.push(`${incidentCount} trust & safety incident(s)`);
  }
  if (fraudCount > 0) {
    riskScore += 30;
    factors.push("User has fraud score record");
  }
  if (hostQuality?.isSuperHost) {
    factors.push("Super Host");
    riskScore = Math.max(0, riskScore - 15);
  }

  riskScore = Math.min(100, Math.max(0, riskScore));
  const trustLevel = scoreToTrustLevel(riskScore);

  if (options?.log !== false) {
    await logAiDecision({
      action: "evaluate",
      entityType: "user",
      entityId: userId,
      riskScore,
      trustLevel,
      details: { factors },
    });
  }

  return { riskScore, trustLevel, factors, entityType: "user", entityId: userId };
}

export async function evaluate(params: {
  entityType: EntityType;
  entityId: string;
  log?: boolean;
}): Promise<EvaluateResult> {
  const { entityType, entityId, log = true } = params;
  if (entityType === "listing") return evaluateListing(entityId, { log });
  if (entityType === "booking") return evaluateBooking(entityId, { log });
  if (entityType === "user") return evaluateUser(entityId, { log });
  throw new Error(`Unknown entityType: ${entityType}`);
}
