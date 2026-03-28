/**
 * LECIPM fraud pipeline dry-run + optional DB checks.
 * Run: pnpm --filter @lecipm/web run validate:fraud
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import {
  computeListingFraudSignals,
  type ListingFraudContext,
  type ListingFraudInput,
} from "../src/modules/fraud/listingFraudSignals";
import {
  computeReviewFraudSignals,
  type ReviewFraudContext,
  type ReviewFraudInput,
} from "../src/modules/fraud/reviewFraudSignals";
import {
  classifyRiskLevel,
  buildFraudEvidence,
  saveFraudRiskScore,
} from "../src/modules/fraud/riskScoringEngine";
import { runFullFraudPipeline } from "../src/workers/fraudDetectionWorker";
import { createOrUpdateFraudFlags, enqueueFraudReview, resolveFraudFlag } from "../src/modules/fraud/flaggingEngine";
import type { FraudScoreComputation } from "../src/modules/fraud/types";
import { FRAUD_SCORE_VERSION } from "../src/modules/fraud/types";
import { getBnhubListingFraudRankingAdjustment } from "../src/modules/fraud/fraudRankingIntegration";

config({ path: resolve(process.cwd(), ".env") });

process.env.AI_FRAUD_DETECTION_ENABLED = "1";
process.env.AI_FRAUD_SOFT_RANKING_PENALTY_ENABLED = "1";
process.env.AI_FRAUD_REVIEW_HOLD_ENABLED = "0";

const prisma = new PrismaClient();
const runId = `fraud-${Date.now()}`;

type Cleanup = () => Promise<void>;
const cleanups: Cleanup[] = [];
function defer(fn: Cleanup): void {
  cleanups.push(fn);
}

function sampleListing(over: Partial<ListingFraudInput>): ListingFraudInput {
  const base: ListingFraudInput = {
    id: "sample-id",
    ownerId: "host-a",
    title: "Cozy downtown loft",
    description: "Bright space near transit with full kitchen and workspace.",
    address: "100 Main St, Montreal",
    city: "Montreal",
    region: "QC",
    country: "CA",
    latitude: 45.5,
    longitude: -73.57,
    nightPriceCents: 12000,
    maxGuests: 4,
    beds: 1,
    baths: 1,
    listingStatus: "PUBLISHED",
    verificationStatus: "VERIFIED",
    listingVerificationStatus: "VERIFIED",
    houseRules: "No parties.",
    checkInInstructions: "Lockbox on left.",
    photos: ["https://img.example/a.jpg", "https://img.example/b.jpg"],
    createdAt: new Date(),
  };
  return { ...base, ...over };
}

function inMemoryDemos(): void {
  console.log("\n--- 1–3) Listing signals (in-memory) ---\n");

  const dupCtx: ListingFraudContext = {
    medianNightPriceCentsSameCity: 10000,
    peerListings: [
      {
        id: "peer-1",
        ownerId: "host-a",
        title: "Cozy downtown loft — best location",
        description: "Bright space near transit with full kitchen and workspace.",
        address: "100 Main St",
        nightPriceCents: 11000,
        photos: [],
      },
    ],
    hostRecentListingCount: 2,
    hostCancellationRate: 0.1,
    hostDisputeRate: 0.02,
    photoUrls: ["https://img.example/a.jpg"],
    cityAppearsInAddress: true,
  };
  const dupListing = sampleListing({ id: "l-dup", ownerId: "host-a", title: "Cozy downtown loft — best location" });
  const dupSignals = computeListingFraudSignals(dupListing, dupCtx);
  console.log("Duplicate-style listing:", dupSignals.find((s) => s.code === "duplicate_listing"));

  const cheap = sampleListing({
    id: "l-cheap",
    nightPriceCents: 1500,
    description: "Ok place",
  });
  const cheapCtx: ListingFraudContext = {
    ...dupCtx,
    medianNightPriceCentsSameCity: 10000,
    photoUrls: cheap.photos as string[],
  };
  console.log("Low price:", computeListingFraudSignals(cheap, cheapCtx).find((s) => s.code === "suspicious_price"));

  const badLoc = sampleListing({
    id: "l-loc",
    address: "Remote cabin road 9",
    city: "Montreal",
  });
  const badCtx: ListingFraudContext = {
    ...dupCtx,
    cityAppearsInAddress: false,
    photoUrls: badLoc.photos as string[],
  };
  console.log("Location:", computeListingFraudSignals(badLoc, badCtx).find((s) => s.code === "inconsistent_location"));

  console.log("\n--- 4–5) Review signals (in-memory) ---\n");
  const rev: ReviewFraudInput = {
    id: "r1",
    guestId: "g1",
    listingId: "p1",
    propertyRating: 5,
    comment: "Amazing stay would book again",
    createdAt: new Date(),
    moderationHeld: false,
    spamScore: 0,
  };
  const revCtx: ReviewFraudContext = {
    listingOwnerId: "other",
    bookingStatus: "COMPLETED",
    bookingCheckOut: new Date(Date.now() - 86400000),
    reviewsLast24hOnProperty: 9,
    guestReviewCount30d: 14,
    duplicateCommentElsewhere: true,
    guestRatingStreak: { sameRatingCount: 6, rating: 5 },
  };
  const revSigs = computeReviewFraudSignals(rev, revCtx);
  console.log("Review burst:", revSigs.find((s) => s.code === "review_burst"));
  console.log("Duplicate text:", revSigs.find((s) => s.code === "duplicate_review_text"));
}

async function dbDemos(): Promise<void> {
  console.log("\n--- 6–8) DB pipeline (ephemeral rows) ---\n");

  const host =
    (await prisma.user.findFirst({ where: { email: "host@demo.com" }, select: { id: true } })) ||
    (await prisma.user.findFirst({ where: { role: "HOST" }, select: { id: true } }));
  const admin =
    (await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } })) ||
    (await prisma.user.findFirst({ where: { role: "HOST" }, select: { id: true } }));

  if (!host || !admin) {
    console.log("Skip DB demos: need HOST and a user for admin resolve (seed DB).");
    return;
  }

  const listingCode = `LST-${runId}`;
  const listing = await prisma.shortTermListing.create({
    data: {
      listingCode,
      title: `Fraud validation ${runId}`,
      address: "Nowhere lane",
      city: "Montreal",
      region: "QC",
      country: "CA",
      nightPriceCents: 800,
      beds: 2,
      baths: 1,
      ownerId: host.id,
      listingStatus: "PUBLISHED",
      photos: [],
      description: "x",
    },
  });
  defer(async () => {
    await prisma.fraudFlag.deleteMany({ where: { entityId: listing.id } }).catch(() => {});
    await prisma.fraudReviewQueue.deleteMany({ where: { entityId: listing.id } }).catch(() => {});
    await prisma.fraudRiskScore.deleteMany({ where: { entityId: listing.id } }).catch(() => {});
    await prisma.shortTermListing.delete({ where: { id: listing.id } }).catch(() => {});
  });

  await runFullFraudPipeline("listing", listing.id);

  const scoreRow = await prisma.fraudRiskScore.findUnique({
    where: { entityType_entityId: { entityType: "listing", entityId: listing.id } },
  });
  console.log("Persisted fraud_risk_scores row:", scoreRow?.riskLevel, scoreRow?.riskScore);

  const flags = await prisma.fraudFlag.findMany({ where: { entityId: listing.id } });
  console.log("Sample flags:", flags.map((f) => ({ type: f.flagType, severity: f.severity })));

  const queue = await prisma.fraudReviewQueue.findMany({ where: { entityId: listing.id } });
  console.log("Queue entries:", queue.map((q) => ({ status: q.status, priority: q.priority, reason: q.reasonSummary.slice(0, 80) })));

  const adj = await getBnhubListingFraudRankingAdjustment(listing.id);
  console.log("Ranking soft penalty (env on):", adj);

  const flag = flags[0];
  if (flag) {
    await resolveFraudFlag(flag.id, admin.id, "reviewed", "validation script");
    const after = await prisma.fraudFlag.findUnique({ where: { id: flag.id } });
    console.log("Moderation resolve → flag status:", after?.status);
  }

  const synthetic: FraudScoreComputation = {
    entityType: "listing",
    entityId: "synthetic",
    riskScore: 0.82,
    riskLevel: classifyRiskLevel(0.82),
    signals: [],
    evidenceJson: buildFraudEvidence([]),
  };
  await saveFraudRiskScore(synthetic);
  await createOrUpdateFraudFlags("listing", "synthetic", synthetic);
  await enqueueFraudReview("listing", "synthetic", 70, "Synthetic high-risk entity");
  defer(async () => {
    await prisma.fraudActionLog.deleteMany({ where: { entityId: "synthetic" } }).catch(() => {});
    await prisma.fraudFlag.deleteMany({ where: { entityId: "synthetic" } }).catch(() => {});
    await prisma.fraudReviewQueue.deleteMany({ where: { entityId: "synthetic" } }).catch(() => {});
    await prisma.fraudRiskScore.deleteMany({ where: { entityId: "synthetic" } }).catch(() => {});
  });
  console.log("Synthetic high-risk queue + scoreVersion:", FRAUD_SCORE_VERSION);
}

async function main(): Promise<void> {
  inMemoryDemos();
  try {
    await dbDemos();
  } catch (e) {
    console.error("DB demo error (apply migration 20260329180000_lecipm_fraud_trust_tables if missing):", e);
  } finally {
    for (const fn of cleanups.reverse()) {
      await fn();
    }
    await prisma.$disconnect();
  }
  console.log("\nLECIPM Fraud Detection Active");
}

void main();
